import { NextResponse } from "next/server";

import { SQL_ENGINES } from "@/lib/sql-lab";

const RUNSQL_URL = "https://api.runsql.com/fiddles/execute";
const ALLOWED_ENGINES = new Set<string>(SQL_ENGINES.map((engine) => engine.value));

// The sandbox endpoint can take a few seconds on a cold engine.
export const maxDuration = 30;

type SqlPayload = {
  dbml?: unknown;
  dataSample?: unknown;
  query?: unknown;
  databaseType?: unknown;
};

function fail(status: number, error: string, stage?: string) {
  return NextResponse.json(stage ? { error, stage } : { error }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeSample(value: unknown): Record<string, unknown[][]> | null {
  if (!isRecord(value)) return null;

  const sample: Record<string, unknown[][]> = Object.create(null) as Record<
    string,
    unknown[][]
  >;
  for (const [key, rows] of Object.entries(value)) {
    if (!key || key.length > 200) return null;
    if (!Array.isArray(rows)) return null;
    if (rows.length > 2_000) return null;

    const normalizedRows: unknown[][] = [];
    for (const row of rows) {
      if (!Array.isArray(row) || row.length > 250) return null;
      normalizedRows.push(row);
    }
    sample[key] = normalizedRows;
  }

  return sample;
}

export async function POST(request: Request) {
  let payload: SqlPayload;
  try {
    payload = (await request.json()) as SqlPayload;
  } catch {
    return fail(400, "Send a JSON body with dbml, dataSample, query and databaseType.");
  }

  const dbml = typeof payload.dbml === "string" ? payload.dbml : "";
  const query = typeof payload.query === "string" ? payload.query : "";
  const databaseType = typeof payload.databaseType === "string" ? payload.databaseType : "";

  if (!ALLOWED_ENGINES.has(databaseType)) {
    return fail(400, "Choose PostgreSQL, SQL Server or MySQL.");
  }
  if (dbml.length > 60_000) {
    return fail(413, "The schema is too large. Keep it under 60,000 characters.");
  }
  if (query.length > 30_000) {
    return fail(413, "The query is too large. Keep it under 30,000 characters.");
  }

  const dataSample = normalizeSample(payload.dataSample);
  if (!dataSample) {
    return fail(400, "The sample data is not in a valid table format.");
  }

  const serialized = JSON.stringify({ dbml, dataSample, query, databaseType });
  if (serialized.length > 1_500_000) {
    return fail(413, "The sample data is too large to run.");
  }

  const controller = new AbortController();
  const timeoutMs = databaseType === "mssql-2022" ? 8_000 : 15_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(RUNSQL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: serialized,
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await upstream.text();
    let responseBody: unknown = null;
    try {
      responseBody = text ? JSON.parse(text) : null;
    } catch {
      responseBody = null;
    }

    if (!upstream.ok) {
      const body = isRecord(responseBody) ? responseBody : {};
      const message =
        (typeof body.message === "string" && body.message) ||
        (typeof body.error === "string" && body.error) ||
        "The SQL engine could not run this query.";
      const stage = typeof body.stage === "string" ? body.stage : undefined;

      const friendlyMessage = /permission denied|read-only/i.test(message)
        ? "This SQL sandbox is read-only. SELECT queries run, but DDL and write statements are blocked."
        : message;

      if (upstream.status >= 500) {
        const engine = SQL_ENGINES.find((item) => item.value === databaseType);
        return fail(
          502,
          `${engine?.short ?? "That"} is unavailable right now. Try another engine or run the query again in a moment.`,
          "engine"
        );
      }

      return fail(upstream.status === 413 ? 413 : 400, friendlyMessage, stage);
    }

    const body = isRecord(responseBody) ? responseBody : {};
    const rows = Array.isArray(body.rows) ? body.rows.filter(Array.isArray) : [];
    const rowCount =
      typeof body.rowCount === "number" && Number.isFinite(body.rowCount)
        ? Math.max(0, Math.trunc(body.rowCount))
        : Math.max(0, rows.length - 1);
    const totalTimeInMs =
      typeof body.totalTimeInMs === "number" && Number.isFinite(body.totalTimeInMs)
        ? Math.max(0, body.totalTimeInMs)
        : null;

    return NextResponse.json({ rows, rowCount, totalTimeInMs });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return fail(
        504,
        databaseType === "mssql-2022"
          ? "SQL Server did not respond in time. Try PostgreSQL or MySQL while the engine is unavailable."
          : "The SQL service took too long to respond. Try a smaller query."
      );
    }
    return fail(502, "Could not reach the SQL service. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }
}
