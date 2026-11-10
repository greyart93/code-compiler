// Grading for the SQL track.
//
// Each SQL problem ships a reference query. We run the learner's query and the
// reference query against the same freshly seeded Postgres (see sql-local.ts)
// and compare the result sets, so a different-but-correct query also passes.

import type { SqlProblem } from "@/data/code-tests/types";
import { SQL_REFS, SQL_TABLES } from "@/data/code-tests/sql-data";
import { runLocalSql } from "./sql-local";

export type SqlRunResult = {
  pass: boolean;
  error: string | null;
  columns: string[];
  rows: string[][];
  want: string[][];
  wantColumns: string[];
  /** Set when the query returned no result set at all */
  noRows?: boolean;
};

/** ISO timestamps are noisy in a result grid — show the date/time part only. */
export function prettyCell(value: string): string {
  const iso = /^(\d{4}-\d{2}-\d{2})T00:00:00\.000Z$/.exec(value);
  return iso ? iso[1] : value;
}

function compareKey(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "number") return String(Number(value.toFixed(6)));
  if (typeof value === "boolean") return value ? "true" : "false";

  const text = String(value);
  if (/^-?\d+(\.\d+)?$/.test(text)) return String(Number(Number(text).toFixed(6)));
  return text;
}

type QueryOutcome =
  | { ok: true; columns: string[]; rows: string[][] }
  | { ok: false; error: string };

async function runQuery(query: string): Promise<QueryOutcome> {
  const result = await runLocalSql(query, SQL_TABLES, SQL_REFS);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const withRows = result.statements.filter((statement) => statement.fields.length > 0);
  const last = withRows[withRows.length - 1];
  if (!last) {
    return { ok: false, error: "That query ran, but returned no rows. A SELECT is expected." };
  }

  return {
    ok: true,
    columns: last.fields,
    rows: last.rows.map((row) => row.map(compareKey)),
  };
}

export async function runSqlProblem(problem: SqlProblem, query: string): Promise<SqlRunResult> {
  const empty: SqlRunResult = {
    pass: false,
    error: null,
    columns: [],
    rows: [],
    want: [],
    wantColumns: [],
  };

  if (!query.trim()) {
    return { ...empty, error: "Write a query first." };
  }

  // Sequential on purpose: runLocalSql reseeds one shared PGlite instance, so two
  // concurrent runs would race on CREATE TABLE.
  const got = await runQuery(query);
  const want = await runQuery(problem.solution);

  if (!want.ok) {
    // A broken reference query is our bug, not the learner's.
    return { ...empty, error: `Reference query failed: ${want.error}` };
  }

  const wantRows = problem.ordered === false
    ? [...want.rows].sort((a, b) => a.join("\u0000").localeCompare(b.join("\u0000")))
    : want.rows;

  if (!got.ok) {
    return {
      ...empty,
      error: got.error,
      want: wantRows.slice(0, 50),
      wantColumns: want.columns,
    };
  }

  const gotRows = problem.ordered === false
    ? [...got.rows].sort((a, b) => a.join("\u0000").localeCompare(b.join("\u0000")))
    : got.rows;

  const pass =
    gotRows.length === wantRows.length &&
    gotRows.every((row, index) => row.join("\u0000") === wantRows[index].join("\u0000"));

  return {
    pass,
    error: null,
    columns: got.columns,
    rows: gotRows.slice(0, 50),
    want: wantRows.slice(0, 50),
    wantColumns: want.columns,
    noRows: got.rows.length === 0 && wantRows.length > 0,
  };
}
