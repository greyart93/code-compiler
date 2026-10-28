"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Heart,
  Loader2,
  MessageSquare,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { LANGUAGES, languageLabel } from "@/lib/language";
import { toast } from "@/components/ui/toaster";

type Me = { id: string; username: string } | null;

type ExploreSnippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: string;
  user: { username: string; name: string | null };
  _count: { likes: number; comments: number };
  likedByMe: boolean;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { username: string; name: string | null };
};

const PREVIEW_LINES = 12;

export default function ExplorePage() {
  const [snippets, setSnippets] = useState<ExploreSnippet[] | null>(null);
  const [me, setMe] = useState<Me>(null);
  const [lang, setLang] = useState("all");
  const [sort, setSort] = useState("new");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null));
  }, []);

  const load = useCallback(() => {
    setSnippets(null);
    const params = new URLSearchParams({ explore: "1", sort });
    if (lang !== "all") params.set("lang", lang);
    fetch(`/api/snippets?${params}`)
      .then((r) => r.json())
      .then((d) => setSnippets(d.snippets ?? []))
      .catch(() => setSnippets([]));
  }, [lang, sort]);

  useEffect(load, [load]);

  const handleLike = async (s: ExploreSnippet) => {
    if (!me) {
      toast("Login to like", {
        description: "Sign in to like this snippet.",
        variant: "error",
        actionLabel: "Sign in",
        actionHref: "/login",
      });
      return;
    }
    setSnippets(
      (prev) =>
        prev?.map((x) =>
          x.id === s.id
            ? {
                ...x,
                likedByMe: !x.likedByMe,
                _count: {
                  ...x._count,
                  likes: x._count.likes + (x.likedByMe ? -1 : 1),
                },
              }
            : x
        ) ?? null
    );
    try {
      const res = await fetch("/api/snippets/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snippetId: s.id }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSnippets(
        (prev) =>
          prev?.map((x) =>
            x.id === s.id ? { ...x, likedByMe: d.liked, _count: { ...x._count, likes: d.count } } : x
          ) ?? null
      );
    } catch {
      load();
    }
  };

  const handleCopy = async (s: ExploreSnippet) => {
    try {
      await navigator.clipboard.writeText(s.code);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast("Copy failed", { variant: "error" });
    }
  };

  const handleFork = async (s: ExploreSnippet) => {
    if (!me) {
      toast("Login to save", {
        description: "Sign in to save this snippet to your dashboard.",
        variant: "error",
        actionLabel: "Sign in",
        actionHref: "/login",
      });
      return;
    }
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: s.title,
          language: s.language,
          code: s.code,
          isPublic: false,
        }),
      });
      if (!res.ok) throw new Error();
      toast("Saved to your dashboard", {
        description: "A private copy was created — open it from Dashboard.",
        variant: "success",
        actionLabel: "Dashboard",
        actionHref: "/dashboard",
      });
    } catch {
      toast("Could not save snippet", { variant: "error" });
    }
  };

  const toggleComments = async (snippetId: string) => {
    const next = !openComments[snippetId];
    setOpenComments((o) => ({ ...o, [snippetId]: next }));
    if (next && !comments[snippetId]) {
      const res = await fetch(`/api/snippets/comments?snippetId=${snippetId}`);
      const d = await res.json();
      setComments((c) => ({ ...c, [snippetId]: d.comments ?? [] }));
    }
  };

  const handleComment = async (snippetId: string) => {
    const body = (commentDraft[snippetId] ?? "").trim();
    if (!me) {
      toast("Login to comment", {
        description: "Sign in to join the discussion.",
        variant: "error",
        actionLabel: "Sign in",
        actionHref: "/login",
      });
      return;
    }
    if (!body) return;
    setPosting(snippetId);
    try {
      const res = await fetch("/api/snippets/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snippetId, body }),
      });
      const d = await res.json();
      if (res.status === 401) {
        toast("Login to comment", { variant: "error", actionLabel: "Sign in", actionHref: "/login" });
        return;
      }
      if (!res.ok) throw new Error();
      setComments((c) => ({ ...c, [snippetId]: [...(c[snippetId] ?? []), d.comment] }));
      setCommentDraft((cd) => ({ ...cd, [snippetId]: "" }));
      setSnippets(
        (prev) =>
          prev?.map((x) =>
            x.id === snippetId
              ? { ...x, _count: { ...x._count, comments: x._count.comments + 1 } }
              : x
          ) ?? null
      );
    } catch {
      toast("Could not post comment", { variant: "error" });
    } finally {
      setPosting(null);
    }
  };

  const handleDeleteComment = async (snippetId: string, commentId: string) => {
    const res = await fetch(`/api/snippets/comments?id=${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((c) => ({
        ...c,
        [snippetId]: (c[snippetId] ?? []).filter((x) => x.id !== commentId),
      }));
      setSnippets(
        (prev) =>
          prev?.map((x) =>
            x.id === snippetId
              ? { ...x, _count: { ...x._count, comments: Math.max(0, x._count.comments - 1) } }
              : x
          ) ?? null
      );
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="size-6 text-primary" /> Explore
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover public snippets — like, comment, copy or save them to your dashboard
          </p>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Newest first</SelectItem>
              <SelectItem value="top">Most liked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {snippets === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : snippets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No public snippets here yet — save one from the Playground to get things going!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {snippets.map((s, i) => {
              const lines = s.code.split("\n");
              const isLong = lines.length > PREVIEW_LINES;
              const showAll = expanded[s.id];
              const visible = showAll ? s.code : lines.slice(0, PREVIEW_LINES).join("\n");
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Card header */}
                      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                          {languageLabel(s.language)}
                        </span>
                        <Link
                          href={`/playground?snippet=${s.id}`}
                          className="font-medium hover:text-primary hover:underline"
                          title="Open in Playground"
                        >
                          {s.title}
                        </Link>
                        <span className="ml-auto text-xs text-muted-foreground">
                          by{" "}
                          <Link
                            href={`/u/${s.user.username}`}
                            className="font-medium hover:underline"
                          >
                            {s.user.name ?? s.user.username}
                          </Link>{" "}
                          · {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Code preview */}
                      <div className="relative bg-muted/40">
                        <pre className="overflow-x-auto p-4 pb-2 font-mono text-[13px] leading-relaxed">
                          {visible}
                        </pre>
                        {isLong && (
                          <button
                            onClick={() => setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))}
                            className="flex w-full items-center justify-center gap-1 border-t bg-background/50 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {showAll ? (
                              <>
                                <ChevronUp className="size-3.5" /> Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-3.5" /> Show {lines.length - PREVIEW_LINES}{" "}
                                more lines
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center gap-1 border-t px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(s)}
                          className={`gap-1.5 ${
                            s.likedByMe ? "text-red-500 hover:text-red-500" : "text-muted-foreground"
                          }`}
                        >
                          <Heart className={`size-4 ${s.likedByMe ? "fill-current" : ""}`} />
                          {s._count.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(s.id)}
                          className="gap-1.5 text-muted-foreground"
                        >
                          <MessageSquare className="size-4" />
                          {s._count.comments}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(s)}
                          className="ml-auto gap-1.5 text-muted-foreground"
                        >
                          {copiedId === s.id ? (
                            <Check className="size-4 text-green-500" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                          {copiedId === s.id ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFork(s)}
                          className="gap-1.5 text-muted-foreground"
                        >
                          <Save className="size-4" /> Save
                        </Button>
                      </div>

                      {/* Comments */}
                      {openComments[s.id] && (
                        <div className="border-t px-4 py-3">
                          <div className="mb-3 grid gap-2">
                            {(comments[s.id] ?? []).length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No comments yet — start the conversation!
                              </p>
                            ) : (
                              (comments[s.id] ?? []).map((c) => (
                                <div key={c.id} className="flex items-start gap-2 text-sm">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium">{c.user.name ?? c.user.username}</span>{" "}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(c.createdAt).toLocaleDateString()}
                                    </span>
                                    <p className="break-words text-muted-foreground">{c.body}</p>
                                  </div>
                                  {me?.id === c.userId && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-6 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeleteComment(s.id, c.id)}
                                      aria-label="Delete comment"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              value={commentDraft[s.id] ?? ""}
                              onChange={(e) =>
                                setCommentDraft((cd) => ({ ...cd, [s.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleComment(s.id);
                              }}
                              placeholder={me ? "Write a comment…" : "Login to comment"}
                              className="h-9"
                            />
                            <Button
                              size="icon"
                              className="size-9 shrink-0"
                              onClick={() => handleComment(s.id)}
                              disabled={posting === s.id}
                              aria-label="Post comment"
                            >
                              {posting === s.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Send className="size-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
