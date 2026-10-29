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
};

export type SqlResult = {
  rows: unknown[][];
  rowCount: number;
  totalTimeInMs: number | null;
};

export const SQL_ENGINES = [
  { value: "postgres-16", label: "PostgreSQL 16.6", short: "Postgres" },
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
  }));
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

function parseColumn(line: string): SqlColumn | null {
  if (!line || line.startsWith("//")) return null;
  if (/^(Note|indexes|Ref|TableGroup|Project|Enum|Table)\b/i.test(line)) return null;
  if (line === "{" || line === "}" || line.startsWith("}")) return null;

  const withoutAttributes = line.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
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
  return { name, type };
}

export type ParsedTable = {
  name: string;
  columns: SqlColumn[];
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
    let nested = 0;
    for (const bodyLine of body) {
      if (nested > 0) {
        nested += braceDelta(bodyLine);
        continue;
      }
      if (braceDelta(bodyLine) > 0) {
        nested += braceDelta(bodyLine);
        continue;
      }
      if (braceDelta(bodyLine) < 0) continue;
      const column = parseColumn(bodyLine);
      if (column) columns.push(column);
    }

    if (name && columns.length && !seen.has(name)) {
      seen.add(name);
      tables.push({ name, columns });
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
