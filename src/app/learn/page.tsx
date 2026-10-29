"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Search,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { COURSES } from "@/data/courses";
import { Empty } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const CATEGORY_BY_SLUG: Record<string, string> = {
  react: "Frontend",
  nextjs: "Frontend",
  javascript: "Frontend",
  typescript: "Frontend",
  sql: "Data",
  mongodb: "Data",
  prisma: "Data",
  python: "Languages",
  java: "Languages",
  php: "Languages",
  csharp: "Languages",
  kotlin: "Languages",
  dart: "Languages",
  swift: "Languages",
  ruby: "Languages",
  lua: "Languages",
  c_cpp: "Systems",
  go: "Systems",
  rust: "Systems",
  assembly: "Systems",
  bash: "Tooling",
  github: "Tooling",
};

const CATEGORY_TONE: Record<string, string> = {
  Frontend: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  Data: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  Languages: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  Systems: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  Tooling: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
};

const CATEGORIES = ["All", "Frontend", "Languages", "Data", "Systems", "Tooling"];

function categoryOf(slug: string) {
  return CATEGORY_BY_SLUG[slug] ?? "Languages";
}

export default function LearnIndex() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      COURSES.filter((c) => {
        const inCategory = category === "All" || categoryOf(c.slug) === category;
        const inQuery =
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          categoryOf(c.slug).toLowerCase().includes(q);
        return inCategory && inQuery;
      }),
    [category, q]
  );

  const featured =
    category === "All" && !q && filtered.length > 1 ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of COURSES) {
      const key = categoryOf(c.slug);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, []);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Course library · {COURSES.length} tracks · free, forever
              </p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Learn by building.</h1>
              <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Structured courses that go from first syntax to production patterns. Read a lesson,
                run the code, keep the notes — no paywall at the end.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/playground" className="btn btn-ink">
                <BookOpen className="size-4" /> Open playground
              </Link>
              <Link href="/dashboard" className="btn btn-outline">
                Your progress
              </Link>
            </div>
          </div>
        </header>

        {/* ── toolbar ───────────────────────────────────────────────── */}
        <div className="reveal reveal-1 mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracks — React, SQL, GitHub…"
              aria-label="Search courses"
              className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn("chip", category === cat && "chip-active")}
              >
                {cat}
                {cat !== "All" && (
                  <span className="opacity-50">{counts.get(cat) ?? 0}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty
            icon={GraduationCap}
            title="No track matches that"
            body="Try a broader search, or clear the category filter."
            className="mt-10"
            action={
              <button
                type="button"
                onClick={() => {
                  setCategory("All");
                  setQuery("");
                }}
                className="btn btn-ink"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {/* ── featured track ───────────────────────────────────── */}
            {featured && (
              <article className="reveal reveal-2 mt-7 overflow-hidden rounded-3xl bg-[var(--ink)] text-[var(--paper)]">
                <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                    <div className="flex items-center gap-2">
                      <span className="chip !border-white/15 !bg-white/10 !text-[var(--paper)]">
                        <Sparkles className="size-3" /> Start here
                      </span>
                      <span className="mono-label !text-[var(--paper)]/45">
                        {categoryOf(featured.slug)} · 3 sections
                      </span>
                    </div>

                    <h2 className="display mt-6 max-w-[16ch] text-[clamp(34px,4.6vw,54px)] leading-[1.0]">
                      {featured.title}, from first render to production.
                    </h2>
                    <p className="mt-4 max-w-[54ch] text-[13.5px] leading-relaxed text-[var(--paper)]/65">
                      {featured.description}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
                      <Link
                        href={`/learn/${featured.slug}`}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--paper)] px-5 text-[13px] font-semibold text-[var(--ink)] transition-transform hover:-translate-y-0.5"
                      >
                        Open the course <ArrowRight className="size-4" />
                      </Link>
                      <Link
                        href={`/learn/${featured.slug}`}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-5 text-[13px] font-medium text-[var(--paper)] transition-colors hover:bg-white/10"
                      >
                        See the lessons
                      </Link>
                    </div>
                  </div>

                  <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden border-t border-white/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-8 right-2 select-none font-mono text-[120px] font-bold leading-none tracking-tighter text-white/[0.05]"
                    >
                      01
                    </span>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        ["Hooks", "state & effects"],
                        ["Data", "fetch & cache"],
                        ["Speed", "memo & split"],
                      ].map(([head, body]) => (
                        <div key={head}>
                          <p className="text-[13px] font-semibold">{head}</p>
                          <p className="mono-label mt-1 !text-[8px] !text-[var(--paper)]/40">
                            {body}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="relative border-t border-white/10 pt-5">
                      <p className="mono-label !text-[var(--paper)]/40">Inside the track</p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--paper)]/70">
                        JSX and components, state without surprises, data fetching, forms,
                        performance and server components.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* ── all tracks ───────────────────────────────────────── */}
            <section className="reveal reveal-3 mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-baseline gap-3">
                  <span className="mono-label">{featured ? "02" : "01"}</span>
                  <h2 className="text-[19px] font-semibold tracking-[-0.02em]">
                    {category === "All" ? (featured ? "More tracks" : "All tracks") : category}
                  </h2>
                  <span className="mono-label !text-[10px]">{rest.length}</span>
                </div>
                <span className="mono-label !text-[10px]">every lesson free</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((c, i) => {
                  const cat = categoryOf(c.slug);
                  return (
                    <Link
                      key={c.slug}
                      href={`/learn/${c.slug}`}
                      className="card-surface card-hover group flex flex-col p-5"
                      style={{ animationDelay: `${Math.min(i * 30, 180)}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "grid size-10 place-items-center rounded-xl text-[13px] font-bold",
                            CATEGORY_TONE[cat]
                          )}
                        >
                          {c.title.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="mono-label !text-[9px]">{cat}</span>
                          <span className="mono-label !text-[9px] text-border">
                            {String(i + (featured ? 2 : 1)).padStart(2, "0")}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
                        {c.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                        {c.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5">
                        <span className="mono-label !text-[9px]">course · free</span>
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground transition-colors group-hover:text-primary">
                          Start
                          <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">Learn · read, run, keep the notes</p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/quiz" className="link-underline hover:text-foreground">
              Take a quiz
            </Link>
            <Link href="/code-test" className="link-underline hover:text-foreground">
              Practice problems
            </Link>
            <Link href="/blog" className="link-underline hover:text-foreground">
              Read the blog
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
