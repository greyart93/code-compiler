"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { QUIZZES, type Question } from "@/data/quiz";
import { toast } from "@/components/ui/toaster";
import { Ring } from "@/components/ui/data-viz";
import { cn } from "@/lib/utils";

type Phase = "intro" | "playing" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizRunner() {
  const { slug } = useParams<{ slug: string }>();
  const quiz = QUIZZES.find((q) => q.slug === slug);

  const [phase, setPhase] = useState<Phase>("intro");
  const [deck, setDeck] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const current = deck[idx];

  const start = () => {
    if (!quiz) return;
    const shuffled = shuffle(quiz.questions).map((q) => {
      const opts = q.options.map((text, i) => ({ text, correct: i === q.answer }));
      const mixed = shuffle(opts);
      return { ...q, options: mixed.map((o) => o.text), answer: mixed.findIndex((o) => o.correct) };
    });
    setDeck(shuffled);
    setIdx(0);
    setScore(0);
    setAnswers([]);
    setPicked(null);
    setPhase("playing");
  };

  const pick = (optionIdx: number) => {
    if (picked !== null) return;
    setPicked(optionIdx);
    const correct = optionIdx === current.answer;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, optionIdx]);
  };

  const next = () => {
    if (idx + 1 >= deck.length) {
      setPhase("done");
      const finalScore = score;
      if (finalScore === deck.length) {
        toast("Perfect score! 🏆", { description: `${quiz?.title} mastered.`, variant: "success" });
      }
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  };

  const verdict = useMemo(() => {
    if (phase !== "done" || !deck.length) return null;
    const pct = Math.round((score / deck.length) * 100);
    if (pct === 100) return { text: "Perfect. You know this language inside out.", pct };
    if (pct >= 80) return { text: "Strong. A couple of edges left to polish.", pct };
    if (pct >= 60) return { text: "Solid. Review the misses and run it again.", pct };
    if (pct >= 40) return { text: "Getting there — the Learn track will help.", pct };
    return { text: "Keep practising. Start with the Learn track.", pct };
  }, [phase, score, deck.length]);

  if (!quiz) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · quiz</p>
            <h1 className="display mt-4 text-[42px]">No such quiz.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              That slug does not match a language quiz.
            </p>
            <Button variant="outline" className="mt-6 gap-1.5" asChild>
              <Link href="/quiz">
                <ArrowLeft className="size-4" /> All quizzes
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-5 sm:pt-7">
        <div className="mx-auto max-w-[880px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <Link
              href="/quiz"
              className="group inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="grid size-7 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
                <ArrowLeft className="size-3.5" />
              </span>
              All quizzes
            </Link>
            <span className="mono-label !text-[9px]">
              {quiz.title} · {quiz.questions.length} questions
            </span>
          </div>

          {/* ── intro ────────────────────────────────────────────────── */}
          {phase === "intro" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch"
            >
              <section className="card-surface flex flex-col p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-12 place-items-center rounded-xl font-mono text-[14px] font-bold",
                      quiz.accent
                    )}
                  >
                    {quiz.icon}
                  </span>
                  <div>
                    <p className="mono-label !text-[9px]">Language quiz</p>
                    <p className="text-[13px] font-medium">{quiz.title}</p>
                  </div>
                </div>

                <h1 className="display mt-7 text-[clamp(40px,6vw,64px)] leading-[1.0]">
                  {quiz.title}.
                  <br />
                  How well do you
                  <br />
                  know the edges?
                </h1>
                <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-muted-foreground">
                  {quiz.description}
                </p>

                <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-5">
                  {[
                    [`${quiz.questions.length}`, "questions"],
                    ["MCQ", "format"],
                    ["none", "timer"],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <p className="kpi-num text-[22px]">{v}</p>
                      <p className="mono-label mt-1 !text-[8px]">{l}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
                  <Button onClick={start} className="h-11 gap-2 px-6">
                    Start quiz <ArrowRight className="size-4" />
                  </Button>
                  <span className="text-[11.5px] text-muted-foreground">
                    Options are shuffled. Every answer is explained.
                  </span>
                </div>
              </section>

              <aside className="flex flex-col justify-between rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-7">
                <div>
                  <p className="mono-label !text-[var(--paper)]/45">Before you start</p>
                  <ol className="mt-4 space-y-3.5">
                    {[
                      "Pick one answer per question.",
                      "Read the explanation before moving on.",
                      "Your score is not saved — retry freely.",
                    ].map((line, i) => (
                      <li key={line} className="flex gap-3">
                        <span className="mono-label shrink-0 !text-[9px] !text-[var(--paper)]/35">
                          0{i + 1}
                        </span>
                        <span className="text-[13px] leading-relaxed text-[var(--paper)]/70">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="border-y border-white/10 py-6">
                  <p className="display text-[21px] leading-[1.18] text-[var(--paper)]/90">
                    “The edge is rarely
                    <br />
                    where you expect it.”
                  </p>
                  <p className="mono-label mt-2.5 !text-[8px] !text-[var(--paper)]/30">
                    workshop note
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="mono-label !text-[8px] !text-[var(--paper)]/30">example</p>
                  <pre className="mt-2 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-[#a8d4a1]">
                    {quiz.questions[0]?.code?.slice(0, 160) ?? "// the edge is in the details"}
                  </pre>
                </div>
              </aside>
            </motion.div>
          )}

          {/* ── playing ──────────────────────────────────────────────── */}
          {phase === "playing" && current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-7"
            >
              <div className="flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${((idx + (picked !== null ? 1 : 0)) / deck.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="mono-label !text-[9px]">
                  {idx + 1} / {deck.length}
                </span>
                <span className="mono-label !text-[9px] text-primary">score {score}</span>
              </div>

              <div className="card-surface mt-5 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <span className="mono-label !text-[9px]">{quiz.title} · quiz</span>
                  <span className="mono-label !text-[9px]">
                    question {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="p-5 sm:p-7">
                  {current.code && (
                    <div className="code-pane mb-5 overflow-x-auto">
                      <pre className="!p-4 text-[12.5px] leading-relaxed">{current.code}</pre>
                    </div>
                  )}

                  <p className="text-[16px] font-medium leading-relaxed tracking-[-0.01em] sm:text-[17px]">
                    {current.prompt}
                  </p>

                  <div className="mt-5 grid gap-2">
                    {current.options.map((opt, i) => {
                      const isPicked = picked === i;
                      const isCorrect = i === current.answer;
                      const revealed = picked !== null;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => pick(i)}
                          disabled={revealed}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 text-left font-mono text-[13px] transition-colors",
                            revealed
                              ? isCorrect
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : isPicked
                                  ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"
                                  : "border-border text-muted-foreground"
                              : "border-border hover:border-foreground/25 hover:bg-muted/40"
                          )}
                        >
                          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-current/20 text-[10px]">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="min-w-0 flex-1 break-words">{opt}</span>
                          {revealed && isCorrect && <Check className="size-4 shrink-0" />}
                          {revealed && isPicked && !isCorrect && <X className="size-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {picked !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-xl border-l-2 border-primary bg-muted/30 px-4 py-3"
                    >
                      <p className="mono-label !text-[9px] text-primary">
                        {picked === current.answer ? "Correct" : "Not quite"}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {current.explanation}
                      </p>
                    </motion.div>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="mono-label !text-[9px]">
                      {picked === null ? "pick one" : "explanation above"}
                    </span>
                    <Button onClick={next} disabled={picked === null} className="gap-1.5">
                      {idx + 1 >= deck.length ? "See results" : "Next question"}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── done ─────────────────────────────────────────────────── */}
          {phase === "done" && verdict && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28 }}
              className="mt-8"
            >
              <div className="card-surface flex flex-col items-center p-6 text-center sm:p-9">
                <p className="mono-label">Attempt complete · {quiz.title}</p>
                <Ring
                  value={verdict.pct}
                  size={164}
                  stroke={12}
                  label={`${score}/${deck.length}`}
                  sublabel={`${verdict.pct}% correct`}
                  className="mt-6"
                />
                <h1 className="display mt-5 max-w-[24ch] text-[clamp(28px,4vw,40px)] leading-[1.05]">
                  {verdict.text}
                </h1>

                <div className="mt-8 w-full max-w-[560px] space-y-2 text-left">
                  {deck.map((q, i) => {
                    const ok = answers[i] === q.answer;
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[12.5px]",
                          ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
                        )}
                      >
                        {ok ? (
                          <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <X className="size-3.5 shrink-0 text-red-600 dark:text-red-400" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{q.prompt}</span>
                        {q.code && (
                          <code className="hidden max-w-[40%] truncate font-mono text-[10.5px] text-muted-foreground sm:block">
                            {q.code.split("\n")[0]}
                          </code>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  <Button onClick={start} className="gap-1.5">
                    <RotateCcw className="size-4" /> Try again
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/learn/${quiz.slug}`}>Learn {quiz.title}</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/quiz">All quizzes</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
