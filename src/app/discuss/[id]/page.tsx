"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, MessageSquare, Send, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { PostBody } from "@/components/post-body";
import { toast } from "@/components/ui/toaster";

type Me = { id: string; username: string } | null;

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

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [me, setMe] = useState<Me>(null);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user));
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
        setQuestion((q) =>
          q ? { ...q, votedByMe: d.voted, _count: { votes: d.count } } : q
        );
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

  if (notFound) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Question not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/discuss">
              <ArrowLeft className="size-4" /> Back to Discuss
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/discuss">
            <ArrowLeft className="size-4" /> All questions
          </Link>
        </Button>

        {/* Question */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                {/* Vote column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => vote("question")}
                    className={question.votedByMe ? "text-primary" : "text-muted-foreground"}
                    aria-label="Upvote question"
                  >
                    <ThumbsUp className={`size-5 ${question.votedByMe ? "fill-current" : ""}`} />
                  </Button>
                  <span className="text-sm font-semibold">{question._count.votes}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    votes
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold leading-snug">{question.title}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">
                    asked {new Date(question.createdAt).toLocaleDateString()} by{" "}
                    <Link href={`/u/${question.user.username}`} className="hover:underline">
                      {question.user.name ?? question.user.username}
                    </Link>
                  </p>
                  {question.tags && (
                    <span className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {question.tags}
                    </span>
                  )}
                  <div className="mt-4">
                    <PostBody body={question.body} />
                  </div>
                  {me?.id === question.userId && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant={confirmingDelete ? "destructive" : "ghost"}
                        size="sm"
                        onClick={handleDeleteQuestion}
                        className={confirmingDelete ? "" : "text-destructive hover:text-destructive"}
                      >
                        <Trash2 className="size-4" />
                        {confirmingDelete ? "Click again to delete" : "Delete"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Answers */}
        <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="size-5 text-primary" /> {answers.length}{" "}
          {answers.length === 1 ? "Answer" : "Answers"}
        </h2>
        <div className="grid gap-3">
          {answers.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => vote(a)}
                      className={a.votedByMe ? "text-primary" : "text-muted-foreground"}
                      aria-label="Upvote answer"
                    >
                      <ThumbsUp className={`size-4 ${a.votedByMe ? "fill-current" : ""}`} />
                    </Button>
                    <span className="text-sm font-semibold">{a._count.votes}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      answered {new Date(a.createdAt).toLocaleDateString()} by{" "}
                      <Link href={`/u/${a.user.username}`} className="hover:underline">
                        {a.user.name ?? a.user.username}
                      </Link>
                    </p>
                    <div className="mt-2">
                      <PostBody body={a.body} />
                    </div>
                    {me?.id === a.userId && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAnswer(a.id)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Post answer */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <p className="mb-2 text-sm font-medium">Your answer</p>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={me ? "Share your knowledge… (wrap code in ``` … ```)" : "Login to answer"}
              className="min-h-[120px]"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={handleAnswer} disabled={posting || !draft.trim()}>
                {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Post answer
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
