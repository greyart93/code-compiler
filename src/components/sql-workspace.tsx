"use client";

import dynamic from "next/dynamic";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  Check,
  Database,
  Download,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Table2,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_SQL_ACTIVE_TABLE,
  DEFAULT_SQL_QUERY,
  DEFAULT_SQL_SCHEMA,
  DEFAULT_SQL_TABLES,
  MAX_CSV_BYTES,
  SQL_ENGINES,
  buildDataSample,
  cloneSqlTables,
  csvToSqlTable,
  diffSqlRowSignatures,
  engineLabel,
  findConstraintViolations,
  isDbmlBalanced,
  parseDbml,
  parseDbmlRefs,
  sqlCellToString,
  sqlRowSignatures,
  sqlRowsToCsv,
  syncSqlTables,
  type SqlConstraintViolation,
  type SqlEngine,
  type SqlRunResult,
  type SqlStatementResult,
  type SqlTable,
} from "@/lib/sql-lab";
import { runLocalSql, sqlCommand } from "@/lib/sql-local";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "codevit-sql-lab-v1";

/** Snapshot of the grid rows per table, used to report unrun changes. */
function baselinesFrom(tables: SqlTable[]): Record<string, string[]> {
  return Object.fromEntries(tables.map((table) => [table.name, sqlRowSignatures(table.rows)]));
}

const AceEditor = dynamic(() => import("@/app/_editor/(AceEditor)/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-[10px] text-muted-foreground">
      Loading editor…
    </div>
  ),
});

export type SqlWorkspaceHandle = {
  run: () => void;
};

type SqlWorkspaceProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onRunningChange?: (running: boolean) => void;
};

type SavedSqlLab = {
  schema?: unknown;
  tables?: unknown;
  engine?: unknown;
  activeTable?: unknown;
};

function isSqlEngine(value: unknown): value is SqlEngine {
  return SQL_ENGINES.some((engine) => engine.value === value);
}

function tableLabel(name: string): string {
  return name.split(".").pop() ?? name;
}

function isNumericType(type: string): boolean {
  return /(int|numeric|decimal|float|double|real|money)/i.test(type);
}

function PanelHeader({
  number,
  title,
  badge,
  aside,
}: {
  number: number;
  title: string;
  badge?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-secondary/45 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
          {number}
        </span>
        <h2 className="truncate text-[12.5px] font-semibold tracking-tight">{title}</h2>
        {badge && <span className="mono-label shrink-0 !text-[8px]">{badge}</span>}
      </div>
      {aside && <div className="flex shrink-0 items-center gap-1.5">{aside}</div>}
    </header>
  );
}

function EmptyPanel({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="grid h-full min-h-[160px] place-items-center p-5">
      <div className="max-w-[260px] text-center">
        <span className="mx-auto grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
          {icon}
        </span>
        <p className="mt-3 text-[12.5px] font-medium text-foreground">{title}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

const ROW_CHANGING_COMMANDS = new Set(["INSERT", "UPDATE", "DELETE", "MERGE", "COPY", "TRUNCATE"]);

/** One statement's result: a grid for queries, a status line for writes/DDL. */
function StatementBlock({
  statement,
  index,
  showHeader,
}: {
  statement: SqlStatementResult;
  index: number;
  showHeader: boolean;
}) {
  if (!statement.fields.length) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <Check className="size-3" />
          {statement.command}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {ROW_CHANGING_COMMANDS.has(statement.command) && statement.affectedRows != null
            ? `${statement.affectedRows} ${statement.affectedRows === 1 ? "row" : "rows"} affected`
            : "completed"}
        </span>
        <span className="font-mono text-[9.5px] text-muted-foreground/60">
          {statement.elapsedMs.toFixed(2)} ms
        </span>
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between gap-2 bg-secondary/35 px-3 py-1.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="mono-label shrink-0 !text-[8px] text-muted-foreground">
              {index + 1} · {statement.command}
            </span>
            <span className="truncate font-mono text-[9.5px] text-muted-foreground/60">
              {statement.sql.replace(/\s+/g, " ")}
            </span>
          </span>
          <span className="mono-label shrink-0 !text-[8px] text-muted-foreground">
            {statement.rows.length} rows
          </span>
        </div>
      )}
      <table className="w-full min-w-max border-collapse text-left text-[11.5px]">
        <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur">
          <tr className="border-b border-border">
            {statement.fields.map((field, fieldIndex) => (
              <th
                key={`${field}-${fieldIndex}`}
                className="min-w-[100px] border-l border-border/60 px-2.5 py-1.5 font-mono text-[9px] font-medium uppercase tracking-wide text-muted-foreground first:border-l-0"
              >
                {field}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statement.rows.map((row, rowIndex) => (
            <tr
              key={`result-${rowIndex}`}
              className="border-b border-border/60 last:border-0 hover:bg-secondary/30"
            >
              {statement.fields.map((_, columnIndex) => {
                const cell = row[columnIndex];
                const value = sqlCellToString(cell);
                return (
                  <td
                    key={`result-${rowIndex}-${columnIndex}`}
                    title={value}
                    className={cn(
                      "max-w-[300px] truncate whitespace-nowrap border-l border-border/40 px-2.5 py-1.5 font-mono text-[10.5px] first:border-l-0",
                      cell === null || cell === undefined
                        ? "italic text-muted-foreground/55"
                        : "text-foreground/85"
                    )}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
          {!statement.rows.length && (
            <tr>
              <td
                colSpan={statement.fields.length}
                className="px-3 py-8 text-center text-[11px] text-muted-foreground"
              >
                {statement.command} ran successfully — no rows returned.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const SqlWorkspace = forwardRef<SqlWorkspaceHandle, SqlWorkspaceProps>(
  function SqlWorkspace({ query, onQueryChange, onRunningChange }, ref) {
    const { resolvedTheme } = useTheme();
    const editorTheme = resolvedTheme === "dark" ? "monokai" : "chrome";

    const [schema, setSchema] = useState(DEFAULT_SQL_SCHEMA);
    const [tables, setTables] = useState<SqlTable[]>(() => cloneSqlTables(DEFAULT_SQL_TABLES));
    const [engine, setEngine] = useState<SqlEngine>("postgres-16");
    const [activeTable, setActiveTable] = useState(DEFAULT_SQL_ACTIVE_TABLE);
    const [result, setResult] = useState<SqlRunResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorStage, setErrorStage] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [ranOnce, setRanOnce] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [keyWarning, setKeyWarning] = useState<string | null>(null);
    const [baselines, setBaselines] = useState<Record<string, string[]>>(() =>
      baselinesFrom(DEFAULT_SQL_TABLES)
    );

    const runningRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);
    const runIdRef = useRef(0);
    const csvInputRef = useRef<HTMLInputElement | null>(null);
    // A run blocked by key violations can be repeated to run anyway, briefly.
    const forceRunRef = useRef(false);
    const keyWarningTimer = useRef<number | null>(null);
    // dragenter/dragleave fire for every child element, so count nesting depth.
    const dragDepthRef = useRef(0);

    const parsedTables = useMemo(() => parseDbml(schema), [schema]);
    const balanced = isDbmlBalanced(schema);
    const currentTable =
      tables.find((table) => table.name === activeTable) ?? tables[0] ?? null;

    // Rows the declared keys would reject, so the grid can flag them while editing.
    // Changes the next run will pick up: edits, new rows and removed rows.
    const rowDiff = useMemo(() => {
      if (!currentTable) return null;
      const diff = diffSqlRowSignatures(
        baselines[currentTable.name] ?? [],
        sqlRowSignatures(currentTable.rows)
      );
      return diff.added || diff.edited || diff.deleted ? diff : null;
    }, [baselines, currentTable]);

    const constraintViolations = useMemo(
      () =>
        currentTable
          ? findConstraintViolations(currentTable)
          : new Map<number, SqlConstraintViolation[]>(),
      [currentTable]
    );

    useEffect(
      () => () => {
        if (keyWarningTimer.current) window.clearTimeout(keyWarningTimer.current);
      },
      []
    );

    useEffect(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as SavedSqlLab;
          if (typeof saved.schema === "string") setSchema(saved.schema);
          if (Array.isArray(saved.tables)) {
            const nextTables = saved.tables.filter(
              (table): table is SqlTable =>
                Boolean(table) &&
                typeof table === "object" &&
                typeof (table as SqlTable).name === "string" &&
                Array.isArray((table as SqlTable).columns) &&
                Array.isArray((table as SqlTable).rows)
            );
            if (nextTables.length) {
              setTables(nextTables);
              setBaselines(baselinesFrom(nextTables));
            }
          }
          if (isSqlEngine(saved.engine)) setEngine(saved.engine);
          if (typeof saved.activeTable === "string") setActiveTable(saved.activeTable);
        }
      } catch {
        // A corrupt local draft should never stop the lab from opening.
      } finally {
        setHydrated(true);
      }
    }, []);

    useEffect(() => {
      if (!hydrated) return;
      const timer = window.setTimeout(() => {
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ schema, tables, engine, activeTable })
          );
        } catch {
          // Storage can be unavailable in private mode.
        }
      }, 350);
      return () => window.clearTimeout(timer);
    }, [activeTable, engine, hydrated, schema, tables]);

    // Keep the visual data grid in step with the DBML editor. Wait for a
    // balanced document so a half-typed table does not momentarily drop data.
    useEffect(() => {
      if (!hydrated) return;
      if (!schema.trim()) {
        setTables([]);
        return;
      }
      if (!isDbmlBalanced(schema)) return;

      const timer = window.setTimeout(() => {
        const parsed = parseDbml(schema);
        if (parsed.length) setTables((previous) => syncSqlTables(previous, parsed));
      }, 300);
      return () => window.clearTimeout(timer);
    }, [hydrated, schema]);

    useEffect(() => {
      if (tables.length && !tables.some((table) => table.name === activeTable)) {
        setActiveTable(tables[0].name);
      } else if (!tables.length && activeTable) {
        setActiveTable("");
      }
    }, [activeTable, tables]);

    useEffect(() => {
      onRunningChange?.(running);
    }, [onRunningChange, running]);

    useEffect(
      () => () => {
        abortRef.current?.abort();
        onRunningChange?.(false);
      },
      [onRunningChange]
    );

    const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
      setTables((previous) =>
        previous.map((table) =>
          table.name !== activeTable
            ? table
            : {
                ...table,
                rows: table.rows.map((row, currentRow) =>
                  currentRow === rowIndex
                    ? row.map((cell, currentColumn) =>
                        currentColumn === columnIndex ? value : cell
                      )
                    : row
                ),
              }
        )
      );
    };

    const addRow = () => {
      if (!currentTable?.columns.length) return;
      setTables((previous) =>
        previous.map((table) =>
          table.name === currentTable.name
            ? { ...table, rows: [...table.rows, Array(table.columns.length).fill(null)] }
            : table
        )
      );
    };

    const deleteRow = (rowIndex: number) => {
      if (!currentTable) return;
      setTables((previous) =>
        previous.map((table) =>
          table.name === currentTable.name
            ? { ...table, rows: table.rows.filter((_, index) => index !== rowIndex) }
            : table
        )
      );
    };

    // Import a CSV as a new table: infer the schema, then show the rows in the
    // data grid. Everything stays editable in the DBML and grid afterwards.
    const importCsv = useCallback(
      async (file: File | undefined) => {
        if (!file) return;

        if (file.size > MAX_CSV_BYTES) {
          toast("That CSV is too large", {
            description: "Keep the file under 5 MB so the lab stays responsive.",
            variant: "error",
          });
          return;
        }

        try {
          const imported = csvToSqlTable(
            await file.text(),
            file.name,
            [...tables.map((table) => table.name), ...parsedTables.map((table) => table.name)]
          );

          if (!imported.ok) {
            toast("Could not import CSV", { description: imported.error, variant: "error" });
            return;
          }

          setSchema((previous) => {
            const trimmed = previous.trim();
            return trimmed ? `${trimmed}\n\n${imported.dbml}\n` : `${imported.dbml}\n`;
          });
          setTables((previous) => [
            ...previous.filter((table) => table.name !== imported.table.name),
            imported.table,
          ]);
          setActiveTable(imported.table.name);
          setBaselines((previous) => ({
            ...previous,
            [imported.table.name]: sqlRowSignatures(imported.table.rows),
          }));

          toast(`Imported ${imported.table.name}`, {
            description: [
              `${imported.table.rows.length} ${imported.table.rows.length === 1 ? "row" : "rows"} · ${imported.table.columns.length} columns`,
              imported.skippedRows
                ? `${imported.skippedRows} extra rows skipped`
                : "schema added — edit anything",
            ].join(" · "),
            variant: "success",
          });
        } catch {
          toast("Could not read that file", {
            description: "Pick a plain-text .csv file and try again.",
            variant: "error",
          });
        }
      },
      [parsedTables, tables]
    );

    const isCsvFile = (file: File): boolean =>
      /\.(csv|tsv|txt)$/i.test(file.name) || /csv|tab-separated|text\/plain/i.test(file.type);

    const handleDragEnter = (event: DragEvent<HTMLElement>) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setDragActive(true);
    };

    const handleDragOver = (event: DragEvent<HTMLElement>) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };

    const handleDragLeave = () => {
      // Do not inspect `types` here: some browsers empty it by dragleave and a
      // skipped decrement would leave the overlay stuck on screen.
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setDragActive(false);
    };

    const handleDrop = (event: DragEvent<HTMLElement>) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;

      event.preventDefault();
      dragDepthRef.current = 0;
      setDragActive(false);

      if (!isCsvFile(file)) {
        toast("That is not a CSV file", {
          description: "Drop a .csv, .tsv or .txt file instead.",
          variant: "error",
        });
        return;
      }

      void importCsv(file);
    };

    const run = useCallback(async () => {
      if (runningRef.current) return;

      if (!query.trim()) {
        setRanOnce(true);
        setResult(null);
        setError("Write a query first.");
        setErrorStage(null);
        return;
      }

      if (schema.trim() && !isDbmlBalanced(schema)) {
        setRanOnce(true);
        setResult(null);
        setError("Close the open { } block in the schema before running.");
        setErrorStage("schema");
        return;
      }

      const parsed = schema.trim() ? parseDbml(schema) : [];
      if (schema.trim() && !parsed.length) {
        setRanOnce(true);
        setResult(null);
        setError("The schema has no valid Table blocks. Add one, or clear the schema.");
        setErrorStage("schema");
        return;
      }

      const runTables = parsed.length ? syncSqlTables(tables, parsed) : [];
      if (parsed.length) {
        setTables(runTables);
        if (runTables.length && !runTables.some((table) => table.name === activeTable)) {
          setActiveTable(runTables[0].name);
        }
      }

      // The grid rows are seeded with their keys before the query runs, so a
      // duplicate or empty key would fail the run before the query is reached.
      const violationsByTable = runTables
        .map((table) => ({ table, violations: findConstraintViolations(table) }))
        .filter((entry) => entry.violations.size > 0);

      if (violationsByTable.length && !forceRunRef.current) {
        const [firstOffender] = violationsByTable;
        const rows = [...firstOffender.violations.keys()]
          .map((rowIndex) => rowIndex + 1)
          .sort((a, b) => a - b);
        const detail =
          violationsByTable.length === 1
            ? `${firstOffender.table.name}: ${rows.length === 1 ? "row" : "rows"} ${rows.join(
                ", "
              )} ${rows.length === 1 ? "breaks" : "break"} a key`
            : `${violationsByTable.length} tables have rows that break a key (${violationsByTable
                .map((entry) => entry.table.name)
                .join(", ")})`;

        setActiveTable(firstOffender.table.name);
        setKeyWarning(`${detail} — fix them, or click Run again to run anyway`);
        forceRunRef.current = true;
        if (keyWarningTimer.current) window.clearTimeout(keyWarningTimer.current);
        keyWarningTimer.current = window.setTimeout(() => {
          forceRunRef.current = false;
          setKeyWarning(null);
          keyWarningTimer.current = null;
        }, 5000);
        return;
      }

      forceRunRef.current = false;
      setKeyWarning(null);

      runningRef.current = true;
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      setRunning(true);
      setRanOnce(true);
      setResult(null);
      setError(null);
      setErrorStage(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // The grid was just handed to the engine, so it becomes the new baseline.
      const commitBaselines = () => {
        if (runTables.length) setBaselines(baselinesFrom(runTables));
      };

      try {
        // Postgres runs locally in the browser, so DDL and DML are allowed.
        // The database is rebuilt from the schema + data grid on every run.
        if (engine === "postgres-16") {
          const local = await runLocalSql(query, runTables, parseDbmlRefs(schema));
          if (runIdRef.current !== runId) return;

          if (!local.ok) {
            setError(local.error);
            setErrorStage(local.stage);
            return;
          }

          setResult({ statements: local.statements, totalTimeInMs: local.totalTimeInMs });
          commitBaselines();
          return;
        }

        const response = await fetch("/api/runSql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dbml: schema,
            dataSample: buildDataSample(runTables),
            query,
            databaseType: engine,
          }),
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | { rows?: unknown; rowCount?: unknown; totalTimeInMs?: unknown; error?: unknown; stage?: unknown }
          | null;

        if (runIdRef.current !== runId) return;

        if (!response.ok) {
          setError(
            typeof payload?.error === "string"
              ? payload.error
              : "The query could not be executed."
          );
          setErrorStage(typeof payload?.stage === "string" ? payload.stage : null);
          return;
        }

        const rows = Array.isArray(payload?.rows)
          ? payload.rows.filter((row): row is unknown[] => Array.isArray(row))
          : [];
        const totalTimeInMs =
          typeof payload?.totalTimeInMs === "number" && Number.isFinite(payload.totalTimeInMs)
            ? payload.totalTimeInMs
            : null;
        const fields = (rows[0] ?? []).map((cell, index) =>
          cell === null || cell === undefined ? `column_${index + 1}` : String(cell)
        );

        setResult({
          statements: [
            {
              sql: query.trim(),
              command: sqlCommand(query),
              fields,
              rows: fields.length ? rows.slice(1) : [],
              affectedRows: null,
              elapsedMs: totalTimeInMs ?? 0,
            },
          ],
          totalTimeInMs: totalTimeInMs ?? 0,
        });
        commitBaselines();
      } catch (runError) {
        if (runError instanceof Error && runError.name === "AbortError") return;
        setError("Could not reach the SQL lab. Check your connection and try again.");
        setErrorStage("network");
      } finally {
        if (runIdRef.current === runId) {
          if (abortRef.current === controller) abortRef.current = null;
          runningRef.current = false;
          setRunning(false);
        }
      }
    }, [activeTable, engine, query, schema, tables]);

    const reset = useCallback(() => {
      runIdRef.current += 1;
      abortRef.current?.abort();
      runningRef.current = false;
      setRunning(false);
      setSchema(DEFAULT_SQL_SCHEMA);
      setTables(cloneSqlTables(DEFAULT_SQL_TABLES));
      setBaselines(baselinesFrom(DEFAULT_SQL_TABLES));
      setEngine("postgres-16");
      setActiveTable(DEFAULT_SQL_ACTIVE_TABLE);
      setResult(null);
      setError(null);
      setErrorStage(null);
      setRanOnce(false);
      onQueryChange(DEFAULT_SQL_QUERY);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage can be unavailable in private mode.
      }
    }, [onQueryChange]);

    const downloadCsv = useCallback(() => {
      const sets = (result?.statements ?? []).filter((statement) => statement.fields.length > 0);
      const lastSet = sets[sets.length - 1];
      if (!lastSet) return;
      const blob = new Blob([sqlRowsToCsv([lastSet.fields, ...lastSet.rows])], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `codevit-${engine}-query.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }, [engine, result]);

    useImperativeHandle(ref, () => ({ run: () => void run() }), [run]);

    const handleEngineChange = (value: string) => {
      if (!isSqlEngine(value)) return;
      runIdRef.current += 1;
      abortRef.current?.abort();
      runningRef.current = false;
      setRunning(false);
      setEngine(value);
      setResult(null);
      setError(null);
      setErrorStage(null);
      setRanOnce(false);
    };

    const resultSets = (result?.statements ?? []).filter((statement) => statement.fields.length > 0);
    const statementCount = result?.statements.length ?? 0;
    const totalRows = resultSets.reduce((sum, statement) => sum + statement.rows.length, 0);
    const resultSummary = !result
      ? ""
      : resultSets.length
        ? `${totalRows} ${totalRows === 1 ? "row" : "rows"} returned`
        : `${statementCount} ${statementCount === 1 ? "statement" : "statements"} executed`;

    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_70px_-55px_rgba(0,0,0,0.35)]">
        <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12px] font-semibold tracking-tight">SQL Lab</p>
              <p className="mono-label !text-[8px]">DBML · sample data · live query</p>
            </div>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <span className="mono-label hidden !text-[8px] text-muted-foreground sm:inline">
              {engine === "postgres-16" ? "local postgres" : "runsql engine"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Select value={engine} onValueChange={handleEngineChange}>
              <SelectTrigger className="h-8 w-[172px] rounded-full border-border bg-background text-[11px]" aria-label="SQL engine">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SQL_ENGINES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={reset}
              title="Reset the demo schema, data and query"
              aria-label="Reset SQL demo"
              className="grid size-8 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3 lg:overflow-hidden">
          <div className="grid gap-2 lg:h-full lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="grid gap-2 lg:min-h-0 lg:grid-rows-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              {/* ── 1 · schema ─────────────────────────────────────── */}
              <section className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:min-h-0">
                <PanelHeader
                  number={1}
                  title="Define schema"
                  badge="DBML"
                  aside={
                    <span className="mono-label !text-[8px] text-muted-foreground">
                      {parsedTables.length} tables
                    </span>
                  }
                />
                <div className="relative min-h-0 flex-1 bg-[#fbfaf7] dark:bg-[#0b0c0f]">
                  <AceEditor
                    language="sql"
                    theme={editorTheme}
                    defaultCode=""
                    scode={schema}
                    onValueChange={setSchema}
                    onRun={() => void run()}
                    height="100%"
                    fontSize={12.5}
                  />
                </div>
                <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-3">
                  <span className="mono-label !text-[8px] text-muted-foreground">
                    {balanced ? "edits sync to data" : "close the open block"}
                  </span>
                  <span
                    className={cn(
                      "mono-label !text-[8px]",
                      parsedTables.length ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {parsedTables.length ? "parsed" : "needs a table"}
                  </span>
                </div>
              </section>

              {/* ── 2 · data ───────────────────────────────────────── */}
              <section
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative flex min-h-[320px] flex-col overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors lg:min-h-0",
                  dragActive ? "border-primary ring-1 ring-inset ring-primary/35" : "border-border"
                )}
              >
                {dragActive && (
                  <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-background/85 backdrop-blur-[1px]">
                    <div className="text-center">
                      <span className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Upload className="size-4" />
                      </span>
                      <p className="mt-3 text-[12.5px] font-medium text-foreground">
                        Drop a CSV to import
                      </p>
                      <p className="mt-1 text-[11.5px] text-muted-foreground">
                        The header row becomes the schema.
                      </p>
                    </div>
                  </div>
                )}
                <PanelHeader
                  number={2}
                  title="Define data"
                  aside={
                    <div className="flex items-center gap-1.5">
                      <span className="mono-label !text-[8px] text-muted-foreground">
                        {currentTable
                          ? `${currentTable.rows.length} rows · ${currentTable.columns.length} cols`
                          : "no tables"}
                      </span>
                      <button
                        type="button"
                        onClick={() => csvInputRef.current?.click()}
                        title="Import a CSV file as a new table, or drag one onto this panel"
                        className="flex h-6 items-center gap-1 rounded-md border border-border bg-background px-1.5 text-[9.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Upload className="size-3" /> CSV
                      </button>
                    </div>
                  }
                />
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void importCsv(file);
                  }}
                />
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {tables.length ? (
                      tables.map((table) => (
                        <button
                          key={table.name}
                          type="button"
                          onClick={() => setActiveTable(table.name)}
                          aria-pressed={table.name === activeTable}
                          className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors",
                            table.name === activeTable
                              ? "bg-secondary text-foreground"
                              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          )}
                        >
                          {tableLabel(table.name)}
                          <span className="font-mono text-[8.5px] opacity-55">
                            {table.rows.length}
                          </span>
                        </button>
                      ))
                    ) : (
                      <span className="mono-label !text-[8px] text-muted-foreground">
                        Add a Table block
                      </span>
                    )}
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto">
                    {!currentTable ? (
                      <EmptyPanel
                        icon={<Table2 className="size-4" />}
                        title="No tables yet"
                        body="Add a Table block in the schema editor, or import a CSV with the button above (or drag one in) — its columns and rows will appear here."
                      />
                    ) : !currentTable.columns.length ? (
                      <EmptyPanel
                        icon={<Table2 className="size-4" />}
                        title="No columns yet"
                        body="Give this table at least one column in the schema editor."
                      />
                    ) : (
                      <table className="w-full min-w-max border-collapse text-left text-[11.5px]">
                        <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur">
                          <tr className="border-b border-border">
                            <th className="w-9 px-2 py-1.5 text-left font-mono text-[8.5px] font-normal text-muted-foreground">
                              #
                            </th>
                            {currentTable.columns.map((column) => {
                              const primaryKey = currentTable.primaryKey ?? [];
                              const isPrimary = primaryKey.includes(column.name);
                              const uniqueKeys = (currentTable.uniqueKeys ?? []).filter((key) =>
                                key.includes(column.name)
                              );
                              const primaryTitle =
                                primaryKey.length > 1
                                  ? `Primary key (${primaryKey.join(", ")})`
                                  : "Primary key";
                              const uniqueTitle = uniqueKeys.length
                                ? `Unique (${uniqueKeys.map((key) => key.join(", ")).join("), (")})`
                                : "";

                              return (
                                <th
                                  key={column.name}
                                  className="min-w-[112px] border-l border-border/60 px-2 py-1.5 font-medium"
                                >
                                  <span className="flex min-w-0 items-center gap-1">
                                    <span className="truncate text-[10.5px] text-foreground">
                                      {column.name}
                                    </span>
                                    {isPrimary && (
                                      <span
                                        title={primaryTitle}
                                        className="shrink-0 rounded bg-primary/10 px-1 py-px font-mono text-[7.5px] font-semibold uppercase leading-[1.4] tracking-wide text-primary"
                                      >
                                        PK
                                      </span>
                                    )}
                                    {uniqueKeys.length > 0 && (
                                      <span
                                        title={uniqueTitle}
                                        className="shrink-0 rounded bg-secondary px-1 py-px font-mono text-[7.5px] font-semibold uppercase leading-[1.4] tracking-wide text-muted-foreground"
                                      >
                                        UQ
                                      </span>
                                    )}
                                  </span>
                                  <span className="mt-0.5 block truncate font-mono text-[8px] font-normal uppercase tracking-wide text-muted-foreground/75">
                                    {column.type}
                                  </span>
                                </th>
                              );
                            })}
                            <th className="w-8 border-l border-border/60" />
                          </tr>
                        </thead>
                        <tbody>
                          {currentTable.rows.map((row, rowIndex) => {
                            const issues = constraintViolations.get(rowIndex) ?? [];
                            const rowIssueText = issues
                              .map((violation) => violation.message)
                              .join("\n");
                            const change = rowDiff?.changes[rowIndex] ?? "same";
                            const changeText =
                              change === "added"
                                ? "New row — inserted on the next run"
                                : change === "edited"
                                  ? "Edited row — sent on the next run"
                                  : "";
                            const rowHintText = [rowIssueText, changeText]
                              .filter(Boolean)
                              .join("\n");
                            const rowLabel = [
                              issues.length > 0
                                ? `Row ${rowIndex + 1} breaks a key: ${issues
                                    .map((violation) => violation.message)
                                    .join("; ")}`
                                : "",
                              change === "same"
                                ? ""
                                : `Row ${rowIndex + 1} is ${change === "added" ? "new" : "edited"}`,
                            ]
                              .filter(Boolean)
                              .join(". ");

                            return (
                              <tr
                                key={`${currentTable.name}-${rowIndex}`}
                                className={cn(
                                  "group border-b border-border/60 last:border-0 hover:bg-secondary/30",
                                  issues.length > 0 &&
                                    "bg-destructive/[0.045] shadow-[inset_2px_0_0_var(--destructive)]"
                                )}
                              >
                                <td
                                  title={rowHintText || undefined}
                                  aria-label={rowLabel || undefined}
                                  className={cn(
                                    "px-2 py-0 font-mono text-[9px] text-muted-foreground/60",
                                    issues.length > 0 && "font-semibold text-destructive"
                                  )}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "size-1 shrink-0 rounded-full",
                                        change === "added" && "bg-emerald-500",
                                        change === "edited" && "bg-amber-500",
                                        change === "same" && "bg-transparent"
                                      )}
                                    />
                                    {rowIndex + 1}
                                  </span>
                                </td>
                                {currentTable.columns.map((column, columnIndex) => {
                                  const cellIssues = issues.filter((violation) =>
                                    violation.columnIndexes.includes(columnIndex)
                                  );
                                  const cellIssueText = cellIssues
                                    .map((violation) => violation.message)
                                    .join("\n");

                                  return (
                                    <td
                                      key={column.name}
                                      title={cellIssueText || undefined}
                                      className={cn(
                                        "border-l border-border/40 p-0",
                                        cellIssues.length > 0 &&
                                          "bg-destructive/[0.09] ring-1 ring-inset ring-destructive/30"
                                      )}
                                    >
                                      <input
                                        aria-label={`${currentTable.name} row ${rowIndex + 1} ${column.name}`}
                                        aria-invalid={cellIssues.length > 0 || undefined}
                                        value={
                                          row[columnIndex] === null ||
                                          row[columnIndex] === undefined
                                            ? ""
                                            : String(row[columnIndex])
                                        }
                                        onChange={(event) =>
                                          updateCell(rowIndex, columnIndex, event.target.value)
                                        }
                                        placeholder="NULL"
                                        className={cn(
                                          "h-8 w-full min-w-[108px] bg-transparent px-2 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:bg-background focus:ring-1 focus:ring-inset focus:ring-primary/60",
                                          isNumericType(column.type) && "text-right"
                                        )}
                                      />
                                    </td>
                                  );
                                })}
                                <td className="border-l border-border/40 p-0 text-center">
                                  <button
                                    type="button"
                                    onClick={() => deleteRow(rowIndex)}
                                    title="Delete row"
                                    aria-label={`Delete row ${rowIndex + 1}`}
                                    className="mx-auto grid size-6 place-items-center rounded text-muted-foreground/40 opacity-60 transition hover:bg-destructive/10 hover:text-destructive focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {!currentTable.rows.length && (
                            <tr>
                              <td
                                colSpan={currentTable.columns.length + 2}
                                className="px-3 py-8 text-center text-[11px] text-muted-foreground"
                              >
                                No rows yet. Add a row below.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {currentTable && currentTable.columns.length > 0 && (
                    <div className="flex h-9 shrink-0 items-center justify-between border-t border-border px-2">
                      <button
                        type="button"
                        onClick={addRow}
                        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[10.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Plus className="size-3" /> New row
                        <kbd className="ml-1 hidden rounded border border-border bg-background px-1 py-px font-sans text-[8px] text-muted-foreground sm:inline">
                          blank → NULL
                        </kbd>
                      </button>
                      <div className="flex min-w-0 items-center gap-2">
                        {constraintViolations.size > 0 && (
                          <span
                            title={[
                              ...new Set(
                                [...constraintViolations.values()]
                                  .flat()
                                  .map((violation) => violation.message)
                              ),
                            ].join("\n")}
                            className="flex items-center gap-1 text-[9.5px] font-medium text-destructive"
                          >
                            <AlertCircle className="size-3" />
                            {constraintViolations.size}{" "}
                            {constraintViolations.size === 1 ? "row breaks a key" : "rows break a key"}
                          </span>
                        )}
                        {rowDiff ? (
                          <span
                            title={[
                              `${rowDiff.added} added`,
                              `${rowDiff.edited} edited`,
                              `${rowDiff.deleted} deleted`,
                              "since the data was loaded — sent on the next run",
                            ].join(" · ")}
                            className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[9px] tabular-nums"
                          >
                            {rowDiff.added > 0 && (
                              <span className="shrink-0 text-emerald-600 dark:text-emerald-400">
                                +{rowDiff.added} added
                              </span>
                            )}
                            {rowDiff.edited > 0 && (
                              <span className="shrink-0 text-amber-600 dark:text-amber-400">
                                ~{rowDiff.edited} edited
                              </span>
                            )}
                            {rowDiff.deleted > 0 && (
                              <span className="shrink-0 text-muted-foreground">
                                −{rowDiff.deleted} deleted
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="mono-label !text-[8px] text-muted-foreground/70">
                            cell edits save locally
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="grid gap-2 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* ── 3 · query ──────────────────────────────────────── */}
              <section className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:min-h-0">
                <PanelHeader
                  number={3}
                  title="Write query"
                  badge="SQL"
                  aside={
                    <span className="mono-label !text-[8px] text-muted-foreground">
                      Ctrl + Enter
                    </span>
                  }
                />
                <div className="relative min-h-0 flex-1 bg-[#fbfaf7] dark:bg-[#0b0c0f]">
                  <AceEditor
                    language="sql"
                    theme={editorTheme}
                    defaultCode=""
                    scode={query}
                    onValueChange={onQueryChange}
                    onRun={() => void run()}
                    height="100%"
                    fontSize={12.5}
                  />
                </div>
                <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-2.5 py-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void run()}
                      disabled={running}
                      className="h-8 shrink-0 gap-1.5 px-3"
                    >
                      {running ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Play className="size-3.5" />
                      )}
                      {running ? "Running" : "Run query"}
                    </Button>
                    <span
                      className={cn(
                        "truncate text-[10.5px]",
                        keyWarning
                          ? "text-destructive"
                          : error
                            ? "text-destructive"
                            : result
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                      )}
                      title={keyWarning ?? undefined}
                    >
                      {keyWarning
                        ? keyWarning
                        : running
                          ? "Executing against the SQL engine…"
                          : error
                            ? "Query failed"
                            : result
                              ? resultSummary
                              : "Ready when you are"}
                    </span>
                  </div>
                  <span className="mono-label hidden shrink-0 !text-[8px] text-muted-foreground sm:inline">
                    {engineLabel(engine)} · {engine === "postgres-16" ? "ddl + dml" : "read-only"}
                  </span>
                </div>
              </section>

              {/* ── 4 · result ─────────────────────────────────────── */}
              <section className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:min-h-0">
                <PanelHeader
                  number={4}
                  title="Query result"
                  aside={
                    <div className="flex items-center gap-1.5">
                      {result && (
                        <span className="mono-label !text-[8px] text-muted-foreground">
                          {resultSets.length ? `${totalRows} rows` : `${statementCount} stmt`}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={downloadCsv}
                        disabled={!resultSets.length}
                        className="flex h-6 items-center gap-1 rounded-md border border-border bg-background px-1.5 text-[9.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Download className="size-3" /> CSV
                      </button>
                    </div>
                  }
                />
                <div className="min-h-0 flex-1 overflow-auto">
                  {running ? (
                    <div className="grid h-full min-h-[180px] place-items-center p-5">
                      <div className="text-center">
                        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
                        <p className="mt-3 text-[12px] font-medium">Running query…</p>
                        <p className="mono-label mt-1 !text-[8px] text-muted-foreground">
                          {engineLabel(engine)}
                        </p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex h-full min-h-[180px] items-start gap-3 p-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                        <AlertCircle className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold">Query failed</p>
                        <p className="mt-1 break-words font-mono text-[10.5px] leading-relaxed text-muted-foreground">
                          {error}
                        </p>
                        {errorStage && (
                          <p className="mono-label mt-2 !text-[8px] text-muted-foreground/70">
                            stage · {errorStage}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : result ? (
                    statementCount ? (
                      <div className="divide-y divide-border">
                        {result.statements.map((statement, index) => (
                          <StatementBlock
                            key={`statement-${index}`}
                            statement={statement}
                            index={index}
                            showHeader={statementCount > 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyPanel
                        icon={<Table2 className="size-4" />}
                        title="Nothing to run"
                        body="Write a statement in the query editor and run it again."
                      />
                    )
                  ) : ranOnce ? (
                    <EmptyPanel
                      icon={<Table2 className="size-4" />}
                      title="No result yet"
                      body="Run the query to see rows here."
                    />
                  ) : (
                    <EmptyPanel
                      icon={<Table2 className="size-4" />}
                      title="Your rows will appear here"
                      body="Edit the schema and sample data, then run the query on the left."
                    />
                  )}
                </div>
                <div className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-card px-3">
                  <span className="mono-label !text-[8px] text-muted-foreground">
                    {result
                      ? resultSummary
                      : running
                        ? "executing"
                        : "query result"}
                  </span>
                  <span className="mono-label !text-[8px] text-muted-foreground/70">
                    {result
                      ? `${result.totalTimeInMs.toFixed(2)} ms`
                      : running
                        ? engineLabel(engine)
                        : engine === "postgres-16"
                          ? "local postgres · resets each run"
                          : "read-only sandbox"}
                  </span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SqlWorkspace.displayName = "SqlWorkspace";
