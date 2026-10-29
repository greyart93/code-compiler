"use client";

import Link from "next/link";
import { ArrowUpRight, BrainCircuit, Clock3, Sparkles, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { QUIZZES } from "@/data/quiz";
import { cn } from "@/lib/utils";

export default function QuizIndex() {
  const totalQuestions = QUIZZES.reduce((n, q) => n + q.questions.length, 0);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">Quiz · {QUIZZES.length} languages · no sign-in</p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Test the edges.</h1>
              <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Short, sharp questions about the parts of a language that surprise people: coercion,
                borrow rules, integer caches, nil maps. Multiple choice, explained after every answer.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/learn" className="btn btn-outline">
                Study first
              </Link>
              <Link href="/code-test" className="btn btn-ink">
                <BrainCircuit className="size-4" /> Practice problems
              </Link>
            </div>
          </div>
        </header>

        {/* stats band */}
        <div className="reveal reveal-1 mt-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {[
            [`${QUIZZES.length}`, "languages"],
            [`${totalQuestions}`, "questions"],
            ["0", "timers"],
          ].map(([value, label]) => (
            <div key={label} className="px-5 py-4">
              <p className="kpi-num text-[30px]">{value}</p>
              <p className="mono-label mt-1 !text-[8.5px]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-baseline gap-3">
            <span className="mono-label">01</span>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Pick a language</h2>
            <span className="mono-label !text-[10px]">{QUIZZES.length}</span>
          </div>
          <span className="mono-label !text-[10px]">every answer explained</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUIZZES.map((q, i) => (
            <Link
              key={q.slug}
              href={`/quiz/${q.slug}`}
              className="card-surface card-hover group flex flex-col p-5"
              style={{ animationDelay: `${Math.min(i * 30, 210)}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl font-mono text-[13px] font-bold",
                    q.accent
                  )}
                >
                  {q.icon}
                </span>
                <span className="mono-label !text-[9px]">
                  {q.questions.length} question{q.questions.length === 1 ? "" : "s"}
                </span>
              </div>

              <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
                {q.title}
              </h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                {q.description}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5">
                <span className="mono-label !text-[9px]">no timer · retry free</span>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground transition-colors group-hover:text-primary">
                  Start
                  <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-12 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-dashed border-border p-6">
            <p className="mono-label">How it works</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              {[
                { icon: Clock3, n: "01", head: "Pick a language", body: "Ten questions or fewer. No timer, no pressure." },
                { icon: Sparkles, n: "02", head: "Answer, then learn", body: "Every option is explained the moment you pick." },
                { icon: Trophy, n: "03", head: "Keep the score", body: "Retry as often as you like. Nobody is watching." },
              ].map(({ icon: I, n, head, body }) => (
                <div key={head}>
                  <div className="flex items-center gap-2">
                    <I className="size-3.5 text-muted-foreground" />
                    <span className="mono-label !text-[9px] text-primary">{n}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] font-semibold">{head}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
            <div>
              <p className="mono-label !text-[var(--paper)]/45">Not sure where to start?</p>
              <p className="display mt-3 text-[26px] leading-[1.1]">
                Read a lesson,
                <br />
                then try the quiz.
              </p>
            </div>
            <Link
              href="/learn"
              className="mt-6 flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
            >
              Open the course library <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
