// SQL Lab helpers: a small DBML reader, data-sample builder, and CSV writer.
//
// runsql.com exposes a single JSON endpoint that accepts a DBML schema, a
// per-table sample data set and one SQL query. We keep the editor state in a
// simple table model so the data grid can stay in sync with the schema.

export type SqlCell = string | number | boolean | null;

export type SqlColumn = {
  name: string;
  type: string;
};

export type SqlTable = {
  name: string;
  columns: SqlColumn[];
  rows: SqlCell[][];
  /** Column names from `[pk]` / `[primary key]`; composite keys have >1 entry. */
  primaryKey?: string[];
  /** One entry per `[unique]` / `indexes { … [unique] }` declaration. */
  uniqueKeys?: string[][];
};

/** A `Ref:` line, normalized to "from references to". */
export type SqlRef = {
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
};

export type SqlStatementResult = {
  /** The statement that produced this result, trimmed. */
  sql: string;
  /** Leading keyword, e.g. SELECT, INSERT, CREATE. */
  command: string;
  /** Column names; empty when the statement returns no result set. */
  fields: string[];
  rows: unknown[][];
  /** Rows changed by INSERT/UPDATE/DELETE; null for statements that return rows. */
  affectedRows: number | null;
  elapsedMs: number;
};

export type SqlRunResult = {
  statements: SqlStatementResult[];
  totalTimeInMs: number;
};

export const SQL_ENGINES = [
  // Postgres runs locally through PGlite (currently Postgres 18.6); the value
  // stays `postgres-16` so saved drafts and the API route keep working.
  { value: "postgres-16", label: "PostgreSQL 18.6", short: "Postgres" },
  { value: "mssql-2022", label: "SQL Server 2022", short: "SQL Server" },
  { value: "mysql-8.4", label: "MySQL 8.4", short: "MySQL" },
] as const;

export type SqlEngine = (typeof SQL_ENGINES)[number]["value"];

export const DEFAULT_SQL_SCHEMA = `// CodeVit SQL Lab — DBML schema
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key]
  first_name varchar(80)
  name varchar(120)
  email varchar(255)
  age integer
  status varchar(20)
  is_admin boolean
  created_at timestamp
}

Table orders {
  id integer [primary key]
  user_id integer [not null]
  amount numeric(10,2)
  status varchar(20)
  created_at timestamp
  order_date timestamp
}

Table employees {
  id integer [primary key]
  name varchar(120)
  department varchar(80)
  salary numeric(10,2)
  manager_id integer
}

Table counters {
  id integer [primary key]
  n integer
}

Table folders {
  id integer [primary key]
  name varchar(120)
  parent_id integer
}

Table accounts {
  id integer [primary key]
  name varchar(120)
  balance numeric(12,2)
}

Ref: orders.user_id > users.id
Ref: folders.parent_id > folders.id
`;

export const DEFAULT_SQL_QUERY = `-- Users with their order count and lifetime value
SELECT
  u.id,
  u.first_name,
  u.email,
  COUNT(o.id) AS orders,
  COALESCE(SUM(o.amount), 0) AS lifetime_value
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.first_name, u.email
ORDER BY lifetime_value DESC;
`;

export const DEFAULT_SQL_TABLES: SqlTable[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "integer" },
      { name: "first_name", type: "varchar(80)" },
      { name: "name", type: "varchar(120)" },
      { name: "email", type: "varchar(255)" },
      { name: "age", type: "integer" },
      { name: "status", type: "varchar(20)" },
      { name: "is_admin", type: "boolean" },
      { name: "created_at", type: "timestamp" },
    ],
    rows: [
      [1, "Ada", "Ada Lovelace", "ada@example.com", 36, "active", true, "2025-01-04"],
      [2, "Grace", "Grace Hopper", "grace@example.com", 42, "active", true, "2025-01-09"],
      [3, "Alan", "Alan Turing", "alan@example.com", 41, "trial", false, "2025-02-11"],
      [4, "Margaret", "Margaret Hamilton", "margaret@example.com", 29, "active", false, "2025-03-02"],
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "integer" },
      { name: "user_id", type: "integer" },
      { name: "amount", type: "numeric(10,2)" },
      { name: "status", type: "varchar(20)" },
      { name: "created_at", type: "timestamp" },
      { name: "order_date", type: "timestamp" },
    ],
    rows: [
      [101, 1, 129.9, "paid", "2025-02-02", "2025-02-02"],
      [102, 1, 42.5, "paid", "2025-02-18", "2025-02-18"],
      [103, 2, 310, "pending", "2025-03-01", "2025-03-01"],
      [104, 3, 75.25, "refunded", "2025-03-14", "2025-03-14"],
      [105, 2, 88, "paid", "2025-03-21", "2025-03-21"],
    ],
  },
  {
    name: "employees",
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "varchar(120)" },
      { name: "department", type: "varchar(80)" },
      { name: "salary", type: "numeric(10,2)" },
      { name: "manager_id", type: "integer" },
    ],
    rows: [
      [1, "Ada Lovelace", "Engineering", 9500, 3],
      [2, "Grace Hopper", "Engineering", 8800, 1],
      [3, "Alan Turing", "Research", 10200, null],
      [4, "Margaret Hamilton", "Engineering", 9100, 1],
      [5, "Katherine Johnson", "Research", 8400, 3],
    ],
  },
  {
    name: "counters",
    columns: [
      { name: "id", type: "integer" },
      { name: "n", type: "integer" },
    ],
    rows: [[1, 1]],
  },
  {
    name: "folders",
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "varchar(120)" },
      { name: "parent_id", type: "integer" },
    ],
    rows: [
      [1, "root", null],
      [2, "docs", 1],
      [3, "images", 1],
      [4, "react", 2],
    ],
  },
  {
    name: "accounts",
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "varchar(120)" },
      { name: "balance", type: "numeric(12,2)" },
    ],
    rows: [
      [1, "Ada", 1000],
      [2, "Grace", 500],
    ],
  },
];

export const DEFAULT_SQL_ACTIVE_TABLE = "users";

export function cloneSqlTables(tables: SqlTable[]): SqlTable[] {
  return tables.map((table) => ({
    name: table.name,
    columns: table.columns.map((column) => ({ ...column })),
    rows: table.rows.map((row) => [...row]),
    primaryKey: table.primaryKey ? [...table.primaryKey] : undefined,
    uniqueKeys: table.uniqueKeys ? table.uniqueKeys.map((key) => [...key]) : undefined,
  }));
}

/** One row that the declared keys would reject, with the cells to blame. */
export type SqlConstraintViolation = {
  /** Column indexes of the key that is broken. */
  columnIndexes: number[];
  /** Short explanation, e.g. `Duplicate primary key (id) = (1)`. */
  message: string;
};

function isBlankCell(cell: SqlCell | undefined): boolean {
  if (cell === null || cell === undefined) return true;
  return typeof cell === "string" && cell.trim() === "";
}

function cellKey(values: SqlCell[]): string {
  return values.map((cell) => (cell === null ? "\u0000" : String(cell))).join("\u0001");
}

/**
 * Dry-run the table's `[pk]` / `[unique]` keys against the grid so the editor
 * can flag rows that would fail on run. Mirrors Postgres: primary-key columns
 * reject NULL, unique keys allow any number of NULLs but no duplicate
 * non-NULL tuples. Blank cells are NULL (the grid's own convention).
 */
export function findConstraintViolations(
  table: SqlTable
): Map<number, SqlConstraintViolation[]> {
  const violations = new Map<number, SqlConstraintViolation[]>();
  const indexOfName = new Map(table.columns.map((column, index) => [column.name, index]));

  const add = (rowIndex: number, columnIndexes: number[], message: string) => {
    const existing = violations.get(rowIndex);
    if (!existing) {
      violations.set(rowIndex, [{ columnIndexes, message }]);
      return;
    }
    if (!existing.some((violation) => violation.message === message)) {
      existing.push({ columnIndexes, message });
    }
  };

  const keys: { columns: string[]; primary: boolean }[] = [];
  if (table.primaryKey?.length) {
    keys.push({ columns: table.primaryKey, primary: true });
  }
  for (const key of table.uniqueKeys ?? []) {
    if (key.length) keys.push({ columns: key, primary: false });
  }

  for (const key of keys) {
    const columnIndexes = key.columns.map((name) => indexOfName.get(name));
    if (columnIndexes.some((index) => index === undefined)) continue;

    const indexes = columnIndexes as number[];
    const label = `${key.primary ? "Primary key" : "Unique key"} (${key.columns.join(", ")})`;
    const rowsByValue = new Map<string, { rows: number[]; values: SqlCell[] }>();

    table.rows.forEach((row, rowIndex) => {
      const values = indexes.map((index) => row[index] ?? null);

      if (key.primary && values.some(isBlankCell)) {
        add(rowIndex, indexes, `${label} cannot be empty`);
        return;
      }
      if (values.some(isBlankCell)) return;

      const hash = cellKey(values);
      const bucket = rowsByValue.get(hash);
      if (bucket) {
        bucket.rows.push(rowIndex);
      } else {
        rowsByValue.set(hash, { rows: [rowIndex], values });
      }
    });

    for (const { rows, values } of rowsByValue.values()) {
      if (rows.length < 2) continue;
      const message = `Duplicate ${key.primary ? "primary key" : "unique key"} (${key.columns.join(
        ", "
      )}) = (${values.map((cell) => String(cell)).join(", ")})`;
      for (const rowIndex of rows) add(rowIndex, indexes, message);
    }
  }

  return violations;
}

/** Per-row status of the grid relative to the last loaded or run data. */
export type SqlRowChange = "same" | "edited" | "added";

/** How the grid differs from the data that was last loaded or run. */
export type SqlRowDiff = {
  added: number;
  edited: number;
  deleted: number;
  /** Status for each row of the grid, in grid order. */
  changes: SqlRowChange[];
};

/** A row reduced to a comparable value, so a copy of the rows is cheap to keep. */
export function sqlRowSignatures(rows: SqlCell[][]): string[] {
  return rows.map((row) =>
    row
      .map((cell) => (cell === null || cell === undefined ? "\u0000" : String(cell)))
      .join("\u0001")
  );
}

/**
 * Compare the grid against a baseline. Rows are aligned on their untouched
 * matches, and each differing block is paired off as edits first, then the
 * leftover rows count as deletions (baseline only) or additions (grid only).
 */
export function diffSqlRowSignatures(
  baseline: string[],
  current: string[]
): SqlRowDiff {
  const currentLength = current.length;
  const changes: SqlRowChange[] = new Array<SqlRowChange>(currentLength).fill("same");
  const diff: SqlRowDiff = { added: 0, edited: 0, deleted: 0, changes };
  const baselineLength = baseline.length;

  if (!baselineLength && !currentLength) return diff;

  const tally = (baseRun: number, currentStart: number, currentRun: number) => {
    const paired = Math.min(baseRun, currentRun);
    diff.edited += paired;
    for (let offset = 0; offset < paired; offset += 1) {
      changes[currentStart + offset] = "edited";
    }
    for (let offset = paired; offset < currentRun; offset += 1) {
      changes[currentStart + offset] = "added";
    }
    if (baseRun > paired) diff.deleted += baseRun - paired;
    if (currentRun > paired) diff.added += currentRun - paired;
  };

  // Very large grids fall back to a positional comparison to stay responsive.
  if (baselineLength * currentLength > 200_000) {
    const shared = Math.min(baselineLength, currentLength);
    for (let index = 0; index < shared; index += 1) {
      if (baseline[index] !== current[index]) {
        diff.edited += 1;
        changes[index] = "edited";
      }
    }
    for (let index = shared; index < currentLength; index += 1) changes[index] = "added";
    diff.deleted += Math.max(0, baselineLength - shared);
    diff.added += Math.max(0, currentLength - shared);
    return diff;
  }

  const lcs: number[][] = Array.from({ length: baselineLength + 1 }, () =>
    new Array<number>(currentLength + 1).fill(0)
  );
  for (let row = baselineLength - 1; row >= 0; row -= 1) {
    for (let column = currentLength - 1; column >= 0; column -= 1) {
      lcs[row][column] =
        baseline[row] === current[column]
          ? lcs[row + 1][column + 1] + 1
          : Math.max(lcs[row + 1][column], lcs[row][column + 1]);
    }
  }

  let rowIndex = 0;
  let currentIndex = 0;
  let previousRow = -1;
  let previousCurrent = -1;

  while (rowIndex < baselineLength && currentIndex < currentLength) {
    if (baseline[rowIndex] === current[currentIndex]) {
      tally(
        rowIndex - previousRow - 1,
        previousCurrent + 1,
        currentIndex - previousCurrent - 1
      );
      previousRow = rowIndex;
      previousCurrent = currentIndex;
      rowIndex += 1;
      currentIndex += 1;
      continue;
    }
    if (lcs[rowIndex + 1][currentIndex] >= lcs[rowIndex][currentIndex + 1]) {
      rowIndex += 1;
    } else {
      currentIndex += 1;
    }
  }

  tally(
    baselineLength - previousRow - 1,
    previousCurrent + 1,
    currentLength - previousCurrent - 1
  );
  return diff;
}

function stripLineComment(line: string): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quote) {
      if (char === quote && line[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "/" && line[i + 1] === "/") return line.slice(0, i);
  }
  return line;
}

function braceDelta(line: string): number {
  let quote: string | null = null;
  let delta = 0;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quote) {
      if (char === quote && line[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
    } else if (char === "{") {
      delta += 1;
    } else if (char === "}") {
      delta -= 1;
    }
  }
  return delta;
}

export function isDbmlBalanced(dbml: string): boolean {
  let depth = 0;
  for (const rawLine of dbml.split(/\r?\n/)) {
    depth += braceDelta(stripLineComment(rawLine));
    if (depth < 0) return false;
  }
  return depth === 0;
}

function cleanTableName(value: string): string {
  return value.replace(/["'`]/g, "").trim();
}

type ParsedColumn = {
  column: SqlColumn;
  primaryKey: boolean;
  unique: boolean;
};

/** Read a column's `[attributes]` into key/unique flags (notes are ignored). */
function columnAttributes(line: string): string {
  return [...line.matchAll(/\[([^\]]*)\]/g)]
    .map((match) => match[1])
    .join(",")
    .toLowerCase()
    .replace(/note\s*:\s*'[^']*'/g, "")
    .replace(/note\s*:\s*"[^"]*"/g, "");
}

function parseColumn(line: string): ParsedColumn | null {
  if (!line || line.startsWith("//")) return null;
  if (/^(Note|indexes|Ref|TableGroup|Project|Enum|Table)\b/i.test(line)) return null;
  if (line === "{" || line === "}" || line.startsWith("}")) return null;

  const attributes = columnAttributes(line);
  const withoutAttributes = line.replace(/(\s*\[[^\]]*\])+\s*$/, "").trim();
  const match = withoutAttributes.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
  if (!match) return null;

  const name = match[1];
  let type = match[2].trim().replace(/[;,]$/, "");
  if (!type || type === "{" || type.startsWith("//")) return null;
  if (type.endsWith("{")) return null;

  // DBML note/check attributes can contain arbitrary text; the type is the
  // first SQL-ish token sequence. Keep multi-word types ("timestamp with time
  // zone") intact but drop a stray trailing attribute opener.
  type = type.replace(/\s*\{$/, "").trim();
  return {
    column: { name, type },
    primaryKey: /\b(pk|primary\s+key)\b/.test(attributes),
    unique: /\bunique\b/.test(attributes),
  };
}

/** Read one entry of an `indexes { … }` block. */
function parseIndexEntry(
  line: string
): { columns: string[]; primaryKey: boolean; unique: boolean } | null {
  if (!line || line.startsWith("//")) return null;

  const tuple = line.match(/^\(([^)]*)\)\s*(?:\[([^\]]*)\])?/);
  const single = tuple ? null : line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[([^\]]*)\])?/);
  const body = tuple?.[1] ?? single?.[1];
  if (!body) return null;

  const columns = body
    .split(",")
    .map((part) => part.trim().replace(/^["'`]|["'`]$/g, ""))
    .filter(Boolean);
  if (!columns.length) return null;

  const attributes = (tuple?.[2] ?? single?.[2] ?? "").toLowerCase();
  const primaryKey = /\b(pk|primary\s+key)\b/.test(attributes);
  const unique = /\bunique\b/.test(attributes);
  if (!primaryKey && !unique) return null;

  return { columns, primaryKey, unique };
}

function unquoteRefName(value: string): string {
  return value.replace(/["'`]/g, "").trim();
}

function parseRefSide(value: string): { table: string; columns: string[] } | null {
  const side = unquoteRefName(value.replace(/[;{}\s]+$/, "").trim());
  if (!side) return null;

  const tuple = side.match(/^(.*)\.\(([^)]*)\)$/);
  if (tuple) {
    const columns = tuple[2]
      .split(",")
      .map((column) => unquoteRefName(column))
      .filter(Boolean);
    return columns.length ? { table: unquoteRefName(tuple[1]), columns } : null;
  }

  const dot = side.lastIndexOf(".");
  if (dot <= 0) return null;
  const table = unquoteRefName(side.slice(0, dot));
  const column = unquoteRefName(side.slice(dot + 1));
  return table && column ? { table, columns: [column] } : null;
}

function parseRefStatement(value: string): SqlRef | null {
  const match = value.match(/^(.+?)\s*([<>-])\s*(.+)$/);
  if (!match) return null;

  const left = parseRefSide(match[1]);
  const right = parseRefSide(match[3]);
  if (!left || !right) return null;
  if (left.columns.length !== right.columns.length) return null;

  // `A.x > B.y` puts the FK on A; with `<` the FK is on the right side.
  const [from, to] = match[2] === "<" ? [right, left] : [left, right];
  return {
    fromTable: from.table,
    fromColumns: from.columns,
    toTable: to.table,
    toColumns: to.columns,
  };
}

/** Read `Ref:` lines (inline, named, and block form) into normalized refs. */
export function parseDbmlRefs(dbml: string): SqlRef[] {
  const refs: SqlRef[] = [];
  let blockDepth = 0;

  for (const rawLine of dbml.split(/\r?\n/)) {
    const line = stripLineComment(rawLine).trim();
    if (!line) continue;

    if (blockDepth > 0) {
      blockDepth += braceDelta(line);
      const ref = parseRefStatement(line.replace(/[{}]/g, " ").trim());
      if (ref) refs.push(ref);
      continue;
    }

    if (!/^Ref\b/i.test(line)) continue;

    if (line.includes("{")) {
      blockDepth = Math.max(1, braceDelta(line));
      const inline = line.slice(line.indexOf("{") + 1).replace(/}/g, "").trim();
      const ref = inline ? parseRefStatement(inline) : null;
      if (ref) refs.push(ref);
      continue;
    }

    const body = line
      .replace(/^Ref\b/i, "")
      .trim()
      .replace(/^[\w]*\s*:/, "")
      .trim();
    const ref = parseRefStatement(body);
    if (ref) refs.push(ref);
  }

  return refs;
}

export type ParsedTable = {
  name: string;
  columns: SqlColumn[];
  primaryKey?: string[];
  uniqueKeys?: string[][];
};

/** Read the Table blocks out of a DBML document. */
export function parseDbml(dbml: string): ParsedTable[] {
  const lines = dbml.split(/\r?\n/);
  const tables: ParsedTable[] = [];
  const seen = new Set<string>();

  let index = 0;
  while (index < lines.length) {
    const line = stripLineComment(lines[index]).trim();
    const match = line.match(/^Table\s+("[^"]+"|'[^']+'|[\w.]+)\s*\{/i);
    if (!match) {
      index += 1;
      continue;
    }

    const name = cleanTableName(match[1]);
    let depth = braceDelta(line);
    const body: string[] = [];
    index += 1;
    while (index < lines.length && depth > 0) {
      const raw = stripLineComment(lines[index]).trim();
      depth += braceDelta(raw);
      if (depth > 0) body.push(raw);
      index += 1;
    }

    const columns: SqlColumn[] = [];
    const columnPrimaryKey: string[] = [];
    const indexPrimaryKeys: string[][] = [];
    const uniqueKeys: string[][] = [];
    const indexLines: string[] = [];
    let nested = 0;
    let inIndexes = false;

    for (const bodyLine of body) {
      if (inIndexes) {
        nested += braceDelta(bodyLine);
        if (nested <= 0) {
          inIndexes = false;
          nested = 0;
          continue;
        }
        indexLines.push(bodyLine);
        continue;
      }
      if (/^indexes\s*\{/i.test(bodyLine)) {
        nested = braceDelta(bodyLine);
        inIndexes = nested > 0;
        continue;
      }
      if (nested > 0) {
        nested += braceDelta(bodyLine);
        continue;
      }
      if (braceDelta(bodyLine) > 0) {
        nested += braceDelta(bodyLine);
        continue;
      }
      if (braceDelta(bodyLine) < 0) continue;

      const parsed = parseColumn(bodyLine);
      if (!parsed) continue;
      columns.push(parsed.column);
      if (parsed.primaryKey) columnPrimaryKey.push(parsed.column.name);
      if (parsed.unique) uniqueKeys.push([parsed.column.name]);
    }

    for (const line of indexLines) {
      const entry = parseIndexEntry(line);
      if (!entry) continue;
      if (entry.primaryKey) indexPrimaryKeys.push(entry.columns);
      else if (entry.unique) uniqueKeys.push(entry.columns);
    }

    if (name && columns.length && !seen.has(name)) {
      seen.add(name);
      const columnNames = new Set(columns.map((column) => column.name));
      const filterKey = (key: string[]) => key.filter((column) => columnNames.has(column));

      // An `indexes { (a, b) [pk] }` declaration wins over column attributes.
      const indexedKey = indexPrimaryKeys.map(filterKey).find((key) => key.length > 0);
      const columnKey = [...new Set(columnPrimaryKey)].filter((column) => columnNames.has(column));
      const primaryKey = indexedKey ?? (columnKey.length ? columnKey : undefined);

      const seenKeys = new Set<string>();
      const uniques: string[][] = [];
      for (const key of uniqueKeys) {
        const filtered = filterKey(key);
        if (filtered.length !== key.length || !filtered.length) continue;
        const signature = filtered.join("\u0000");
        if (seenKeys.has(signature)) continue;
        seenKeys.add(signature);
        uniques.push(filtered);
      }

      tables.push({
        name,
        columns,
        primaryKey,
        uniqueKeys: uniques.length ? uniques : undefined,
      });
    }
  }

  return tables;
}

/**
 * Carry table data across a schema edit. Columns are matched by name, so
 * renaming a column intentionally starts that column empty.
 */
export function syncSqlTables(previous: SqlTable[], parsed: ParsedTable[]): SqlTable[] {
  return parsed.map((definition) => {
    const old = previous.find((table) => table.name === definition.name);
    const rows = old
      ? old.rows.map((row) =>
          definition.columns.map((column) => {
            const oldIndex = old.columns.findIndex((candidate) => candidate.name === column.name);
            return oldIndex >= 0 ? (row[oldIndex] ?? null) : null;
          })
        )
      : [];
    return {
      name: definition.name,
      columns: definition.columns,
      rows,
      primaryKey: definition.primaryKey,
      uniqueKeys: definition.uniqueKeys,
    };
  });
}

export function dataSampleKey(tableName: string): string {
  return tableName.includes(".") ? tableName : `public.${tableName}`;
}

function coerceCell(value: SqlCell | undefined, type: string): SqlCell {
  if (value === null || value === undefined) return null;

  const lowerType = type.toLowerCase();
  if (typeof value === "boolean") {
    if (/(int|numeric|decimal|float|double|real|money)/.test(lowerType)) {
      return value ? 1 : 0;
    }
    return value;
  }
  if (typeof value === "number") {
    if (/bool/.test(lowerType)) return value !== 0;
    return value;
  }

  const text = String(value).trim();
  if (!text || text.toLowerCase() === "null") return null;

  if (/bool/.test(lowerType)) {
    if (/^(true|1|yes)$/i.test(text)) return true;
    if (/^(false|0|no)$/i.test(text)) return false;
    return null;
  }
  if (/(int|numeric|decimal|float|double|real|money)/.test(lowerType)) {
    const parsed = Number(text.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return text;
}

/** Build the runsql.com `dataSample` map from the visual table editor. */
export function buildDataSample(tables: SqlTable[]): Record<string, SqlCell[][]> {
  const sample: Record<string, SqlCell[][]> = Object.create(null) as Record<string, SqlCell[][]>;

  for (const table of tables) {
    if (!table.columns.length) continue;
    const key = dataSampleKey(table.name);
    const rows = table.rows
      .map((row) => table.columns.map((column, index) => coerceCell(row[index], column.type)))
      .filter((row) => row.some((cell) => cell !== null));
    sample[key] = [
      table.columns.map((column) => column.name),
      table.columns.map((column) => column.type),
      ...rows,
    ];
  }

  return sample;
}

export function sqlCellToString(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function sqlRowsToCsv(rows: unknown[][]): string {
  const escape = (value: unknown) => {
    const text =
      value === null || value === undefined
        ? ""
        : typeof value === "object"
          ? sqlCellToString(value)
          : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\r\n")}`;
}

export function engineLabel(value: string): string {
  return SQL_ENGINES.find((engine) => engine.value === value)?.label ?? value;
}

/* ────────────────────────────────────────────────────────────────────────
 * CSV import
 *
 * The importer turns a plain CSV into a new SqlTable plus the matching DBML
 * Table block, so the user only has to pick a file. Column types are inferred
 * from the values; every inferred type stays editable in the schema editor.
 * ──────────────────────────────────────────────────────────────────────── */

export const MAX_CSV_BYTES = 5 * 1024 * 1024;

/** The runsql sandbox rejects more than 2,000 sample rows per table. */
export const MAX_IMPORTED_ROWS = 2_000;

type CsvValueKind = "integer" | "numeric" | "boolean" | "timestamp" | "text";

const CSV_DELIMITERS = [",", ";", "\t"] as const;

const INTEGER_PATTERN = /^[+-]?\d+$/;
const NUMERIC_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const BOOLEAN_PATTERN = /^(?:true|false|yes|no)$/i;

/** Words that need quoting when they appear as identifiers in a query. */
const SQL_RESERVED = new Set([
  "add",
  "all",
  "alter",
  "and",
  "any",
  "as",
  "asc",
  "between",
  "by",
  "case",
  "cast",
  "check",
  "column",
  "constraint",
  "create",
  "cross",
  "current",
  "database",
  "default",
  "delete",
  "desc",
  "distinct",
  "drop",
  "else",
  "end",
  "except",
  "exists",
  "fetch",
  "for",
  "foreign",
  "from",
  "full",
  "group",
  "having",
  "in",
  "index",
  "inner",
  "insert",
  "intersect",
  "into",
  "is",
  "join",
  "key",
  "left",
  "like",
  "limit",
  "natural",
  "not",
  "null",
  "offset",
  "on",
  "or",
  "order",
  "outer",
  "primary",
  "references",
  "right",
  "row",
  "rows",
  "select",
  "set",
  "table",
  "then",
  "to",
  "union",
  "unique",
  "update",
  "user",
  "using",
  "values",
  "when",
  "where",
  "with",
]);

function countDelimiter(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && char === delimiter) count += 1;
  }
  return count;
}

function detectCsvDelimiter(text: string): string {
  const headerLine = text.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
  let best: string = ",";
  let bestCount = 0;
  for (const delimiter of CSV_DELIMITERS) {
    const count = countDelimiter(headerLine, delimiter);
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

/** RFC 4180-style reader: quotes, doubled quotes and embedded newlines. */
function parseCsvRows(text: string, delimiter: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    // A quote only opens a quoted field at the start of that field.
    if (char === '"' && field.trim() === "") {
      field = "";
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\r" || char === "\n") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** Turn a CSV header or file name into a DBML-safe identifier. */
export function sqlIdentifier(value: string, fallback = "imported_data"): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  if (!cleaned || !/[a-z]/.test(cleaned)) return fallback;
  if (/^[0-9]/.test(cleaned)) return `t_${cleaned}`;
  if (SQL_RESERVED.has(cleaned)) return `t_${cleaned}`;
  return cleaned;
}

function classifyCsvColumn(values: string[]): CsvValueKind {
  const filled = values.map((value) => value.trim()).filter(Boolean);
  if (!filled.length) return "text";
  if (filled.every((value) => BOOLEAN_PATTERN.test(value))) return "boolean";
  if (
    filled.every(
      (value) => INTEGER_PATTERN.test(value) && Number.isSafeInteger(Number(value))
    )
  ) {
    return "integer";
  }
  if (filled.every((value) => NUMERIC_PATTERN.test(value))) return "numeric";
  if (filled.every((value) => TIMESTAMP_PATTERN.test(value))) return "timestamp";
  return "text";
}

function numericType(values: string[]): string {
  let integerDigits = 1;
  let scale = 0;
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const [mantissa] = value.split(/[eE]/);
    const [whole, fraction = ""] = mantissa.replace(/^[+-]/, "").split(".");
    integerDigits = Math.max(integerDigits, whole.length || 1);
    scale = Math.max(scale, fraction.length);
  }
  const roundedScale = Math.min(scale, 12);
  const precision = Math.min(Math.max(integerDigits + roundedScale + 1, 12), 38);
  return `numeric(${Math.max(precision, roundedScale + 1)},${roundedScale})`;
}

function dbmlTypeFor(kind: CsvValueKind, values: string[]): string {
  switch (kind) {
    case "integer":
      return "integer";
    case "numeric":
      return numericType(values);
    case "boolean":
      return "boolean";
    case "timestamp":
      return "timestamp";
    default: {
      const longest = values.reduce((max, value) => Math.max(max, value.trim().length), 0);
      return `varchar(${Math.min(Math.max(longest, 20), 4_000)})`;
    }
  }
}

function csvCellValue(raw: string, kind: CsvValueKind): SqlCell {
  const text = raw.trim();
  if (!text) return null;

  switch (kind) {
    case "integer":
    case "numeric": {
      const numeric = Number(text);
      return Number.isFinite(numeric) ? numeric : text;
    }
    case "boolean":
      return /^(?:true|yes)$/i.test(text);
    default:
      return text;
  }
}

export type CsvImportResult =
  | { ok: true; table: SqlTable; dbml: string; skippedRows: number }
  | { ok: false; error: string };

/**
 * Build a SqlTable and its DBML Table block from CSV text.
 *
 * `existingTableNames` keeps repeat imports from overwriting an earlier table:
 * a collision becomes `name_2`, `name_3`, and so on.
 */
export function csvToSqlTable(
  csvText: string,
  fileName: string,
  existingTableNames: string[] = []
): CsvImportResult {
  const delimiter = detectCsvDelimiter(csvText);
  const matrix = parseCsvRows(csvText, delimiter);

  if (matrix.length < 2) {
    return {
      ok: false,
      error: "The CSV needs a header row and at least one data row.",
    };
  }

  const [header, ...dataRows] = matrix;

  const used = new Set<string>();
  const columnNames = header.map((cell, index) => {
    const base = sqlIdentifier(cell, `column_${index + 1}`);
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${base}_${suffix}`;
      suffix += 1;
    }
    used.add(candidate);
    return candidate;
  });

  const normalizedRows = dataRows.map((row) =>
    columnNames.map((_, index) => row[index] ?? "")
  );

  const kinds = columnNames.map((_, index) =>
    classifyCsvColumn(normalizedRows.map((row) => row[index]))
  );

  const columns: SqlColumn[] = columnNames.map((name, index) => ({
    name,
    type: dbmlTypeFor(kinds[index], normalizedRows.map((row) => row[index])),
  }));

  const keptRows = normalizedRows.slice(0, MAX_IMPORTED_ROWS);
  const rows = keptRows.map((row) =>
    row.map((value, index) => csvCellValue(value, kinds[index]))
  );

  const baseName = sqlIdentifier(fileName.replace(/\.[^.]+$/, ""), "imported_data");
  const taken = new Set(existingTableNames.map((name) => name.split(".").pop() ?? name));
  let tableName = baseName;
  let suffix = 2;
  while (taken.has(tableName)) {
    tableName = `${baseName}_${suffix}`;
    suffix += 1;
  }

  const dbml = [
    `Table ${tableName} {`,
    ...columns.map((column) => `  ${column.name} ${column.type}`),
    `}`,
  ].join("\n");

  return {
    ok: true,
    table: { name: tableName, columns, rows },
    dbml,
    skippedRows: Math.max(0, normalizedRows.length - keptRows.length),
  };
}
