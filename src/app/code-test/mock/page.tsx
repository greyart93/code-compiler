"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  Play,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { toast } from "@/components/ui/toaster";
import {
  CODE_PROBLEMS,
  LEVEL_BANDS,
  PRACTICE_LANGUAGES,
  aceMode,
  fileFor,
  levelScore,
  parseArgs,
  programFor,
  shuffled,
  stubFor,
  type CodeProblem,
  type PracticeLanguage,
} from "@/data/code-tests";
import { cn } from "@/lib/utils";

const AceEditor = dynamic(() => import("../../_editor/(AceEditor)/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] items-center justify-center font-mono text-[12px] text-white/40">
      Loading editor…
    </div>
  ),
});

type Stage = "setup" | "running" | "done";

type Item = {
  problem: CodeProblem;
  code: string;
  /** null = not attempted yet */
  passed: boolean | null;
  passedCount: number;
};

const TEST_SIZE = 4;
const TEST_MINUTES = 25;

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function MockTestPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [language, setLanguage] = useState<PracticeLanguage>("javascript");
  const [band, setBand] = useState<(typeof LEVEL_BANDS)[number]["id"]>("beginner");
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const stored = window.localStorage.getItem("codevit:code-test-language");
    if (stored && PRACTICE_LANGUAGES.some((l) => l.value === stored)) {
      setLanguage(stored as PracticeLanguage);
    }
  }, []);

  useEffect(() => {
    if (stage !== "running" || !deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [stage, deadline]);

  const start = () => {
    const range = LEVEL_BANDS.find((b) => b.id === band) ?? LEVEL_BANDS[1];
    const inBand = CODE_PROBLEMS.filter((p) => p.level >= range.min && p.level <= range.max);
    const pool = inBand.length >= TEST_SIZE ? inBand : CODE_PROBLEMS;
    const picked = shuffled(pool, Date.now()).slice(0, TEST_SIZE);

    setItems(
      picked.map((problem) => ({
        problem,
        code: stubFor(problem, language),
        passed: null,
        passedCount: 0,
      }))
    );
    setActive(0);
    setStage("running");
    setNow(Date.now());
    setDeadline(Date.now() + TEST_MINUTES * 60_000);
    window.localStorage.setItem("codevit:code-test-language", language);
  };

  const finish = useCallback((reason: "submitted" | "time") => {
    setStage("done");
    setDeadline(null);
    if (reason === "time") toast("Time is up — here is your score.", {});
  }, []);

  useEffect(() => {
    if (stage === "running" && deadline && now >= deadline) finish("time");
  }, [stage, deadline, now, finish]);

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const runCurrent = async () => {
    const item = items[active];
    if (!item) return;
    setRunning(true);
    try {
      let passed = 0;
      for (const testCase of item.problem.tests) {
        // Same driver as practice mode: the learner's function is called with
        // generated arguments, so their editor never contains input plumbing.
        const program = programFor(
          item.problem,
          language,
          item.code,
          parseArgs(item.problem, testCase.input)
        );
        const res = await fetch("/api/runCode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: program, language, input: "" }),
        });
        const payload = await res.json();
        const data = payload.data ?? payload;
        const out = (data.stdout ?? "").trim();
        if (!data.error && out === testCase.expected) passed += 1;
      }
      updateItem(active, {
        passed: passed === item.problem.tests.length,
        passedCount: passed,
      });
      if (passed === item.problem.tests.length) {
        toast("Problem solved 🔒", { variant: "success" });
      } else {
        toast(`${passed}/${item.problem.tests.length} tests passing`, {});
      }
    } catch {
      toast("Could not run the tests.", { variant: "error" });
    } finally {
      setRunning(false);
    }
  };

  const submit = () => {
    // persist solved problems once
    for (const item of items) {
      if (item.passed) {
        fetch("/api/code-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: item.problem.id, passed: true, score: 100 }),
        }).catch(() => {});
      }
    }
    finish("submitted");
  };

  const score = useMemo(
    () => items.filter((item) => item.passed).length,
    [items]
  );

  const remaining = deadline ? deadline - now : 0;
  const timeTone =
    remaining <= 60_000
      ? "text-red-600 dark:text-red-400"
      : remaining <= 5 * 60_000
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";

  const current = items[active];

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
          <span className="mono-label !text-[9px]">test mode · {TEST_MINUTES} min · {TEST_SIZE} problems</span>
        </div>

        {stage === "setup" && (
          <div className="mx-auto mt-10 max-w-2xl">
            <p className="mono-label">Mode 02 · test</p>
            <h1 className="display mt-3 text-[clamp(34px,6vw,64px)]">Sit a mock test.</h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
              Four unseen problems from one level band, {TEST_MINUTES} minutes on the clock. Test
              results tell you how many checks pass, not the expected output — that is the point.
            </p>

            <div className="mt-8 grid gap-4">
              <div>
                <p className="mono-label mb-2">Language</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRACTICE_LANGUAGES.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLanguage(l.value)}
                      className={cn("chip", language === l.value && "chip-active")}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mono-label mb-2">Level band</p>
                <div className="flex flex-wrap gap-1.5">
                  {LEVEL_BANDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBand(b.id)}
                      className={cn("chip", band === b.id && "chip-active")}
                      title={b.hint}
                    >
                      {b.label}
                      <span className="opacity-50">{b.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={start} className="h-11 gap-2 px-5">
                  <Clock className="size-4" /> Start the clock
                </Button>
                <p className="text-[12px] text-muted-foreground">
                  Passing checks are saved to your dashboard when you submit.
                </p>
              </div>
            </div>
          </div>
        )}

        {stage === "running" && current && (
          <div className="mt-5">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-2">
                {items.map((item, i) => (
                  <button
                    key={item.problem.id}
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "mono-label flex h-7 items-center gap-1.5 rounded-full border px-3 !text-[9px] transition-colors",
                      i === active
                        ? "border-foreground/40 bg-card text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                    {item.passed === true && <Check className="size-3 text-emerald-500" />}
                    {item.passed === false && <X className="size-3 text-red-500" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className={cn("font-mono text-[18px] tabular-nums", timeTone)}>
                  {formatClock(remaining)}
                </span>
                <button type="button" onClick={submit} className="btn btn-ink h-8 px-3.5 text-[12px]">
                  Submit test
                </button>
              </div>
            </header>

            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <aside className="grid gap-4">
                <section className="card-surface p-5">
                  <div className="flex items-center justify-between">
                    <p className="mono-label">
                      problem {active + 1} / {items.length}
                    </p>
                    <span className="mono-label !text-[8.5px] text-muted-foreground">
                      level {levelScore(current.problem.level)}/100
                    </span>
                  </div>
                  <h2 className="mt-2 text-[22px] font-medium tracking-[-0.02em]">
                    {current.problem.title}
                  </h2>
                  <div className="mt-3 grid gap-2 text-[13px] leading-relaxed text-foreground/90">
                    {current.problem.statement
                      .replace(/\r/g, "")
                      .replace(/```/g, "")
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((line, i) => (
                        <p key={i}>{line.replace(/\*\*/g, "")}</p>
                      ))}
                  </div>
                </section>

                <section className="card-surface p-5">
                  <p className="mono-label">Checks</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {current.passed === null
                      ? "Not run yet."
                      : `${current.passedCount} of ${current.problem.tests.length} checks pass.`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={runCurrent}
                      disabled={running}
                      variant="outline"
                      className="h-9 gap-2 px-4 text-[12.5px]"
                    >
                      {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                      {running ? "Running…" : "Run checks"}
                    </Button>
                    {active < items.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActive(active + 1)}
                        className="btn btn-outline h-9 gap-1.5 px-4 text-[12.5px]"
                      >
                        Next problem <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                </section>
              </aside>

              <div className="overflow-hidden rounded-2xl border border-border bg-[#0b0c0f]">
                <div className="flex h-10 items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5" aria-hidden>
                      <span className="size-2 rounded-full bg-[#ff5f57]/80" />
                      <span className="size-2 rounded-full bg-[#febc2e]/80" />
                      <span className="size-2 rounded-full bg-[#28c840]/80" />
                    </span>
                    <span className="ml-1 font-mono text-[11px] text-white/45">{fileFor(language)}</span>
                  </div>
                  <span className="mono-label !text-[8.5px] !text-white/25">{language} · ace</span>
                </div>
                <AceEditor
                  key={`${current.problem.id}-${language}`}
                  language={aceMode(language)}
                  theme="monokai"
                  defaultCode={current.code}
                  scode={current.code}
                  onValueChange={(value) => updateItem(active, { code: value })}
                  onRun={() => void runCurrent()}
                  height="430px"
                />
                <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5">
                  <span className="mono-label !text-[8px] !text-white/20">Ctrl + Enter to check</span>
                  <span className="mono-label !text-[8px] !text-white/20">
                    {current.code.split("\n").length} lines
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="mx-auto mt-10 max-w-3xl">
            <p className="mono-label">Mode 02 · result</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="display text-[clamp(34px,6vw,64px)]">
                  {score}/{items.length} solved
                </h1>
                <p className="mt-2 text-[13.5px] text-muted-foreground">
                  {score === items.length
                    ? "Clean sweep. Move up a level band."
                    : score === 0
                      ? "Start with the practice library — level 10–20 problems first."
                      : "Solid. Review the misses, then retake the same band."}
                </p>
              </div>
              <div className="grid size-16 place-items-center rounded-2xl border border-border bg-card">
                {score === items.length ? (
                  <Trophy className="size-7 text-amber-500" />
                ) : (
                  <span className="kpi-num text-[26px]">{Math.round((score / items.length) * 100)}%</span>
                )}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.problem.id} className="flex items-center gap-3 px-4 py-3">
                    {item.passed ? (
                      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{item.problem.title}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        level {levelScore(item.problem.level)}/100 ·{" "}
                        {item.passed === null
                          ? "not attempted"
                          : `${item.passedCount}/${item.problem.tests.length} checks`}
                      </p>
                    </div>
                    <Link
                      href={`/code-test/${item.problem.id}`}
                      className="mono-label shrink-0 !text-[9px] text-muted-foreground hover:text-foreground"
                    >
                      review
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={start} className="h-10 gap-2 px-4">
                <RotateCcw className="size-4" /> Retake this band
              </Button>
              <button type="button" onClick={() => setStage("setup")} className="btn btn-outline h-10 px-4 text-[13px]">
                Change language or level
              </button>
              <Link href="/code-test" className="text-[12.5px] text-muted-foreground hover:text-foreground">
                Back to practice
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
