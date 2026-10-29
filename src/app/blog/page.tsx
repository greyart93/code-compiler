"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Loader2, Pencil, Plus, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Avatar, Empty, SectionHead, Tag } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Tutorial = {
  id: string;
  title: string;
  language: string | null;
  createdAt: string;
  user: { username: string; name: string | null };
};

type Preview = { excerpt: string; minutes: number };

function stripHtml(html: string) {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/g, " ")
    .replace(/<[^>]+>/g, " ")
    // tolerate markdown seeds / imported posts as well as the editor's HTML
    .replace(/```[a-z0-9+#-]*/gi, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makePreview(html: string): Preview {
  const text = stripHtml(html);
  const words = text ? text.split(/\s+/).length : 0;
  return {
    excerpt: text.length > 220 ? text.slice(0, 220).trimEnd() + "…" : text,
    minutes: Math.max(1, Math.round(words / 200)),
  };
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BlogIndex() {
  const [tutorials, setTutorials] = useState<Tutorial[] | null>(null);
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const [language, setLanguage] = useState("all");

  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => r.json())
      .then((d) => setTutorials(d.tutorials ?? []))
      .catch(() => setTutorials([]));
  }, []);

  // Fetch the first few full posts so the index can show real excerpts and read time.
  useEffect(() => {
    if (!tutorials || tutorials.length === 0) return;
    let alive = true;
    const top = tutorials.slice(0, 6);
    Promise.all(
      top.map((t) =>
        fetch(`/api/tutorials?id=${t.id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((rows) => {
      if (!alive) return;
      const map: Record<string, Preview> = {};
      rows.forEach((row, i) => {
        if (row?.tutorial?.content) map[top[i].id] = makePreview(row.tutorial.content);
      });
      setPreviews(map);
    });
    return () => {
      alive = false;
    };
  }, [tutorials]);

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tutorials ?? []) {
      const key = t.language ?? "general";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [tutorials]);

  const filtered = useMemo(
    () =>
      tutorials === null
        ? null
        : language === "all"
          ? tutorials
          : tutorials.filter((t) => (t.language ?? "general") === language),
    [tutorials, language]
  );

  const featured = filtered && filtered.length > 0 && language === "all" ? filtered[0] : null;
  const rest = featured ? filtered!.slice(1) : filtered;
  const featuredPreview = featured ? previews[featured.id] : undefined;

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Blog · {tutorials === null ? "loading" : `${tutorials.length} essays`} · free to read
              </p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Notes from the workshop.</h1>
              <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Tutorials, deep dives and hard-won lessons from people who build. No paywall, no
                sign-up wall — just the writing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/blog/new" className="btn btn-ink">
                <Plus className="size-4" /> Write a tutorial
              </Link>
              <Link href="/explore" className="btn btn-outline">
                Browse code
              </Link>
            </div>
          </div>
        </header>

        {tutorials === null ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[340px] animate-pulse rounded-3xl border border-border bg-muted/40" />
            <div className="h-[340px] animate-pulse rounded-3xl border border-border bg-muted/40" />
          </div>
        ) : tutorials.length === 0 ? (
          <Empty
            icon={FileText}
            title="The first page is blank"
            body="Publishing is free and takes a minute. Write the tutorial you wish existed when you started."
            className="mt-10"
            action={
              <Link href="/blog/new" className="btn btn-ink">
                <Pencil className="size-4" /> Write the first essay
              </Link>
            }
          />
        ) : (
          <>
            {/* ── featured essay ───────────────────────────────────── */}
            {featured && (
              <article className="reveal reveal-2 mt-7 overflow-hidden rounded-3xl border border-border bg-card">
                <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip chip-active">
                        <Sparkles className="size-3" /> Featured essay
                      </span>
                      <span className="mono-label !text-[10px]">
                        {dateLabel(featured.createdAt)}
                        {featuredPreview ? ` · ${featuredPreview.minutes} min read` : ""}
                      </span>
                    </div>

                    <Link href={`/blog/${featured.id}`} className="group mt-6 block">
                      <h2 className="display max-w-[18ch] text-[clamp(32px,5.2vw,58px)] leading-[1.0] transition-colors group-hover:text-primary">
                        {featured.title}
                      </h2>
                    </Link>

                    {featuredPreview?.excerpt && (
                      <p className="mt-5 line-clamp-3 max-w-[60ch] text-[14.5px] leading-relaxed text-muted-foreground">
                        {featuredPreview.excerpt}
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
                      <Link
                        href={`/u/${featured.user.username}`}
                        className="group/author flex items-center gap-2.5"
                      >
                        <Avatar name={featured.user.name ?? featured.user.username} size={36} />
                        <div>
                          <p className="text-[13px] font-semibold group-hover/author:text-primary">
                            {featured.user.name ?? featured.user.username}
                          </p>
                          <p className="mono-label !text-[9px]">@{featured.user.username}</p>
                        </div>
                      </Link>

                      <Link
                        href={`/blog/${featured.id}`}
                        className="group/read inline-flex items-center gap-2 text-[13.5px] font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        Read the essay
                        <span className="grid size-8 place-items-center rounded-full border border-border transition-colors group-hover/read:border-primary/40 group-hover/read:bg-primary/5">
                          <ArrowUpRight className="size-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>

                  <aside className="relative flex flex-col justify-between overflow-hidden bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
                    <div className="flex items-start justify-between">
                      <p className="mono-label !text-[var(--paper)]/50">Issue 01</p>
                      <Tag tone="accent" className="border-white/15 bg-white/10 text-[var(--paper)]">
                        {featured.language ?? "general"}
                      </Tag>
                    </div>

                    <div className="pointer-events-none my-8 select-none">
                      <p className="font-mono text-[120px] font-bold leading-[0.75] tracking-tighter text-[var(--paper)]/[0.08]">
                        01
                      </p>
                      <p className="mt-4 max-w-[24ch] text-[13px] leading-relaxed text-[var(--paper)]/60">
                        A workshop note on {featured.language ?? "software"}, filed{" "}
                        {dateLabel(featured.createdAt)}.
                      </p>
                    </div>

                    <div className="border-t border-white/15 pt-4">
                      <p className="mono-label !text-[var(--paper)]/45">In this issue</p>
                      <p className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug">
                        {featured.title}
                      </p>
                    </div>
                  </aside>
                </div>
              </article>
            )}

            <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_280px]">
              {/* ── archive ────────────────────────────────────────── */}
              <section>
                <SectionHead
                  title={language === "all" ? "The archive" : `Filed under ${language}`}
                  count={filtered?.length ?? 0}
                  action={
                    language !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setLanguage("all")}
                        className="mono-label !text-[10px] transition-colors hover:text-foreground"
                      >
                        clear filter
                      </button>
                    ) : undefined
                  }
                />

                {rest && rest.length === 0 ? (
                  <p className="py-10 text-sm text-muted-foreground">
                    {featured ? "That is the only essay in this issue." : "No essays in this topic yet."}
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {rest!.map((t, i) => {
                      const p = previews[t.id];
                      return (
                        <Link
                          key={t.id}
                          href={`/blog/${t.id}`}
                          className="group grid grid-cols-[34px_1fr_auto] items-start gap-3 py-5 transition-colors sm:gap-5"
                        >
                          <span className="mono-label pt-1.5 !text-[10px]">
                            {String(i + (featured ? 2 : 1)).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.015em] transition-colors group-hover:text-primary sm:text-[20px]">
                              {t.title}
                            </h3>
                            {p?.excerpt && (
                              <p className="mt-1.5 line-clamp-2 max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">
                                {p.excerpt}
                              </p>
                            )}
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="text-[12px] font-medium">
                                {t.user.name ?? t.user.username}
                              </span>
                              <span className="size-1 rounded-full bg-border" />
                              <span className="mono-label !text-[9px]">{dateLabel(t.createdAt)}</span>
                              {p && (
                                <>
                                  <span className="size-1 rounded-full bg-border" />
                                  <span className="mono-label !text-[9px]">{p.minutes} min</span>
                                </>
                              )}
                              {t.language && (
                                <>
                                  <span className="size-1 rounded-full bg-border" />
                                  <span className="mono-label !text-[9px]">{t.language}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="mt-1 grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:text-primary">
                            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── rail ───────────────────────────────────────────── */}
              <aside className="grid gap-4 lg:sticky lg:top-24">
                <div className="card-surface p-5">
                  <p className="mono-label">About the blog</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                    A public notebook. Anyone with an account can publish — no editor, no pitch, no
                    paywall.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
                    <div>
                      <p className="kpi-num text-[26px]">{tutorials.length}</p>
                      <p className="mono-label mt-1 !text-[9px]">essays</p>
                    </div>
                    <div>
                      <p className="kpi-num text-[26px]">
                        {new Set(tutorials.map((t) => t.user.username)).size}
                      </p>
                      <p className="mono-label mt-1 !text-[9px]">writers</p>
                    </div>
                  </div>
                  <Link href="/blog/new" className="btn btn-ink mt-5 w-full">
                    <Pencil className="size-4" /> Start writing
                  </Link>
                </div>

                <div className="rounded-2xl border border-dashed border-border p-5">
                  <p className="mono-label">Browse by topic</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLanguage("all")}
                      className={cn("chip", language === "all" && "chip-active")}
                    >
                      all
                    </button>
                    {languages.map(([lang, count]) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={cn("chip", language === lang && "chip-active")}
                      >
                        {lang} <span className="opacity-50">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
                  <p className="mono-label !text-[var(--paper)]/50">Elsewhere</p>
                  <div className="mt-3 grid gap-2">
                    <Link
                      href="/discuss"
                      className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/15"
                    >
                      Ask the community <ArrowUpRight className="size-3.5" />
                    </Link>
                    <Link
                      href="/explore"
                      className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/15"
                    >
                      Read community code <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="mono-label">The blog · written by the community</p>
          <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground">
            <Link href="/learn" className="link-underline hover:text-foreground">
              Courses
            </Link>
            <Link href="/playground" className="link-underline hover:text-foreground">
              Playground
            </Link>
            <Link href="/discuss" className="link-underline hover:text-foreground">
              Discussions
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
