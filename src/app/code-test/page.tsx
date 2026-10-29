"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, Terminal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PROBLEMS, type Problem } from "@/data/code-tests";
import { Empty } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 } as const;

const DIFF_TONE: Record<Problem["difficulty"], string> = {
  easy: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  hard: "text-red-600 dark:text-red-400",
};

export default function CodeTestListPage() {
  const [query, setQuery] = useState("");
  const [diff, setDiff] = useState<"all" | Problem["difficulty"]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROBLEMS.filter(
      (p) =>
        (diff === "all" || p.difficulty === diff) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.blurb.toLowerCase().includes(q) ||
          p.topics.some((t) => t.toLowerCase().includes(q)))
    ).sort((a, b) => {
      const d = DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty];
      return d !== 0 ? d : a.title.localeCompare(b.title);
    });
  }, [query, diff]);

  const counts = useMemo(() => {
    return {
      all: PROBLEMS.length,
      easy: PROBLEMS.filter((p) => p.difficulty === "easy").length,
      medium: PROBLEMS.filter((p) => p.difficulty === "medium").length,
      hard: PROBLEMS.filter((p) => p.difficulty === "hard").length,
    };
  }, []);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Practice · {PROBLEMS.length} problems · instant checks
              </p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Solve the small ones.</h1>
              <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Arrays, objects, recursion, strings — the problems that build fluency. Each one runs
                against real tests inside a real editor, and every passing attempt lands on your
                dashboard.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/learn/javascript" className="btn btn-outline">
                Read the notes
              </Link>
              <Link href="/playground" className="btn btn-ink">
                <Terminal className="size-4" /> Open playground
              </Link>
            </div>
          </div>
        </header>

        {/* stats */}
        <div className="reveal reveal-1 mt-6 grid grid-cols-2 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-4">
          {(
            [
              ["All", counts.all, "problems"],
              ["Easy", counts.easy, "warm-up"],
              ["Medium", counts.medium, "one step up"],
              ["Hard", counts.hard, "deep end"],
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

        {/* toolbar */}
        <div className="reveal reveal-2 mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems or topics…"
              aria-label="Search problems"
              className="h-9 w-full rounded-full border border-border bg-card pl-10 pr-4 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiff(d)}
                className={cn("chip capitalize", diff === d && "chip-active")}
              >
                {d}
                <span className="opacity-50">{counts[d]}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty
            icon={Terminal}
            title="No problem matches"
            body="Try a broader search or clear the difficulty filter."
            className="mt-8"
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDiff("all");
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
              <span className="mono-label w-7 !text-[8.5px]">No.</span>
              <span className="mono-label w-16 !text-[8.5px]">Level</span>
              <span className="mono-label flex-1 !text-[8.5px]">Problem</span>
              <span className="mono-label hidden w-[200px] text-right lg:block !text-[8.5px]">
                Topics
              </span>
              <span className="w-4" />
            </div>

            <div className="divide-y divide-border">
              {filtered.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/code-test/${p.id}`}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <span className="mono-label w-7 shrink-0 !text-[9.5px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "mono-label w-16 shrink-0 uppercase !text-[8.5px]",
                      DIFF_TONE[p.difficulty]
                    )}
                  >
                    {p.difficulty}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium tracking-[-0.01em] transition-colors group-hover:text-primary">
                      {p.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground sm:block">
                      {p.blurb}
                    </p>
                  </div>
                  <span className="mono-label hidden w-[200px] shrink-0 truncate text-right !text-[8.5px] text-muted-foreground lg:block">
                    {p.topics.slice(0, 3).join(" · ")}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">Practice · tests run on the real engine</p>
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
