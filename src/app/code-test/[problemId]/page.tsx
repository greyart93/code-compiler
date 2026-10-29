"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Loader2,
  Play,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { PROBLEMS, type Problem } from "@/data/code-tests";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const AceEditor = dynamic(() => import("../../_editor/(AceEditor)/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center font-mono text-[12px] text-white/40">
      Loading editor…
    </div>
  ),
});

type Result = { stdout: string | null; stderr: string | null; error: string | null };

const DIFF_TONE: Record<Problem["difficulty"], string> = {
  easy: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  hard: "text-red-600 dark:text-red-400",
};

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
            <code
              key={i}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function CodeTestSolvePage() {
  const params = useParams<{ problemId?: string }>();
  const first = PROBLEMS[0];
  const id = params?.problemId ?? first.id;
  const problem = PROBLEMS.find((p) => p.id === id) as Problem | undefined;
  const lang = "javascript" as const;

  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<
    Array<{ label: string; pass: boolean; got: string; want: string }>
  >([]);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  useEffect(() => {
    if (problem) setCode(problem.starter[lang] ?? "");
  }, [problem?.id]);

  const run = useCallback(async () => {
    if (!problem) return;
    setRunning(true);
    try {
      const rows: typeof results = [];
      for (const tc of problem.tests) {
        const res = await fetch("/api/runCode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language: lang, input: tc.input }),
        });
        const data: Result = await res.json();
        const out = (data.stdout ?? "").trim();
        rows.push({ label: tc.label, pass: out === tc.expected, got: out, want: tc.expected });
      }
      setResults(rows);
      const ok = rows.every((r) => r.pass);
      setAllPassed(ok);
      if (ok) {
        toast("All tests passed 🎉", { variant: "success" });
        fetch("/api/code-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: problem.id, passed: true, score: 100 }),
        }).catch(() => {});
      }
    } catch {
      toast("Could not run the tests.", { variant: "error" });
    } finally {
      setRunning(false);
    }
  }, [problem, code, lang]);

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

  const index = PROBLEMS.findIndex((p) => p.id === problem.id);
  const nextProblem = PROBLEMS[(index + 1) % PROBLEMS.length];

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
            All problems
          </Link>
          <span className="mono-label !text-[9px]">
            problem {String(index + 1).padStart(2, "0")} / {PROBLEMS.length}
          </span>
        </div>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn("mono-label uppercase !text-[9px]", DIFF_TONE[problem.difficulty])}>
                {problem.difficulty}
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
            {running ? "Running…" : "Run tests"}
            <kbd className="ml-1 hidden rounded border border-current/25 px-1 py-px font-sans text-[9.5px] opacity-60 sm:inline">
              Ctrl ↵
            </kbd>
          </Button>
        </header>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          {/* ── brief ─────────────────────────────────────────────────── */}
          <aside className="grid gap-4">
            <section className="card-surface p-5">
              <p className="mono-label">The brief</p>
              <div className="mt-3 text-[13.5px] leading-relaxed text-foreground/90">
                {problem.statement
                  .replace(/\r/g, "")
                  .split("\n")
                  .map((line, i) => (
                    <p key={i} className={line ? "mb-2 last:mb-0" : "h-2"}>
                      <Inline text={line} />
                    </p>
                  ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
                {problem.topics.map((t) => (
                  <span key={t} className="chip !text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
            </section>

            <section className="card-surface p-5">
              <div className="flex items-center justify-between">
                <p className="mono-label">Sample tests</p>
                <span className="mono-label !text-[9px]">{problem.tests.length} checks</span>
              </div>
              <div className="mt-3 grid gap-2">
                {problem.tests.map((t, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono-label !text-[8.5px]">{t.label}</span>
                      <span className="mono-label !text-[8.5px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <dl className="mt-2 grid gap-1 font-mono text-[11px] leading-relaxed">
                      <div className="flex gap-2">
                        <dt className="w-9 shrink-0 text-muted-foreground">in</dt>
                        <dd className="min-w-0 break-words">{t.input || "(none)"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-9 shrink-0 text-muted-foreground">out</dt>
                        <dd className="min-w-0 break-words text-emerald-600 dark:text-emerald-400">
                          {t.expected}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
              <p className="mono-label !text-[var(--paper)]/45">When it passes</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--paper)]/65">
                A passing run is recorded as an attempt and counts toward the pass rate on your
                dashboard. Keep the editor open — you can retry freely.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
              >
                See your attempts <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </aside>

          {/* ── editor + results ──────────────────────────────────────── */}
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-[#0b0c0f]">
              <div className="flex h-10 items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5" aria-hidden>
                    <span className="size-2 rounded-full bg-[#ff5f57]/80" />
                    <span className="size-2 rounded-full bg-[#febc2e]/80" />
                    <span className="size-2 rounded-full bg-[#28c840]/80" />
                  </span>
                  <span className="ml-1 font-mono text-[11px] text-white/45">solution.js</span>
                </div>
                <span className="mono-label !text-[8.5px] !text-white/25">javascript · ace</span>
              </div>
              <AceEditor
                language="javascript"
                theme="monokai"
                defaultCode={problem.starter[lang] ?? ""}
                scode={code}
                onValueChange={setCode}
                onRun={() => void run()}
                height="420px"
              />
              <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5">
                <span className="mono-label !text-[8px] !text-white/20">Ctrl + Enter to run</span>
                <span className="mono-label !text-[8px] !text-white/20">
                  {code.split("\n").length} lines
                </span>
              </div>
            </div>

            {results.length > 0 ? (
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
                          All {results.length} tests passed
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="size-4 text-red-600 dark:text-red-400" />
                        <span className="text-red-700 dark:text-red-300">Some tests failed</span>
                      </>
                    )}
                  </div>
                  {allPassed && (
                    <Link
                      href={`/code-test/${nextProblem.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:text-primary"
                    >
                      Next: {nextProblem.title} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>

                <div className="divide-y divide-border">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-4 py-3 text-[12px]">
                      {r.pass ? (
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="mt-0.5 size-3.5 shrink-0 text-red-600 dark:text-red-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{r.label}</p>
                        {!r.pass && (
                          <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                            got <span className="text-foreground">{r.got || "(empty)"}</span>, want{" "}
                            <span className="text-foreground">{r.want}</span>
                          </p>
                        )}
                      </div>
                      <span className={cn("mono-label !text-[8.5px]", r.pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {r.pass ? "pass" : "fail"}
                      </span>
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
                <button
                  type="button"
                  onClick={run}
                  disabled={running}
                  className="btn btn-ink h-8 px-3.5 text-[12px]"
                >
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
