"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Database,
  Eye,
  Lightbulb,
  Loader2,
  Play,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { toast } from "@/components/ui/toaster";
import {
  PRACTICE_LANGUAGES,
  answerFor,
  aceMode,
  describeSignature,
  fileFor,
  getProblem,
  labelFor,
  levelScore,
  nextProblem,
  parseArgs,
  programFor,
  sqlSchemaSummary,
  stubFor,
  trackOf,
  TRACKS,
  type PracticeLanguage,
  type Problem,
  type SqlProblem,
} from "@/data/code-tests";
import { runSqlProblem, prettyCell, type SqlRunResult } from "@/lib/code-test-sql";
import { cn } from "@/lib/utils";

const AceEditor = dynamic(() => import("../../_editor/(AceEditor)/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center font-mono text-[12px] text-white/40">
      Loading editor…
    </div>
  ),
});

// /api/runCode forwards the glot mux payload, which nests the run under `data`
type RunResult = { stdout?: string | null; stderr?: string | null; error?: string | null };
type RunResponse = RunResult & { data?: RunResult };
type CodeRow = { label: string; pass: boolean; got: string; want: string };

const SQL_START = (task: string) => `-- ${task}\n-- tables: customers, products, orders, order_items, employees\n\nSELECT\n`;

/** tiny inline-markdown pass for problem statements (**bold**, `code`) */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function Statement({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/```/);
  return (
    <div className="mt-3 grid gap-2 text-[13.5px] leading-relaxed text-foreground/90">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11.5px] leading-relaxed"
            >
              {block.replace(/^\n|\n$/g, "")}
            </pre>
          );
        }
        return block
          .split("\n")
          .filter((line) => line.trim())
          .map((line, i) => (
            <p key={`${index}-${i}`}>
              <Inline text={line} />
            </p>
          ));
      })}
    </div>
  );
}

function ResultTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <p className="px-4 py-3 text-[12px] text-muted-foreground">(no rows)</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left font-mono text-[11.5px]">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {columns.map((column, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-1.5 font-medium text-muted-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row, r) => (
            <tr key={r} className="border-b border-border/60 last:border-0">
              {row.map((cell, c) => (
                <td key={c} className="max-w-[240px] truncate px-3 py-1.5">
                  {prettyCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 12 && (
        <p className="px-3 py-1.5 text-[11px] text-muted-foreground">showing 12 of {rows.length} rows</p>
      )}
    </div>
  );
}

export default function CodeTestSolvePage() {
  const params = useParams<{ problemId?: string }>();
  const problem = getProblem(params?.problemId) as Problem | undefined;

  const [language, setLanguage] = useState<PracticeLanguage>("javascript");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<CodeRow[]>([]);
  const [sqlResult, setSqlResult] = useState<SqlRunResult | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("codevit:code-test-language");
    if (stored && PRACTICE_LANGUAGES.some((l) => l.value === stored)) {
      setLanguage(stored as PracticeLanguage);
    }
  }, []);

  useEffect(() => {
    if (!problem) return;
    setRows([]);
    setSqlResult(null);
    setAllPassed(null);
    setHintsShown(0);
    setShowSolution(false);
    setCode(problem.kind === "sql" ? SQL_START(problem.task) : stubFor(problem, language));
    // reset only when the problem or the language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id, language]);

  const pickLanguage = (value: string) => {
    const next = value as PracticeLanguage;
    setLanguage(next);
    window.localStorage.setItem("codevit:code-test-language", next);
  };

  const recordPass = useCallback(
    (problemId: string) => {
      fetch("/api/code-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, passed: true, score: 100 }),
      }).catch(() => {});
    },
    []
  );

  const run = useCallback(async () => {
    if (!problem) return;
    setRunning(true);
    try {
      if (problem.kind === "sql") {
        const result = await runSqlProblem(problem as SqlProblem, code);
        setSqlResult(result);
        setAllPassed(result.pass);
        if (result.pass) {
          toast("Query matches the expected result 🎉", { variant: "success" });
          recordPass(problem.id);
        } else if (result.error) {
          toast("The query did not run.", { variant: "error" });
        }
        return;
      }

      const collected: CodeRow[] = [];
      for (const testCase of problem.tests) {
        // The learner only wrote a function; the driver supplies the arguments
        // and prints the returned value, so nothing reads stdin.
        const program = programFor(problem, language, code, parseArgs(problem, testCase.input));
        const res = await fetch("/api/runCode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: program, language, input: "" }),
        });
        const payload = (await res.json()) as RunResponse;
        const data = payload.data ?? payload;
        const out = (data.stdout ?? "").trim();
        collected.push({
          label: testCase.label,
          pass: !data.error && out === testCase.expected,
          got: data.error ? data.error : out,
          want: testCase.expected,
        });
      }
      setRows(collected);
      const ok = collected.every((row) => row.pass);
      setAllPassed(ok);
      if (ok) {
        toast(`All ${collected.length} tests passed 🎉`, { variant: "success" });
        recordPass(problem.id);
      }
    } catch {
      toast("Could not run the tests.", { variant: "error" });
    } finally {
      setRunning(false);
    }
  }, [problem, code, language, recordPass]);

  const upNext = useMemo(() => (problem ? nextProblem(problem.id) : undefined), [problem?.id]);

  if (!problem) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · problem</p>
            <h1 className="display mt-4 text-[42px]">No such problem.</h1>
            <Button variant="outline" className="mt-6 gap-1.5" asChild>
              <Link href="/code-test">
                <ArrowLeft className="size-4" /> All problems
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const index = TRACKS.findIndex((t) => t.id === trackOf(problem));
  const track = TRACKS[index] ?? TRACKS[0];
  const editorLanguage = problem.kind === "sql" ? "sql" : language;
  // Show the answer in the selected language, falling back to JavaScript — and
  // label whichever one is actually on screen.
  const solution =
    problem.kind === "sql"
      ? { code: problem.solution, language: "sql" as const }
      : answerFor(problem.id, language);
  const solutionCode = solution?.code ?? null;
  const solutionLabel =
    solution?.language === "sql"
      ? "Postgres"
      : solution
        ? labelFor(solution.language)
        : null;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-5 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link
            href="/code-test"
            className="group inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="grid size-7 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
              <ArrowLeft className="size-3.5" />
            </span>
            Practice library
          </Link>
          <div className="flex items-center gap-2">
            {problem.kind === "sql" ? (
              <span className="chip">
                <Database className="size-3" /> Postgres
              </span>
            ) : (
              <label className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <span className="mono-label !text-[8.5px]">language</span>
                <select
                  value={language}
                  onChange={(e) => pickLanguage(e.target.value)}
                  className="h-7 rounded-full border border-border bg-card px-2 text-[12px] text-foreground outline-none focus:border-foreground/30"
                >
                  {PRACTICE_LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span className="mono-label !text-[9px]">
              level {levelScore(problem.level)}/100
            </span>
          </div>
        </div>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  "mono-label uppercase !text-[9px]",
                  problem.level <= 3
                    ? "text-emerald-600 dark:text-emerald-400"
                    : problem.level <= 6
                      ? "text-sky-600 dark:text-sky-400"
                      : problem.level <= 8
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                )}
              >
                {track.label}
              </span>
              <span className="size-1 rounded-full bg-border" />
              <span className="mono-label !text-[9px]">{problem.topics.slice(0, 3).join(" · ")}</span>
            </div>
            <h1 className="display mt-2.5 text-[clamp(30px,4.6vw,50px)] leading-[1.02]">
              {problem.title}
            </h1>
          </div>
          <Button onClick={run} disabled={running} className="h-11 shrink-0 gap-2 px-5">
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "Running…" : problem.kind === "sql" ? "Run query" : "Run tests"}
            <kbd className="ml-1 hidden rounded border border-current/25 px-1 py-px font-sans text-[9.5px] opacity-60 sm:inline">
              Ctrl ↵
            </kbd>
          </Button>
        </header>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          {/* ── brief + hints ───────────────────────────────────────────── */}
          <aside className="grid gap-4">
            <section className="card-surface p-5">
              <p className="mono-label">The brief</p>
              <Statement text={problem.statement} />
              {problem.kind !== "sql" && (
                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
                  <p className="mono-label !text-[9px]">Write this function</p>
                  <p className="mt-1.5 break-words font-mono text-[12px] text-foreground">
                    {describeSignature(problem)}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    Return the answer — the runner calls your function with the inputs and prints
                    the result. No reading input, no printing.
                  </p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
                {problem.topics.map((t) => (
                  <span key={t} className="chip !text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
            </section>

            {problem.hints.length > 0 && (
              <section className="card-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="mono-label flex items-center gap-1.5">
                    <Lightbulb className="size-3.5" /> Hints
                  </p>
                  <span className="mono-label !text-[8.5px]">
                    {hintsShown}/{problem.hints.length} shown
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  {problem.hints.slice(0, hintsShown).map((hint, i) => (
                    <p
                      key={i}
                      className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-[12.5px] leading-relaxed text-muted-foreground"
                    >
                      <span className="mono-label mr-2 !text-[8.5px]">{i + 1}</span>
                      <Inline text={hint} />
                    </p>
                  ))}
                  {hintsShown < problem.hints.length ? (
                    <button
                      type="button"
                      onClick={() => setHintsShown((n) => n + 1)}
                      className="btn btn-outline h-8 justify-center text-[12px]"
                    >
                      Show hint {hintsShown + 1}
                    </button>
                  ) : (
                    <p className="text-[11.5px] text-muted-foreground">
                      Out of hints — the answer is one button below.
                    </p>
                  )}
                </div>
              </section>
            )}

            {problem.kind === "sql" && (
              <section className="card-surface p-5">
                <p className="mono-label flex items-center gap-1.5">
                  <Database className="size-3.5" /> Tables
                </p>
                <dl className="mt-3 grid gap-1.5 font-mono text-[11px] leading-relaxed">
                  {sqlSchemaSummary().map((table) => (
                    <div key={table.name}>
                      <dt className="text-foreground">{table.name}</dt>
                      <dd className="break-words text-muted-foreground">{table.columns}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t border-border pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                  Runs against a local Postgres built from this data on every attempt.
                </p>
              </section>
            )}

            {solutionCode && (
              <section className="card-surface p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="mono-label flex items-center gap-1.5">
                    <Eye className="size-3.5" /> Answer
                  </p>
                  {!showSolution && (
                    <button
                      type="button"
                      onClick={() => setShowSolution(true)}
                      className="text-[11.5px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Reveal
                    </button>
                  )}
                </div>
                {showSolution ? (
                  <>
                    <p className="mono-label mt-2 !text-[8.5px]">{solutionLabel}</p>
                    <pre className="mt-2 overflow-x-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11.5px] leading-relaxed">
                      {solutionCode}
                    </pre>
                  </>
                ) : (
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                    Try it yourself first — the worked answer is here when you need it.
                  </p>
                )}
              </section>
            )}

            <div className="rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
              <p className="mono-label !text-[var(--paper)]/45">When it passes</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--paper)]/65">
                A passing run is saved as an attempt and counts toward the pass rate on your
                dashboard. Retry as often as you need — practice mode is never timed.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
              >
                See your attempts <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </aside>

          {/* ── editor + results ────────────────────────────────────────── */}
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-[#0b0c0f]">
              <div className="flex h-10 items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5" aria-hidden>
                    <span className="size-2 rounded-full bg-[#ff5f57]/80" />
                    <span className="size-2 rounded-full bg-[#febc2e]/80" />
                    <span className="size-2 rounded-full bg-[#28c840]/80" />
                  </span>
                  <span className="ml-1 font-mono text-[11px] text-white/45">
                    {problem.kind === "sql" ? "query.sql" : fileFor(language)}
                  </span>
                </div>
                <span className="mono-label !text-[8.5px] !text-white/25">
                  {editorLanguage} · ace
                </span>
              </div>
              <AceEditor
                language={aceMode(editorLanguage)}
                theme="monokai"
                defaultCode={code}
                scode={code}
                onValueChange={setCode}
                onRun={() => void run()}
                height="430px"
              />
              <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5">
                <span className="mono-label !text-[8px] !text-white/20">
                  Ctrl + Enter to run
                </span>
                <span className="mono-label !text-[8px] !text-white/20">
                  {code.split("\n").length} lines
                </span>
              </div>
            </div>

            {problem.kind === "sql" ? (
              sqlResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3",
                      sqlResult.pass
                        ? "border-emerald-500/20 bg-emerald-500/[0.07]"
                        : "border-red-500/20 bg-red-500/[0.06]"
                    )}
                  >
                    <div className="flex items-center gap-2 text-[13px] font-medium">
                      {sqlResult.pass ? (
                        <>
                          <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-300">
                            Result matches
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="size-4 text-red-600 dark:text-red-400" />
                          <span className="text-red-700 dark:text-red-300">
                            {sqlResult.error ? "Query error" : "Result differs"}
                          </span>
                        </>
                      )}
                    </div>
                    {sqlResult.pass && upNext && (
                      <Link
                        href={`/code-test/${upNext.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:text-primary"
                      >
                        Next: {upNext.title} <ArrowRight className="size-3.5" />
                      </Link>
                    )}
                  </div>

                  {sqlResult.error && (
                    <pre className="whitespace-pre-wrap border-b border-border bg-red-500/[0.04] px-4 py-3 font-mono text-[11.5px] text-red-700 dark:text-red-300">
                      {sqlResult.error}
                    </pre>
                  )}

                  <div className="grid gap-0 divide-y divide-border">
                    <div>
                      <p className="mono-label px-4 py-2 !text-[8.5px]">your result</p>
                      <ResultTable columns={sqlResult.columns} rows={sqlResult.rows} />
                    </div>
                    {!sqlResult.pass && sqlResult.want.length > 0 && (
                      <div>
                        <p className="mono-label px-4 py-2 !text-[8.5px]">expected</p>
                        <ResultTable columns={sqlResult.wantColumns} rows={sqlResult.want} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Database className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-medium">No run yet</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        Write a query and run it against the seeded database.
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={run} disabled={running} className="btn btn-ink h-8 px-3.5 text-[12px]">
                    {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                    Run
                  </button>
                </div>
              )
            ) : rows.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3",
                    allPassed
                      ? "border-emerald-500/20 bg-emerald-500/[0.07]"
                      : "border-red-500/20 bg-red-500/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    {allPassed ? (
                      <>
                        <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          All {rows.length} tests passed
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="size-4 text-red-600 dark:text-red-400" />
                        <span className="text-red-700 dark:text-red-300">
                          {rows.filter((r) => r.pass).length}/{rows.length} tests passed
                        </span>
                      </>
                    )}
                  </div>
                  {allPassed && upNext && (
                    <Link
                      href={`/code-test/${upNext.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:text-primary"
                    >
                      Next: {upNext.title} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>

                <div className="divide-y divide-border">
                  {rows.map((row, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[12px]">
                      {row.pass ? (
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="mt-0.5 size-3.5 shrink-0 text-red-600 dark:text-red-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{row.label}</p>
                        {!row.pass && (
                          <p className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                            got <span className="text-foreground">{row.got || "(empty)"}</span>, want{" "}
                            <span className="text-foreground">{row.want || "(empty)"}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Terminal className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium">No run yet</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Run the code to check {problem.tests.length} tests.
                    </p>
                  </div>
                </div>
                <button type="button" onClick={run} disabled={running} className="btn btn-ink h-8 px-3.5 text-[12px]">
                  {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                  Run
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
