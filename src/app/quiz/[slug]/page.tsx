"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { QUIZZES, type Question } from "@/data/quiz";
import { toast } from "@/components/ui/toaster";

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
      // shuffle options while tracking the correct answer
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
    if (pct === 100) return { emoji: "🏆", text: "Perfect! You know this language inside out." };
    if (pct >= 80) return { emoji: "🎉", text: "Great job — solid understanding!" };
    if (pct >= 60) return { emoji: "👍", text: "Good — review the misses and try again." };
    if (pct >= 40) return { emoji: "📚", text: "Getting there — the Learn course will help." };
    return { emoji: "💪", text: "Keep practicing — start with the Learn course!" };
  }, [phase, score, deck.length]);

  if (!quiz) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Quiz not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/quiz">
              <ArrowLeft className="size-4" /> Back to quizzes
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/quiz">
            <ArrowLeft className="size-4" /> All quizzes
          </Link>
        </Button>

        {phase === "intro" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex flex-col items-center py-10 text-center">
                <span
                  className={`mb-4 flex size-16 items-center justify-center rounded-2xl font-mono text-xl font-bold ${quiz.accent}`}
                >
                  {quiz.icon}
                </span>
                <h1 className="text-2xl font-bold">{quiz.title} quiz</h1>
                <p className="mb-6 mt-1 text-sm text-muted-foreground">{quiz.description}</p>
                <p className="mb-6 text-sm text-muted-foreground">
                  {quiz.questions.length} questions · pick the correct output
                </p>
                <Button size="lg" onClick={start}>
                  Start quiz <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "playing" && current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Progress */}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((idx + (picked !== null ? 1 : 0)) / deck.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {idx + 1}/{deck.length}
              </span>
            </div>

            <Card>
              <CardContent className="py-6">
                {current.code && (
                  <pre className="mb-4 overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-[13px] leading-relaxed">
                    {current.code}
                  </pre>
                )}
                <p className="mb-4 font-medium">{current.prompt}</p>
                <div className="grid gap-2">
                  {current.options.map((opt, i) => {
                    const isPicked = picked === i;
                    const isCorrect = i === current.answer;
                    const revealed = picked !== null;
                    return (
                      <button
                        key={i}
                        onClick={() => pick(i)}
                        disabled={revealed}
                        className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left font-mono text-sm transition-colors ${
                          revealed
                            ? isCorrect
                              ? "border-green-500 bg-green-500/10 text-green-600"
                              : isPicked
                                ? "border-red-500 bg-red-500/10 text-red-500"
                                : "border-border text-muted-foreground"
                            : "hover:border-primary/50 hover:bg-accent"
                        }`}
                      >
                        <span className="break-words">{opt}</span>
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
                    className="mt-4 rounded-lg border bg-muted/40 p-3"
                  >
                    <p className="text-sm">
                      <span className="font-medium">
                        {picked === current.answer ? "Correct! " : "Not quite. "}
                      </span>
                      <span className="text-muted-foreground">{current.explanation}</span>
                    </p>
                  </motion.div>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score: {score}</span>
                  <Button onClick={next} disabled={picked === null}>
                    {idx + 1 >= deck.length ? "See results" : "Next"}{" "}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "done" && verdict && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center py-10 text-center">
                <span className="text-5xl">{verdict.emoji}</span>
                <h1 className="mt-3 text-3xl font-bold">
                  {score}/{deck.length}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{verdict.text}</p>

                {/* Answer review */}
                <div className="mt-6 w-full space-y-2 text-left">
                  {deck.map((q, i) => {
                    const ok = answers[i] === q.answer;
                    return (
                      <div
                        key={q.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          ok ? "border-green-500/40" : "border-red-500/40"
                        }`}
                      >
                        {ok ? (
                          <Check className="size-4 shrink-0 text-green-500" />
                        ) : (
                          <X className="size-4 shrink-0 text-red-500" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{q.prompt}</span>
                        {q.code && (
                          <code className="max-w-[40%] truncate font-mono text-xs text-muted-foreground">
                            {q.code.split("\n")[0]}
                          </code>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex gap-2">
                  <Button onClick={start} className="gap-1.5">
                    <RotateCcw className="size-4" /> Try again
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/learn/${quiz.slug}`}>Learn {quiz.title}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
