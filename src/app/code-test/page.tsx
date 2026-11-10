"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Clock, Layers, Search, Sparkles, Terminal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  LEVEL_BANDS,
  PRACTICE_LANGUAGES,
  PROBLEMS,
  SQL_SET,
  TRACKS,
  levelScore,
  trackOf,
  type LevelBandId,
  type TrackId,
} from "@/data/code-tests";
import { Empty } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export default function CodeTestListPage() {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<TrackId | "all">("all");
  const [band, setBand] = useState<LevelBandId | "all">("all");
  const [solved, setSolved] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    fetch("/api/code-attempt")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data?.attempts) return;
        const ids = new Set<string>(
          data.attempts.filter((a: { passed: boolean }) => a.passed).map((a: { problemId: string }) => a.problemId)
        );
        setSolved(ids);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bandRange = LEVEL_BANDS.find((b) => b.id === band);

    return PROBLEMS.filter((problem) => {
      if (bandRange && (problem.level < bandRange.min || problem.level > bandRange.max)) return false;
      if (track !== "all" && trackOf(problem) !== track) return false;
      if (!q) return true;
      return (
        problem.title.toLowerCase().includes(q) ||
        problem.blurb.toLowerCase().includes(q) ||
        problem.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, track, band]);

  const counts = useMemo(() => {
    const byTrack = new Map<TrackId, number>();
    for (const problem of PROBLEMS) {
      const id = trackOf(problem);
      byTrack.set(id, (byTrack.get(id) ?? 0) + 1);
    }
    return byTrack;
  }, []);

  const totalSolved = PROBLEMS.filter((p) => solved.has(p.id)).length;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Practice · {PROBLEMS.length} problems · levels 10–100
              </p>
              <h1 className="display mt-3 text-[clamp(42px,7.4vw,84px)]">From zero to interview.</h1>
              <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Start at level 10 — print a greeting, add two numbers — and climb to window
                functions and dynamic programming. Every problem runs your code against real
                tests in any of {PRACTICE_LANGUAGES.length} languages, and the SQL track queries
                a real Postgres database.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {totalSolved > 0 && (
                <span className="chip">
                  <Check className="size-3" />
                  {totalSolved} solved
                </span>
              )}
              <Link href="/playground" className="btn btn-outline">
                <Terminal className="size-4" /> Playground
              </Link>
            </div>
          </div>
        </header>

        {/* two modes */}
        <div className="reveal reveal-1 mt-6 grid gap-4 md:grid-cols-2">
          <section className="card-surface relative overflow-hidden p-5">
            <span className="mono-label">Mode 01 · practice</span>
            <h2 className="mt-2 text-[22px] font-medium tracking-[-0.02em]">Learn at your pace</h2>
            <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
              Browse by level and topic, run the tests as often as you like, read the hints one at
              a time. Sessions are never timed and nothing is lost if you leave.
            </p>
            <ul className="mt-4 grid gap-1.5 text-[12.5px] text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" /> Progressive hints, then a worked answer
              </li>
              <li className="flex items-center gap-2">
                <Layers className="size-3.5 text-primary" /> {PRACTICE_LANGUAGES.length} languages per problem
              </li>
            </ul>
            <p className="mono-label mt-5 !text-[8.5px]">You are here</p>
          </section>

          <Link
            href="/code-test/mock"
            className="group card-surface relative overflow-hidden p-5 transition-colors hover:border-foreground/25"
          >
            <span className="mono-label">Mode 02 · test</span>
            <h2 className="mt-2 text-[22px] font-medium tracking-[-0.02em]">Timed mock test</h2>
            <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
              Pick a language and a level band, then solve a handful of unseen problems against the
              clock. One attempt, one score, a breakdown at the end.
            </p>
            <ul className="mt-4 grid gap-1.5 text-[12.5px] text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="size-3.5 text-primary" /> 25 minutes, four problems
              </li>
              <li className="flex items-center gap-2">
                <ArrowUpRight className="size-3.5 text-primary" /> Pass/fail per problem, no test details
              </li>
            </ul>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium group-hover:text-primary">
              Start a test <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </div>

        {/* stats */}
        <div className="reveal reveal-1 mt-4 grid grid-cols-2 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-4">
          {(
            [
              ["Problems", PROBLEMS.length, "code + SQL"],
              ["Level 10–20", PROBLEMS.filter((p) => p.level <= 2).length, "beginner"],
              ["SQL", SQL_SET.length, "real Postgres"],
              ["Level 90+", PROBLEMS.filter((p) => p.level >= 9).length, "deep end"],
            ] as const
          ).map(([label, value, hint]) => (
            <div key={label} className="px-5 py-4">
              <p className="kpi-num text-[30px]">{value}</p>
              <p className="mono-label mt-1 !text-[8.5px]">
                {label} · {hint}
              </p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="reveal reveal-2 mt-6 grid gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems, topics…"
              aria-label="Search problems"
              className="h-9 w-full rounded-full border border-border bg-card pl-10 pr-4 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTrack("all")}
              className={cn("chip", track === "all" && "chip-active")}
            >
              all tracks
              <span className="opacity-50">{PROBLEMS.length}</span>
            </button>
            {TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTrack(t.id)}
                className={cn("chip", track === t.id && "chip-active")}
                title={t.blurb}
              >
                {t.label}
                <span className="opacity-50">{counts.get(t.id) ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBand("all")}
              className={cn("chip", band === "all" && "chip-active")}
            >
              every level
            </button>
            {LEVEL_BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBand(b.id)}
                className={cn("chip", band === b.id && "chip-active")}
                title={b.hint}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty
            icon={Terminal}
            title="No problem matches"
            body="Try a broader search, another track, or clear the level filter."
            className="mt-8"
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTrack("all");
                  setBand("all");
                }}
                className="btn btn-outline"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <section className="reveal reveal-3 mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-4 py-2.5 sm:flex">
              <span className="mono-label w-16 !text-[8.5px]">Level</span>
              <span className="mono-label flex-1 !text-[8.5px]">Problem</span>
              <span className="mono-label hidden w-[190px] text-right lg:block !text-[8.5px]">Track</span>
              <span className="w-4" />
            </div>

            <div className="divide-y divide-border">
              {filtered.map((p) => {
                const t = TRACKS.find((entry) => entry.id === trackOf(p));
                const isSolved = solved.has(p.id);
                return (
                  <Link
                    key={p.id}
                    href={`/code-test/${p.id}`}
                    className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <span className="w-16 shrink-0">
                      <span
                        className={cn(
                          "mono-label block !text-[9px]",
                          p.level <= 3
                            ? "text-emerald-600 dark:text-emerald-400"
                            : p.level <= 6
                              ? "text-sky-600 dark:text-sky-400"
                              : p.level <= 8
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {levelScore(p.level)}
                      </span>
                      <span className="mono-label block !text-[8px] text-muted-foreground">
                        /100
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[14px] font-medium tracking-[-0.01em] transition-colors group-hover:text-primary">
                        {isSolved && <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                        {p.title}
                        {p.kind === "sql" && (
                          <span className="rounded border border-border px-1 py-px font-mono text-[9px] uppercase text-muted-foreground">
                            sql
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">{p.blurb}</p>
                    </div>
                    <span className="mono-label hidden w-[190px] shrink-0 truncate text-right !text-[8.5px] text-muted-foreground lg:block">
                      {t?.label ?? "—"} · {p.topics.slice(0, 2).join(" · ")}
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">
            Practice · code runs on the real engine, SQL on local Postgres
          </p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/quiz" className="link-underline hover:text-foreground">
              Take a quiz
            </Link>
            <Link href="/dashboard" className="link-underline hover:text-foreground">
              Your attempts
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
