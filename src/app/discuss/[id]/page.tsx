"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { PostBody } from "@/components/post-body";
import { toast } from "@/components/ui/toaster";
import { useMe } from "@/lib/use-me";
import { Avatar, Empty, SectionHead, Tag } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  title: string;
  body: string;
  tags: string | null;
  createdAt: string;
  userId: string;
  user: { username: string; name: string | null };
  _count: { votes: number };
  votedByMe: boolean;
};

type Answer = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { username: string; name: string | null };
  _count: { votes: number };
  votedByMe: boolean;
};

function longDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function tagList(tags: string | null) {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { me } = useMe();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/questions/detail?id=${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setQuestion(d.question);
        setAnswers(d.answers ?? []);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const vote = useCallback(
    async (target: "question" | Answer) => {
      if (!me) {
        toast("Login to vote", { variant: "error", actionLabel: "Sign in", actionHref: "/login" });
        return;
      }
      const payload =
        target === "question" ? { questionId: id } : { answerId: (target as Answer).id };
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast("Login to vote", { variant: "error", actionLabel: "Sign in", actionHref: "/login" });
        }
        return;
      }
      const d = await res.json();
      if (target === "question") {
        setQuestion((q) => (q ? { ...q, votedByMe: d.voted, _count: { votes: d.count } } : q));
      } else {
        setAnswers((prev) =>
          prev
            .map((a) =>
              a.id === (target as Answer).id
                ? { ...a, votedByMe: d.voted, _count: { votes: d.count } }
                : a
            )
            .sort((x, y) => y._count.votes - x._count.votes)
        );
      }
    },
    [id, me]
  );

  const handleAnswer = async () => {
    const body = draft.trim();
    if (!me) {
      toast("Login to answer", { variant: "error", actionLabel: "Sign in", actionHref: "/login" });
      return;
    }
    if (!body) return;
    setPosting(true);
    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: id, body }),
      });
      const d = await res.json();
      if (res.status === 401) {
        toast("Login to answer", { variant: "error", actionLabel: "Sign in", actionHref: "/login" });
        return;
      }
      if (!res.ok) throw new Error();
      setAnswers((prev) => [...prev, d.answer]);
      setDraft("");
      toast("Answer posted", { variant: "success" });
    } catch {
      toast("Could not post answer", { variant: "error" });
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    const res = await fetch(`/api/answers?id=${answerId}`, { method: "DELETE" });
    if (res.ok) setAnswers((prev) => prev.filter((a) => a.id !== answerId));
  };

  const handleDeleteQuestion = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    const res = await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
    if (res.ok) router.push("/discuss");
    else setConfirmingDelete(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast("Thread link copied", { variant: "success" });
    } catch {
      toast("Copy failed", { variant: "error" });
    }
  };

  if (notFound) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · thread</p>
            <h1 className="display mt-4 text-[42px]">This thread is gone.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              It may have been deleted by its author, or the link is wrong.
            </p>
            <Button variant="outline" className="mt-6 gap-1.5" asChild>
              <Link href="/discuss">
                <ArrowLeft className="size-4" /> Back to Discuss
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <div className="page-wrap grid place-items-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isQuestionOwner = me?.id === question.userId;
  const tags = tagList(question.tags);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-5 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link
            href="/discuss"
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="grid size-7 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
              <ArrowLeft className="size-3.5" />
            </span>
            All threads
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>

        <div className="mt-7 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_270px]">
          {/* ── main ─────────────────────────────────────────────────── */}
          <div className="min-w-0">
            <article className="reveal">
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="accent">Question</Tag>
                {tags.map((tag) => (
                  <span key={tag} className="chip !text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="display mt-4 text-[clamp(28px,4.6vw,48px)] leading-[1.05] text-foreground">
                {question.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Avatar name={question.user.name ?? question.user.username} size={34} />
                <div>
                  <Link
                    href={`/u/${question.user.username}`}
                    className="text-[13px] font-semibold hover:text-primary"
                  >
                    {question.user.name ?? question.user.username}
                  </Link>
                  <p className="mono-label !text-[9px]">
                    @{question.user.username} · asked {longDate(question.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6">
                <VoteRail
                  count={question._count.votes}
                  active={question.votedByMe}
                  onVote={() => vote("question")}
                />
                <div className="min-w-0 border-t border-border pt-5 sm:border-t-0 sm:pt-1">
                  <PostBody body={question.body} />
                </div>
              </div>

              {isQuestionOwner && (
                <div className="mt-6 flex justify-end border-t border-border pt-4">
                  <Button
                    variant={confirmingDelete ? "destructive" : "ghost"}
                    size="sm"
                    onClick={handleDeleteQuestion}
                    className={confirmingDelete ? "gap-1.5" : "gap-1.5 text-destructive hover:text-destructive"}
                  >
                    <Trash2 className="size-3.5" />
                    {confirmingDelete ? "Click again to delete" : "Delete question"}
                  </Button>
                </div>
              )}
            </article>

            <section className="mt-10">
              <SectionHead
                index="01"
                title="Answers"
                count={answers.length}
                action={<span className="mono-label !text-[10px]">highest voted first</span>}
              />

              {answers.length === 0 ? (
                <Empty
                  icon={MessageSquare}
                  title="No answers yet"
                  body="If you have solved this before, a short, concrete answer is worth more than a long one."
                  className="mt-5"
                />
              ) : (
                <div className="mt-2 divide-y divide-border">
                  {answers.map((a, i) => (
                    <article
                      key={a.id}
                      className="reveal grid gap-4 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6"
                      style={{ animationDelay: `${Math.min(i * 35, 210)}ms` }}
                    >
                      <VoteRail
                        count={a._count.votes}
                        active={a.votedByMe}
                        onVote={() => vote(a)}
                        small
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Avatar name={a.user.name ?? a.user.username} size={26} />
                          <Link
                            href={`/u/${a.user.username}`}
                            className="text-[12.5px] font-semibold hover:text-primary"
                          >
                            {a.user.name ?? a.user.username}
                          </Link>
                          <span className="size-1 rounded-full bg-border" />
                          <span className="mono-label !text-[9px]">{longDate(a.createdAt)}</span>
                          {me?.id === a.userId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAnswer(a.id)}
                              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <Trash2 className="size-3" /> Delete
                            </button>
                          )}
                        </div>
                        <div className="mt-3">
                          <PostBody body={a.body} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* composer */}
            {me ? (
              <section className="card-surface mt-8 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="mono-label">Your answer</p>
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="size-3" /> takes a minute
                  </span>
                </div>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Share what you know. Wrap code in triple backticks (```js … ```)."
                  className="mt-3 min-h-[140px]"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11.5px] text-muted-foreground">
                    Specific beats clever. Show the fix, then explain why it works.
                  </p>
                  <Button onClick={handleAnswer} disabled={posting || !draft.trim()} className="gap-1.5">
                    {posting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Post answer
                  </Button>
                </div>
              </section>
            ) : (
              <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-border p-6">
                <div>
                  <p className="text-sm font-semibold">Have an answer?</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Sign in to reply to this thread.
                  </p>
                </div>
                <Link href="/login" className="btn btn-ink h-9 px-4 text-[12.5px]">
                  Sign in to answer
                </Link>
              </section>
            )}
          </div>

          {/* ── rail ─────────────────────────────────────────────────── */}
          <aside className="grid gap-4 lg:sticky lg:top-24">
            <div className="card-surface p-5">
              <p className="mono-label">Asked by</p>
              <Link
                href={`/u/${question.user.username}`}
                className="group mt-3 flex items-center gap-2.5"
              >
                <Avatar name={question.user.name ?? question.user.username} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold transition-colors group-hover:text-primary">
                    {question.user.name ?? question.user.username}
                  </p>
                  <p className="mono-label !text-[9px]">@{question.user.username}</p>
                </div>
                <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                  <p className="kpi-num text-[24px]">{answers.length}</p>
                  <p className="mono-label mt-1 !text-[8.5px]">
                    {answers.length === 1 ? "answer" : "answers"}
                  </p>
                </div>
                <div>
                  <p className="kpi-num text-[24px]">{question._count.votes}</p>
                  <p className="mono-label mt-1 !text-[8.5px]">
                    {question._count.votes === 1 ? "vote" : "votes"}
                  </p>
                </div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="rounded-2xl border border-dashed border-border p-5">
                <p className="mono-label">Filed under</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
              <p className="mono-label !text-[var(--paper)]/50">Answer well</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--paper)]/70">
                Quote the exact error, show the smallest fix, and say why it works. That is a
                complete answer.
              </p>
              <Link
                href="/discuss/new"
                className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
              >
                Ask your own <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function VoteRail({
  count,
  active,
  onVote,
  small = false,
}: {
  count: number;
  active: boolean;
  onVote: () => void;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
      <button
        type="button"
        onClick={onVote}
        aria-label="Upvote"
        className={cn(
          "grid place-items-center rounded-full border transition-colors",
          small ? "size-8" : "size-10",
          active
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
        )}
      >
        <ThumbsUp className={cn(small ? "size-3.5" : "size-4", active && "fill-current")} />
      </button>
      <span className="font-mono text-[12px] font-semibold tabular-nums">{count}</span>
    </div>
  );
}
