"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  HelpCircle,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { toast } from "@/components/ui/toaster";

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
  { value: "recent", label: "Most Recent" },
  { value: "unanswered", label: "Unanswered" },
  { value: "mine", label: "My Questions" },
];

export default function DiscussPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [hot, setHot] = useState<Question[]>([]);
  const [tab, setTab] = useState("trending");
  const [search, setSearch] = useState("");
  const [me, setMe] = useState<{ username: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user));
  }, []);

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

  // Hot today: top voted overall (sidebar)
  useEffect(() => {
    fetch("/api/questions?tab=trending")
      .then((r) => r.json())
      .then((d) => setHot((d.questions ?? []).slice(0, 5)));
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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_300px]">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Q&amp;A Discussions</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Ask questions, answer others, upvote the best replies
          </p>

          {/* Search + ask */}
          <div className="mb-5 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search questions…"
            />
            <Button variant="outline" onClick={load}>
              <Search className="size-4" /> Search
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
            <Button size="sm" className="ml-auto" asChild>
              <Link href="/discuss/new">
                <Plus className="size-4" /> Ask a question
              </Link>
            </Button>
          </div>

          {/* List */}
          {questions === null ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {tab === "mine"
                  ? me
                    ? "You haven't asked anything yet."
                    : "Sign in to see your questions."
                  : "No questions found — be the first to ask!"}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/discuss/${q.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {q.title}
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {q.tags && (
                        <span className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {q.tags}
                        </span>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <button
                          onClick={() => handleVote(q)}
                          className={`flex items-center gap-1 transition-colors hover:text-foreground ${
                            q.votedByMe ? "text-primary" : ""
                          }`}
                        >
                          <ThumbsUp className="size-3.5" /> {q._count.votes} Votes
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3.5" /> {q._count.answers} Answers
                        </span>
                        <span>
                          by{" "}
                          <Link href={`/u/${q.user.username}`} className="hover:underline">
                            {q.user.name ?? q.user.username}
                          </Link>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Hot today sidebar */}
        <aside className="top-20 h-fit lg:sticky">
          <Card>
            <CardContent className="py-4">
              <h2 className="mb-3 flex items-center gap-1.5 font-semibold">
                <HelpCircle className="size-4 text-primary" /> Hot today
              </h2>
              <div className="grid gap-3">
                {hot.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing trending yet.</p>
                ) : (
                  hot.map((q) => (
                    <Link
                      key={q.id}
                      href={`/discuss/${q.id}`}
                      className="group block text-sm"
                    >
                      <span className="line-clamp-2 font-medium group-hover:text-primary">
                        {q.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="size-3" /> {q._count.votes} Votes
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
