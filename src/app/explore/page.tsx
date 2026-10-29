"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Code2,
  Copy,
  Heart,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { useMe } from "@/lib/use-me";
import { languageLabel } from "@/lib/language";
import hljs from "highlight.js/lib/common";
import { toast } from "@/components/ui/toaster";
import { Avatar, Empty, Tag } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

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

/** Escape plain code when a language has no highlighter */
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Syntax-highlight a code slice with highlight.js */
function highlight(code: string, language: string) {
  try {
    if (language && language !== "plaintext" && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    }
  } catch {
    // fall through to plain
  }
  return escapeHtml(code);
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

const LANGUAGES = [
  ["python", "Python"],
  ["javascript", "JavaScript"],
  ["typescript", "TypeScript"],
  ["react", "React"],
  ["java", "Java"],
  ["cpp", "C++"],
  ["go", "Go"],
  ["rust", "Rust"],
  ["csharp", "C#"],
  ["sql", "SQL"],
];

export default function ExplorePage() {
  const { me } = useMe();
  const [snippets, setSnippets] = useState<ExploreSnippet[] | null>(null);
  const [lang, setLang] = useState("all");
  const [sort, setSort] = useState<"new" | "top">("new");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);

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

  const requireLogin = (action: string) => {
    if (me) return false;
    toast(`Login to ${action}`, {
      description: `Sign in to ${action} this snippet.`,
      variant: "error",
      actionLabel: "Sign in",
      actionHref: "/login",
    });
    return true;
  };

  const handleLike = async (s: ExploreSnippet) => {
    if (requireLogin("like")) return;
    setSnippets(
      (prev) =>
        prev?.map((x) =>
          x.id === s.id
            ? {
                ...x,
                likedByMe: !x.likedByMe,
                _count: { ...x._count, likes: x._count.likes + (x.likedByMe ? -1 : 1) },
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
      toast("Copied to clipboard", { variant: "success" });
    } catch {
      toast("Copy failed", { variant: "error" });
    }
  };

  const handleFork = async (s: ExploreSnippet) => {
    if (requireLogin("save")) return;
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
        description: "A private copy was created — open it from your dashboard.",
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
    if (requireLogin("comment")) return;
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
            x.id === snippetId ? { ...x, _count: { ...x._count, comments: x._count.comments + 1 } } : x
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

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      snippets === null
        ? null
        : snippets.filter(
            (s) =>
              !q ||
              s.title.toLowerCase().includes(q) ||
              s.language.toLowerCase().includes(q) ||
              s.user.username.toLowerCase().includes(q) ||
              (s.user.name ?? "").toLowerCase().includes(q)
          ),
    [snippets, q]
  );

  const featured =
    !q && lang === "all" && sort === "new" && filtered && filtered.length > 2 ? filtered[0] : null;
  const gridItems = featured ? filtered!.slice(1) : filtered;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        {/* ── page head ─────────────────────────────────────────────── */}
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Community · {snippets === null ? "loading" : `${snippets.length} public snippets`}
              </p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">The commons.</h1>
              <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Code people are proud enough to share. Read it, run it, fork it into your own
                workspace — or leave a note for the author.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/playground" className="btn btn-ink">
                <Code2 className="size-4" /> Open playground
              </Link>
              <Link href="/dashboard" className="btn btn-outline">
                Your snippets
              </Link>
            </div>
          </div>
        </header>

        {/* ── toolbar ───────────────────────────────────────────────── */}
        <div className="reveal reveal-1 mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, languages or people…"
              aria-label="Search snippets"
              className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Language filter"
              className="h-10 rounded-full border border-border bg-card px-4 text-[13px] font-medium outline-none focus:border-foreground/30"
            >
              <option value="all">All languages</option>
              {LANGUAGES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-full border border-border bg-card p-1">
              {(
                [
                  ["new", "Newest"],
                  ["top", "Most liked"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSort(value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    sort === value
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered === null ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-2xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            icon={Search}
            title={q || lang !== "all" ? "Nothing matches that" : "The commons is quiet"}
            body={
              q || lang !== "all"
                ? "Try a different search, or clear the language filter."
                : "Be the first to share something — save a snippet from the playground with visibility set to public."
            }
            className="mt-10"
            action={
              <Link href="/playground" className="btn btn-ink">
                Write a snippet
              </Link>
            }
          />
        ) : (
          <>
            {/* ── featured ─────────────────────────────────────────── */}
            {featured && (
              <article className="card-surface reveal reveal-2 mt-7 overflow-hidden">
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="flex flex-col p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <span className="chip chip-active">
                        <Sparkles className="size-3" /> Featured
                      </span>
                      <span className="mono-label !text-[10px]">{languageLabel(featured.language)}</span>
                    </div>

                    <Link href={`/playground?snippet=${featured.id}`} className="group mt-5 block">
                      <h2 className="display text-[clamp(30px,4vw,44px)] leading-[1.02] transition-colors group-hover:text-primary">
                        {featured.title}
                      </h2>
                    </Link>

                    <div className="mt-4 flex items-center gap-2.5">
                      <Avatar
                        name={featured.user.name ?? featured.user.username}
                        size={30}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/u/${featured.user.username}`}
                          className="block truncate text-[13px] font-medium hover:text-primary"
                        >
                          {featured.user.name ?? featured.user.username}
                        </Link>
                        <p className="mono-label !text-[9px]">
                          @{featured.user.username} · {shortDate(featured.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-8">
                      <button
                        type="button"
                        onClick={() => handleLike(featured)}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-medium transition-colors",
                          featured.likedByMe
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Heart className={cn("size-3.5", featured.likedByMe && "fill-current")} />
                        {featured._count.likes}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleComments(featured.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <MessageSquare className="size-3.5" /> {featured._count.comments}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFork(featured)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Bookmark className="size-3.5" /> Save
                      </button>
                      <Link
                        href={`/playground?snippet=${featured.id}`}
                        className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 text-[12.5px] font-medium text-[var(--paper)] transition-transform hover:-translate-y-0.5"
                      >
                        Open <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="code-pane relative max-h-[420px] overflow-hidden !rounded-none border-0 border-t border-[var(--code-line)] lg:border-l lg:border-t-0">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-7 right-3 select-none font-mono text-[92px] font-bold leading-none tracking-tighter text-white/[0.045]"
                    >
                      {featured.language.toUpperCase()}
                    </span>
                    <pre className="relative !p-5 text-[12px] leading-[1.7]">
                      <code
                        className="hljs !bg-transparent"
                        dangerouslySetInnerHTML={{ __html: highlight(featured.code, featured.language) }}
                      />
                    </pre>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--code-bg)] to-transparent" />
                    <button
                      type="button"
                      onClick={() => handleCopy(featured)}
                      className="absolute bottom-4 right-4 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-[11px] font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
                    >
                      {copiedId === featured.id ? <Check className="size-3" /> : <Copy className="size-3" />}
                      {copiedId === featured.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {openComments[featured.id] && (
                  <CommentsPanel
                    snippetId={featured.id}
                    comments={comments[featured.id] ?? []}
                    draft={commentDraft[featured.id] ?? ""}
                    onDraft={(v) => setCommentDraft((cd) => ({ ...cd, [featured.id]: v }))}
                    onPost={() => handleComment(featured.id)}
                    onDelete={(id) => handleDeleteComment(featured.id, id)}
                    posting={posting === featured.id}
                    meId={me?.id ?? null}
                    signedIn={!!me}
                  />
                )}
              </article>
            )}

            {/* ── grid ─────────────────────────────────────────────── */}
            <div className="mt-5 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gridItems!.map((s, i) => {
                const displayName = s.user.name ?? s.user.username;
                return (
                  <article
                    key={s.id}
                    className="card-surface card-hover reveal flex flex-col overflow-hidden"
                    style={{ animationDelay: `${Math.min(i * 35, 240)}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={displayName} size={30} />
                        <div className="min-w-0">
                          <Link
                            href={`/u/${s.user.username}`}
                            className="block truncate text-[12.5px] font-medium hover:text-primary"
                          >
                            {displayName}
                          </Link>
                          <p className="mono-label !text-[8.5px]">{shortDate(s.createdAt)}</p>
                        </div>
                      </div>
                      <Tag tone="accent">{languageLabel(s.language)}</Tag>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <Link href={`/playground?snippet=${s.id}`} className="group block">
                        <h3 className="line-clamp-2 min-h-[44px] text-[16px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-primary">
                          {s.title}
                        </h3>
                      </Link>

                      <div className="code-pane relative mt-3 h-[150px] overflow-hidden">
                        <pre className="!p-3.5 text-[11px] leading-[1.65]">
                          <code
                            className="hljs !bg-transparent"
                            dangerouslySetInnerHTML={{ __html: highlight(s.code, s.language) }}
                          />
                        </pre>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--code-bg)] to-transparent" />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleLike(s)}
                            aria-label="Like"
                            className={cn(
                              "inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium transition-colors",
                              s.likedByMe
                                ? "text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Heart className={cn("size-3.5", s.likedByMe && "fill-current")} />
                            {s._count.likes}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleComments(s.id)}
                            aria-label="Comments"
                            className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <MessageSquare className="size-3.5" />
                            {s._count.comments}
                          </button>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(s)}
                            aria-label="Copy code"
                            className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {copiedId === s.id ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            <span className="hidden sm:inline">{copiedId === s.id ? "Copied" : "Copy"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFork(s)}
                            aria-label="Save a copy"
                            className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Bookmark className="size-3.5" />
                            <span className="hidden sm:inline">Save</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {openComments[s.id] && (
                      <CommentsPanel
                        snippetId={s.id}
                        comments={comments[s.id] ?? []}
                        draft={commentDraft[s.id] ?? ""}
                        onDraft={(v) => setCommentDraft((cd) => ({ ...cd, [s.id]: v }))}
                        onPost={() => handleComment(s.id)}
                        onDelete={(id) => handleDeleteComment(s.id, id)}
                        posting={posting === s.id}
                        meId={me?.id ?? null}
                        signedIn={!!me}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">The commons · updated as people publish</p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/blog" className="link-underline hover:text-foreground">
              Read the blog
            </Link>
            <Link href="/discuss" className="link-underline hover:text-foreground">
              Ask a question
            </Link>
            <Link href="/learn" className="link-underline hover:text-foreground">
              Learn to code
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function CommentsPanel({
  snippetId,
  comments,
  draft,
  onDraft,
  onPost,
  onDelete,
  posting,
  meId,
  signedIn,
}: {
  snippetId: string;
  comments: Comment[];
  draft: string;
  onDraft: (value: string) => void;
  onPost: () => void;
  onDelete: (id: string) => void;
  posting: boolean;
  meId: string | null;
  signedIn: boolean;
}) {
  return (
    <div className="border-t border-border bg-muted/30 px-4 py-4" data-snippet={snippetId}>
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">No comments yet — start the conversation.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex items-start gap-2.5">
              <Avatar name={c.user.name ?? c.user.username} size={24} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/u/${c.user.username}`}
                    className="text-[12px] font-semibold hover:text-primary"
                  >
                    {c.user.name ?? c.user.username}
                  </Link>
                  <span className="mono-label !text-[8.5px]">{shortDate(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-line text-[12.5px] leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </div>
              {meId === c.userId && (
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  aria-label="Delete comment"
                  className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onPost();
            }
          }}
          placeholder={signedIn ? "Write a comment…" : "Sign in to comment"}
          aria-label="Comment"
          className="h-9 min-w-0 flex-1 rounded-full border border-border bg-card px-3.5 text-[12.5px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
        />
        <Button
          size="icon"
          onClick={onPost}
          disabled={posting}
          aria-label="Post comment"
          className="size-9 shrink-0"
        >
          {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
