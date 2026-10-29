"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  HelpCircle,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useMe } from "@/lib/use-me";
import { toast } from "@/components/ui/toaster";
import { Empty } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  title: string;
  tags: string | null;
  createdAt: string;
  user: { username: string; name: string | null };
  _count: { votes: number; answers: number };
  votedByMe: boolean;
};

const TABS = [
  { value: "trending", label: "Trending" },
  { value: "recent", label: "Newest" },
  { value: "unanswered", label: "Unanswered" },
  { value: "mine", label: "Mine" },
];

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function tagList(tags: string | null) {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default function DiscussPage() {
  const { me } = useMe();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [hot, setHot] = useState<Question[]>([]);
  const [tab, setTab] = useState("trending");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setQuestions(null);
    const params = new URLSearchParams({ tab });
    if (search.trim()) params.set("q", search.trim());
    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions ?? []))
      .catch(() => setQuestions([]));
  }, [tab, search]);

  useEffect(load, [load]);

  useEffect(() => {
    fetch("/api/questions?tab=trending")
      .then((r) => r.json())
      .then((d) => setHot((d.questions ?? []).slice(0, 5)))
      .catch(() => setHot([]));
  }, []);

  const handleVote = async (question: Question) => {
    if (!me) {
      toast("Login to vote", { variant: "error", actionLabel: "Sign in", actionHref: "/login" });
      return;
    }
    setQuestions(
      (prev) =>
        prev?.map((x) =>
          x.id === question.id
            ? {
                ...x,
                votedByMe: !x.votedByMe,
                _count: { ...x._count, votes: x._count.votes + (x.votedByMe ? -1 : 1) },
              }
            : x
        ) ?? null
    );
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        toast("Login to vote", { variant: "error", actionLabel: "Sign in", actionHref: "/login" });
      }
      load();
    }
  };

  const stats = useMemo(() => {
    const list = questions ?? [];
    return {
      total: list.length,
      answered: list.filter((q) => q._count.answers > 0).length,
      votes: list.reduce((sum, q) => sum + q._count.votes, 0),
    };
  }, [questions]);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Discuss · {questions === null ? "loading" : `${stats.total} threads`} · ask anything
              </p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Ask, answer, repeat.</h1>
              <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                A question is the fastest way to learn. Ask about a bug, a concept or a career move —
                someone here has probably hit the same wall.
              </p>
            </div>
            <Link href="/discuss/new" className="btn btn-ink">
              <Plus className="size-4" /> Ask a question
            </Link>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1fr_290px]">
          {/* ── main ─────────────────────────────────────────────────── */}
          <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") load();
                  }}
                  placeholder="Search questions…"
                  aria-label="Search questions"
                  className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 border-b border-transparent sm:justify-end">
                {TABS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTab(t.value)}
                    data-active={tab === t.value}
                    className="tab-underline whitespace-nowrap text-[13px]"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {questions === null ? (
              <div className="mt-6 grid gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[110px] animate-pulse rounded-2xl border border-border bg-muted/40" />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <Empty
                icon={HelpCircle}
                title={tab === "mine" ? (me ? "You have not asked yet" : "Sign in to see your threads") : "No threads here"}
                body={
                  tab === "mine"
                    ? "Your questions will collect here once you post one."
                    : "Be the first to ask — a good question is half the answer."
                }
                className="mt-6"
                action={
                  <Link href={tab === "mine" && !me ? "/login" : "/discuss/new"} className="btn btn-ink">
                    {tab === "mine" && !me ? "Sign in" : "Ask a question"}
                  </Link>
                }
              />
            ) : (
              <div className="mt-2 divide-y divide-border">
                {questions.map((q, i) => (
                  <article
                    key={q.id}
                    className="reveal group grid grid-cols-[54px_1fr] gap-4 py-5 sm:grid-cols-[64px_1fr] sm:gap-6"
                    style={{ animationDelay: `${Math.min(i * 30, 180)}ms` }}
                  >
                    <div className="flex flex-col items-center gap-2.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleVote(q)}
                        aria-label="Upvote question"
                        className={cn(
                          "flex w-full flex-col items-center gap-1 rounded-xl border py-2 transition-colors",
                          q.votedByMe
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                        )}
                      >
                        <ThumbsUp className={cn("size-4", q.votedByMe && "fill-current")} />
                        <span className="font-mono text-[12px] font-semibold tabular-nums">
                          {q._count.votes}
                        </span>
                      </button>
                      <span className="mono-label !text-[8.5px] text-center leading-tight">
                        {q._count.answers} {q._count.answers === 1 ? "answer" : "answers"}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <Link href={`/discuss/${q.id}`} className="group/title block">
                        <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.015em] transition-colors group-hover/title:text-primary sm:text-[19px]">
                          {q.title}
                        </h2>
                      </Link>

                      {tagList(q.tags).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {tagList(q.tags).map((tag) => (
                            <span key={tag} className="chip !px-2 !py-0.5 !text-[10px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-muted-foreground">
                        <Link href={`/u/${q.user.username}`} className="font-medium hover:text-primary">
                          {q.user.name ?? q.user.username}
                        </Link>
                        <span className="size-1 rounded-full bg-border" />
                        <span className="mono-label !text-[9px]">{shortDate(q.createdAt)}</span>
                        <Link
                          href={`/discuss/${q.id}`}
                          className="ml-auto hidden items-center gap-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
                        >
                          Open thread <ArrowUpRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ── rail ─────────────────────────────────────────────────── */}
          <aside className="grid gap-4 lg:sticky lg:top-24">
            <div className="card-surface p-5">
              <div className="flex items-center justify-between">
                <p className="mono-label">Hot today</p>
                <HelpCircle className="size-4 text-primary" />
              </div>
              <div className="mt-3 divide-y divide-border">
                {hot.length === 0 ? (
                  <p className="py-4 text-[12.5px] text-muted-foreground">Nothing trending yet.</p>
                ) : (
                  hot.map((q, i) => (
                    <Link
                      key={q.id}
                      href={`/discuss/${q.id}`}
                      className="group flex items-start gap-3 py-3"
                    >
                      <span className="mono-label w-5 shrink-0 pt-0.5 !text-[9px]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[12.5px] font-medium leading-snug transition-colors group-hover:text-primary">
                          {q.title}
                        </p>
                        <p className="mono-label mt-1 !text-[8.5px]">
                          {q._count.votes} {q._count.votes === 1 ? "vote" : "votes"} ·{" "}
                          {q._count.answers} {q._count.answers === 1 ? "answer" : "answers"}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border p-5">
              <p className="mono-label">How to ask</p>
              <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mono-label !text-[9px] text-primary">01</span>
                  Say what you tried and what happened.
                </li>
                <li className="flex gap-2">
                  <span className="mono-label !text-[9px] text-primary">02</span>
                  Paste the smallest failing snippet.
                </li>
                <li className="flex gap-2">
                  <span className="mono-label !text-[9px] text-primary">03</span>
                  Name your language and version.
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
              <p className="mono-label !text-[var(--paper)]/50">At a glance</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="kpi-num text-[30px]">{stats.answered}</p>
                  <p className="mono-label mt-1 !text-[9px] !text-[var(--paper)]/50">answered</p>
                </div>
                <div>
                  <p className="kpi-num text-[30px]">{stats.votes}</p>
                  <p className="mono-label mt-1 !text-[9px] !text-[var(--paper)]/50">votes cast</p>
                </div>
              </div>
              <Link
                href="/discuss/new"
                className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
              >
                Start a thread <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </aside>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">Discuss · be kind, be specific</p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/blog" className="link-underline hover:text-foreground">
              Read the blog
            </Link>
            <Link href="/explore" className="link-underline hover:text-foreground">
              Explore code
            </Link>
            <Link href="/learn" className="link-underline hover:text-foreground">
              Courses
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
