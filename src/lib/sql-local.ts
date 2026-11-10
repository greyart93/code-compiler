// Local SQL execution for the Postgres engine.
//
// runsql.com is read-only, so DDL/DML can never run there. For Postgres we run
// a real Postgres 16 (PGlite, WASM) in the browser instead: the schema and data
// grid are rebuilt into a throwaway database on every run, the user's script is
// executed statement by statement, and each statement reports its own result.
// Nothing leaves the tab and every run starts from the same clean database.

import type { SqlCell, SqlRef, SqlStatementResult, SqlTable } from "./sql-lab";

type PgliteResult = {
  rows?: unknown[];
  fields?: { name: string }[];
  affectedRows?: number;
};

type PgliteDatabase = {
  exec(sql: string): Promise<unknown>;
  query(
    sql: string,
    params?: unknown[],
    options?: { rowMode?: "array" | "object" }
  ): Promise<PgliteResult>;
};

export type LocalRunResult =
  | { ok: true; statements: SqlStatementResult[]; totalTimeInMs: number }
  | {
      ok: false;
      error: string;
      stage: "data" | "query";
      statements: SqlStatementResult[];
      statementIndex: number | null;
    };

const IDENTIFIER_TYPES: Record<string, string> = {
  string: "text",
  longtext: "text",
  mediumtext: "text",
  blob: "bytea",
  datetime: "timestamp",
  double: "double precision",
  float: "real",
  "unsigned int": "integer",
  "unsigned bigint": "bigint",
  json: "jsonb",
  serial: "serial",
  bigserial: "bigserial",
};

const NUMERIC_TYPE = /(int|numeric|decimal|float|double|real|money|serial)/i;
const BOOLEAN_TYPE = /bool/i;

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Keep DBML-ish type names, map a few dialects, fall back to text. */
export function pgTypeFromDbml(type: string): string {
  const normalized = type.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return "text";

  const mapped = IDENTIFIER_TYPES[normalized];
  if (mapped) return mapped;

  if (/^[a-z][a-z0-9 ]*(\(\s*\d+(\s*,\s*\d+)?\s*\))?(\[\])?$/.test(normalized)) {
    return normalized;
  }
  return "text";
}

function pgLiteral(value: SqlCell, type: string): string {
  if (value === null || value === undefined) return "NULL";

  if (typeof value === "boolean") {
    if (NUMERIC_TYPE.test(type)) return value ? "1" : "0";
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  const text = value.trim();
  if (!text) return "NULL";

  if (NUMERIC_TYPE.test(type)) {
    const parsed = Number(text.replace(/,/g, ""));
    return Number.isFinite(parsed) ? String(parsed) : `'${text.replace(/'/g, "''")}'`;
  }
  if (BOOLEAN_TYPE.test(type)) {
    if (/^(true|1|yes|t|y)$/i.test(text)) return "true";
    if (/^(false|0|no|f|n)$/i.test(text)) return "false";
  }

  return `'${text.replace(/'/g, "''")}'`;
}

function chunk<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

/**
 * Build the statements that recreate the schema + sample rows.
 * Tables and rows come first, then foreign keys, so seeding can never fail
 * because of table/insert ordering.
 */
export function buildSeedSql(tables: SqlTable[], refs: SqlRef[] = []): string[] {
  const statements: string[] = [];
  const byName = new Map(tables.filter((table) => table.columns.length).map((table) => [table.name, table]));

  for (const table of tables) {
    if (!table.columns.length) continue;
    const columnNames = new Set(table.columns.map((column) => column.name));
    const primaryKey = (table.primaryKey ?? []).filter((column) => columnNames.has(column));
    const uniqueKeys = (table.uniqueKeys ?? [])
      .map((key) => key.filter((column) => columnNames.has(column)))
      .filter((key) => key.length > 0);

    const definitions = table.columns.map((column) => {
      const parts = [`${quoteIdentifier(column.name)} ${pgTypeFromDbml(column.type)}`];
      if (primaryKey.length === 1 && primaryKey[0] === column.name) {
        parts.push("PRIMARY KEY");
      } else if (uniqueKeys.some((key) => key.length === 1 && key[0] === column.name)) {
        parts.push("UNIQUE");
      }
      return parts.join(" ");
    });

    if (primaryKey.length > 1) {
      definitions.push(`PRIMARY KEY (${primaryKey.map(quoteIdentifier).join(", ")})`);
    }
    for (const key of uniqueKeys) {
      if (key.length > 1) definitions.push(`UNIQUE (${key.map(quoteIdentifier).join(", ")})`);
    }

    statements.push(`CREATE TABLE ${quoteIdentifier(table.name)} (${definitions.join(", ")});`);
  }

  for (const table of tables) {
    if (!table.columns.length || !table.rows.length) continue;

    const columnList = table.columns.map((column) => quoteIdentifier(column.name)).join(", ");
    for (const rows of chunk(table.rows, 200)) {
      const values = rows
        .map(
          (row) =>
            `(${table.columns
              .map((column, index) => pgLiteral(row[index], column.type))
              .join(", ")})`
        )
        .join(", ");
      statements.push(`INSERT INTO ${quoteIdentifier(table.name)} (${columnList}) VALUES ${values};`);
    }
  }

  const seenRefs = new Set<string>();
  for (const ref of refs) {
    const signature = [ref.fromTable, ref.fromColumns.join(","), ref.toTable, ref.toColumns.join(",")].join("|");
    if (seenRefs.has(signature)) continue;
    seenRefs.add(signature);

    const from = byName.get(ref.fromTable);
    const to = byName.get(ref.toTable);
    if (!from || !to) continue;
    if (!ref.fromColumns.length || ref.fromColumns.length !== ref.toColumns.length) continue;
    if (!ref.fromColumns.every((column) => from.columns.some((item) => item.name === column))) continue;
    if (!ref.toColumns.every((column) => to.columns.some((item) => item.name === column))) continue;

    // A foreign key needs a primary/unique key on the referenced columns.
    const targetKey = to.primaryKey ?? [];
    const targetUnique = to.uniqueKeys ?? [];
    const referencesKey =
      (targetKey.length === ref.toColumns.length &&
        targetKey.every((column) => ref.toColumns.includes(column))) ||
      targetUnique.some(
        (key) => key.length === ref.toColumns.length && key.every((column) => ref.toColumns.includes(column))
      );
    if (!referencesKey) continue;

    const name = `fk_${from.name}_${ref.fromColumns.join("_")}`
      .replace(/[^A-Za-z0-9_]+/g, "_")
      .slice(0, 60);
    statements.push(
      `ALTER TABLE ${quoteIdentifier(from.name)} ADD CONSTRAINT ${quoteIdentifier(name)} ` +
        `FOREIGN KEY (${ref.fromColumns.map(quoteIdentifier).join(", ")}) ` +
        `REFERENCES ${quoteIdentifier(to.name)} (${ref.toColumns.map(quoteIdentifier).join(", ")});`
    );
  }

  return statements;
}

function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .trim();
}

/**
 * Split a script into individual statements so each one can report its own
 * result. Handles semicolons inside strings, quoted identifiers, dollar-quoted
 * bodies ($$ ... $$, $tag$ ... $tag$) and comments.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  const length = sql.length;
  let current = "";
  let index = 0;

  while (index < length) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === "-" && next === "-") {
      const end = sql.indexOf("\n", index);
      const stop = end === -1 ? length : end + 1;
      current += sql.slice(index, stop);
      index = stop;
      continue;
    }

    if (char === "/" && next === "*") {
      let depth = 1;
      let cursor = index + 2;
      while (cursor < length && depth > 0) {
        if (sql[cursor] === "/" && sql[cursor + 1] === "*") {
          depth += 1;
          cursor += 2;
          continue;
        }
        if (sql[cursor] === "*" && sql[cursor + 1] === "/") {
          depth -= 1;
          cursor += 2;
          continue;
        }
        cursor += 1;
      }
      current += sql.slice(index, cursor);
      index = cursor;
      continue;
    }

    if (char === "'" || char === '"') {
      const quote = char;
      let cursor = index + 1;
      while (cursor < length) {
        if (sql[cursor] === quote) {
          if (sql[cursor + 1] === quote) {
            cursor += 2;
            continue;
          }
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      current += sql.slice(index, cursor);
      index = cursor;
      continue;
    }

    if (char === "$") {
      const tag = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(sql.slice(index));
      if (tag) {
        const marker = tag[0];
        const end = sql.indexOf(marker, index + marker.length);
        const stop = end === -1 ? length : end + marker.length;
        current += sql.slice(index, stop);
        index = stop;
        continue;
      }
    }

    if (char === ";") {
      statements.push(current);
      current = "";
      index += 1;
      continue;
    }

    current += char;
    index += 1;
  }

  statements.push(current);

  return statements.map((statement) => statement.trim()).filter((statement) => stripComments(statement));
}

export function sqlCommand(statement: string): string {
  const match = stripComments(statement).match(/^[A-Za-z]+/);
  return match ? match[0].toUpperCase() : "SQL";
}

function normalizeCell(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return `\\x${Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  return value;
}

function formatDatabaseError(error: unknown): string {
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; hint?: unknown; detail?: unknown };
    const message = typeof candidate.message === "string" ? candidate.message : "";
    const cleaned = message.replace(/^error:\s*/i, "").replace(/\s+at character \d+$/, "").trim();
    if (cleaned) {
      const detail =
        typeof candidate.detail === "string" && candidate.detail.trim()
          ? ` ${candidate.detail.trim()}`
          : typeof candidate.hint === "string" && candidate.hint.trim()
            ? ` Hint: ${candidate.hint.trim()}`
            : "";
      return `${cleaned}${detail}`;
    }
  }
  return "The query could not be executed.";
}

type DatabaseHandle = { db: PgliteDatabase };
let databasePromise: Promise<DatabaseHandle> | null = null;

async function getDatabase(): Promise<PgliteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const module = await import("@electric-sql/pglite");
      const Constructor = module.PGlite as unknown as new () => PgliteDatabase;
      return { db: new Constructor() };
    })().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  const handle = await databasePromise;
  return handle.db;
}

const SYSTEM_SCHEMAS = "'pg_catalog', 'information_schema', 'pg_toast'";

async function resetDatabase(db: PgliteDatabase): Promise<void> {
  // Drop everything the previous run created (public plus any user schemas).
  const extra = await db.query(
    `select nspname from pg_namespace
      where nspname not in (${SYSTEM_SCHEMAS})
        and nspname not like 'pg\\_temp%'
        and nspname not like 'pg\\_toast%'`,
    [],
    { rowMode: "array" }
  );

  for (const row of (extra.rows ?? []) as unknown[][]) {
    const schema = row[0];
    if (typeof schema === "string") {
      await db.exec(`drop schema if exists ${quoteIdentifier(schema)} cascade;`);
    }
  }

  await db.exec("create schema if not exists public;");
}

/** Execute `script` against a fresh database seeded from the data panel. */
export async function runLocalSql(
  script: string,
  tables: SqlTable[],
  refs: SqlRef[] = []
): Promise<LocalRunResult> {
  let db: PgliteDatabase;
  try {
    db = await getDatabase();
  } catch {
    return {
      ok: false,
      stage: "query",
      error: "The local Postgres engine could not start. Reload the page and try again.",
      statements: [],
      statementIndex: null,
    };
  }

  try {
    await resetDatabase(db);
    for (const statement of buildSeedSql(tables, refs)) {
      await db.exec(statement);
    }
  } catch (error) {
    return {
      ok: false,
      stage: "data",
      error: `The sample data could not be loaded: ${formatDatabaseError(error)}`,
      statements: [],
      statementIndex: null,
    };
  }

  const statements = splitSqlStatements(script);
  const results: SqlStatementResult[] = [];
  const runStarted = performance.now();

  for (const [index, statement] of statements.entries()) {
    const started = performance.now();
    try {
      const result = await db.query(statement, [], { rowMode: "array" });
      const fields = (result.fields ?? []).map((field) => field.name);
      const rows = (result.rows ?? []) as unknown[][];
      const affectedRows =
        typeof result.affectedRows === "number" && Number.isFinite(result.affectedRows)
          ? Math.max(0, Math.trunc(result.affectedRows))
          : null;

      results.push({
        sql: statement,
        command: sqlCommand(statement),
        fields,
        rows: fields.length ? rows.map((row) => row.map(normalizeCell)) : [],
        affectedRows: fields.length ? null : affectedRows,
        elapsedMs: performance.now() - started,
      });
    } catch (error) {
      return {
        ok: false,
        stage: "query",
        error:
          statements.length > 1
            ? `Statement ${index + 1} of ${statements.length}: ${formatDatabaseError(error)}`
            : formatDatabaseError(error),
        statements: results,
        statementIndex: index,
      };
    }
  }

  return {
    ok: true,
    statements: results,
    totalTimeInMs: performance.now() - runStarted,
  };
}
