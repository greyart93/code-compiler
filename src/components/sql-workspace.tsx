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
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  Database,
  Download,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Table2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  SQL_ENGINES,
  buildDataSample,
  cloneSqlTables,
  engineLabel,
  isDbmlBalanced,
  parseDbml,
  sqlCellToString,
  sqlRowsToCsv,
  syncSqlTables,
  type SqlEngine,
  type SqlResult,
  type SqlTable,
} from "@/lib/sql-lab";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "codevit-sql-lab-v1";

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

export const SqlWorkspace = forwardRef<SqlWorkspaceHandle, SqlWorkspaceProps>(
  function SqlWorkspace({ query, onQueryChange, onRunningChange }, ref) {
    const { resolvedTheme } = useTheme();
    const editorTheme = resolvedTheme === "dark" ? "monokai" : "chrome";

    const [schema, setSchema] = useState(DEFAULT_SQL_SCHEMA);
    const [tables, setTables] = useState<SqlTable[]>(() => cloneSqlTables(DEFAULT_SQL_TABLES));
    const [engine, setEngine] = useState<SqlEngine>("postgres-16");
    const [activeTable, setActiveTable] = useState(DEFAULT_SQL_ACTIVE_TABLE);
    const [result, setResult] = useState<SqlResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorStage, setErrorStage] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [ranOnce, setRanOnce] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    const runningRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);
    const runIdRef = useRef(0);

    const parsedTables = useMemo(() => parseDbml(schema), [schema]);
    const balanced = isDbmlBalanced(schema);
    const currentTable =
      tables.find((table) => table.name === activeTable) ?? tables[0] ?? null;

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
            if (nextTables.length) setTables(nextTables);
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

      try {
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
        const rowCount =
          typeof payload?.rowCount === "number" && Number.isFinite(payload.rowCount)
            ? Math.max(0, Math.trunc(payload.rowCount))
            : Math.max(0, rows.length - 1);
        const totalTimeInMs =
          typeof payload?.totalTimeInMs === "number" && Number.isFinite(payload.totalTimeInMs)
            ? payload.totalTimeInMs
            : null;

        setResult({ rows, rowCount, totalTimeInMs });
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
      if (!result?.rows.length) return;
      const blob = new Blob([sqlRowsToCsv(result.rows)], {
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

    const resultColumns =
      result?.rows[0]?.map((cell, index) =>
        cell === null || cell === undefined ? `column_${index + 1}` : String(cell)
      ) ?? [];
    const resultRows = result?.rows.slice(1) ?? [];

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
              runsql engine
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
              <section className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:min-h-0">
                <PanelHeader
                  number={2}
                  title="Define data"
                  aside={
                    <span className="mono-label !text-[8px] text-muted-foreground">
                      {currentTable
                        ? `${currentTable.rows.length} rows · ${currentTable.columns.length} cols`
                        : "no tables"}
                    </span>
                  }
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
                        body="Add a Table block in the schema editor and its columns will appear here."
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
                            {currentTable.columns.map((column) => (
                              <th
                                key={column.name}
                                className="min-w-[112px] border-l border-border/60 px-2 py-1.5 font-medium"
                              >
                                <span className="block truncate text-[10.5px] text-foreground">
                                  {column.name}
                                </span>
                                <span className="mt-0.5 block truncate font-mono text-[8px] font-normal uppercase tracking-wide text-muted-foreground/75">
                                  {column.type}
                                </span>
                              </th>
                            ))}
                            <th className="w-8 border-l border-border/60" />
                          </tr>
                        </thead>
                        <tbody>
                          {currentTable.rows.map((row, rowIndex) => (
                            <tr
                              key={`${currentTable.name}-${rowIndex}`}
                              className="group border-b border-border/60 last:border-0 hover:bg-secondary/30"
                            >
                              <td className="px-2 py-0 font-mono text-[9px] text-muted-foreground/60">
                                {rowIndex + 1}
                              </td>
                              {currentTable.columns.map((column, columnIndex) => (
                                <td
                                  key={column.name}
                                  className="border-l border-border/40 p-0"
                                >
                                  <input
                                    aria-label={`${currentTable.name} row ${rowIndex + 1} ${column.name}`}
                                    value={
                                      row[columnIndex] === null || row[columnIndex] === undefined
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
                              ))}
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
                          ))}
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
                      <span className="mono-label !text-[8px] text-muted-foreground/70">
                        cell edits save locally
                      </span>
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
                        error
                          ? "text-destructive"
                          : result
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                      )}
                    >
                      {running
                        ? "Executing against the SQL engine…"
                        : error
                          ? "Query failed"
                          : result
                            ? `${result.rowCount} ${result.rowCount === 1 ? "row" : "rows"} returned`
                            : "Ready when you are"}
                    </span>
                  </div>
                  <span className="mono-label hidden shrink-0 !text-[8px] text-muted-foreground sm:inline">
                    {engineLabel(engine)} · read-only
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
                          {result.rowCount} rows
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={downloadCsv}
                        disabled={!result?.rows.length}
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
                    resultColumns.length ? (
                      <table className="w-full min-w-max border-collapse text-left text-[11.5px]">
                        <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur">
                          <tr className="border-b border-border">
                            {resultColumns.map((column, index) => (
                              <th
                                key={`${column}-${index}`}
                                className="min-w-[100px] border-l border-border/60 px-2.5 py-1.5 font-mono text-[9px] font-medium uppercase tracking-wide text-muted-foreground first:border-l-0"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultRows.map((row, rowIndex) => (
                            <tr
                              key={`result-${rowIndex}`}
                              className="border-b border-border/60 last:border-0 hover:bg-secondary/30"
                            >
                              {resultColumns.map((_, columnIndex) => {
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
                          {!resultRows.length && (
                            <tr>
                              <td
                                colSpan={resultColumns.length}
                                className="px-3 py-8 text-center text-[11px] text-muted-foreground"
                              >
                                Query ran successfully — no rows returned.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <EmptyPanel
                        icon={<Table2 className="size-4" />}
                        title="No rows returned"
                        body="The query completed, but the result set is empty."
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
                      ? `${result.rowCount} ${result.rowCount === 1 ? "row" : "rows"} returned`
                      : running
                        ? "executing"
                        : "query result"}
                  </span>
                  <span className="mono-label !text-[8px] text-muted-foreground/70">
                    {result?.totalTimeInMs != null
                      ? `${result.totalTimeInMs.toFixed(2)} ms`
                      : ranOnce && !running
                        ? "no timing"
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
