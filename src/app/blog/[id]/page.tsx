"use client";

import { useEffect, useState, ViewTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { RichContent } from "@/components/rich-content";
import { Avatar, Tag } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toaster";
import { useMe } from "@/lib/use-me";
import { getCachedTutorial } from "@/lib/blog-cache";
import { loadImage } from "@/lib/blog-navigation";
import { finishRouteProgress } from "@/lib/route-progress";
import { cn } from "@/lib/utils";

type Tutorial = {
  id: string;
  title: string;
  content: string;
  language: string | null;
  coverImage: string | null;
  createdAt: string;
  user: { id: string; username: string; name: string | null; image?: string | null };
};

/** strip tags so word count reflects prose, not markup */
function readableLength(html: string): number {
  const text = html
    .replace(/<pre[\s\S]*?<\/pre>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

/** 200 words per minute, always at least 1 */
function readTime(html: string): number {
  return Math.max(1, Math.round(readableLength(html) / 200));
}

function longDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TutorialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { me } = useMe();
  // the index caches the posts it already fetched, so a navigation can paint
  // the same cover in the same commit and the shared element can morph
  const [tutorial, setTutorial] = useState<Tutorial | null>(() =>
    getCachedTutorial(id) ?? null
  );
  const [notFound, setNotFound] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  // immersive reading by default: the metadata rail is hidden until asked for
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tutorials?id=${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setTutorial(d.tutorial))
      .catch(() => setNotFound(true));
  }, [id]);

  // The card click preloads the cover, but the page-opening bar should only
  // finish once that cover is decoded and painted on the article.
  useEffect(() => {
    if (!tutorial) return;
    let cancelled = false;
    const done = () => {
      if (!cancelled) finishRouteProgress();
    };
    if (tutorial.coverImage) {
      void loadImage(tutorial.coverImage).then(done);
    } else {
      done();
    }
    return () => {
      cancelled = true;
    };
  }, [tutorial]);

  useEffect(() => {
    if (notFound) finishRouteProgress();
  }, [notFound]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [tutorial]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: tutorial?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast("Link copied", { variant: "success" });
    } catch {
      // user cancelled the share sheet — no toast needed
    }
  };

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/tutorials?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/blog");
      } else {
        setConfirming(false);
        setDeleting(false);
      }
    } catch {
      setConfirming(false);
      setDeleting(false);
    }
  };

  if (notFound) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · essay</p>
            <h1 className="display mt-4 text-[42px]">That page is blank.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The essay may have been unpublished or the link is wrong.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link
                href="/blog"
                transitionTypes={["blog-back"]}
                className="btn btn-ink"
              >
                <ArrowLeft className="size-4" /> The blog
              </Link>
              <Link href="/explore" className="btn btn-outline">
                Explore code
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <div className="page-wrap grid place-items-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isAuthor = me?.id === tutorial.user.id;
  const minutes = readTime(tutorial.content);
  const words = readableLength(tutorial.content);
  const authorName = tutorial.user.name ?? tutorial.user.username;

  return (
    <div className="app-shell">
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <SiteHeader />

      <main className="page-wrap pb-24 pt-5 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link
            href="/blog"
            transitionTypes={["blog-back"]}
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="grid size-7 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
              <ArrowLeft className="size-3.5" />
            </span>
            The blog
          </Link>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar((v) => !v)}
              aria-pressed={showSidebar}
              title={showSidebar ? "Hide essay details" : "Show essay details"}
              className="gap-1.5"
            >
              {showSidebar ? (
                <PanelLeftClose className="size-3.5" />
              ) : (
                <PanelLeftOpen className="size-3.5" />
              )}
              <span className="hidden sm:inline">
                {showSidebar ? "Hide details" : "Show details"}
              </span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
              {copied ? "Copied" : "Share"}
            </Button>
            {isAuthor && (
              <>
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href={`/blog/${id}/edit`}>
                    <Pencil className="size-3.5" /> Edit
                  </Link>
                </Button>
                <Button
                  variant={confirming ? "destructive" : "ghost"}
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className={confirming ? "gap-1.5" : "gap-1.5 text-destructive hover:text-destructive"}
                >
                  {deleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  {confirming ? "Confirm delete" : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            "mx-auto mt-8 grid max-w-[720px] items-start transition-[grid-template-columns,gap] duration-300 ease-out lg:mt-12 lg:max-w-[1120px] lg:justify-center",
            showSidebar
              ? "gap-10 lg:grid-cols-[220px_minmax(0,720px)] lg:gap-14"
              : "gap-0 lg:grid-cols-[0px_minmax(0,720px)] lg:gap-0"
          )}
        >
          {/* ── sidebar (hidden by default, immersive reading) ───────── */}
          <aside
            aria-hidden={!showSidebar}
            inert={!showSidebar}
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out lg:sticky lg:top-24",
              showSidebar ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="min-h-0 overflow-hidden">
            <div className="grid gap-6">
            <div>
              <p className="mono-label">Essay</p>
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {longDate(tutorial.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  {minutes} min read · {words} words
                </div>
                {tutorial.language && (
                  <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                    <FileText className="size-3.5 shrink-0" />
                    <span className="capitalize">{tutorial.language}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <p className="mono-label">Written by</p>
              <Link
                href={`/u/${tutorial.user.username}`}
                className="group mt-3 flex items-center gap-2.5"
              >
                <Avatar name={authorName} image={tutorial.user.image} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold transition-colors group-hover:text-primary">
                    {authorName}
                  </p>
                  <p className="mono-label !text-[9px]">@{tutorial.user.username}</p>
                </div>
                <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-dashed border-border p-4">
              <p className="mono-label">Enjoyed this?</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                Share it with someone who is learning the same thing.
              </p>
              <button
                type="button"
                onClick={handleShare}
                className="btn btn-outline mt-3 h-8 w-full px-3 text-[12px]"
              >
                <Share2 className="size-3.5" /> Copy link
              </button>
            </div>
            </div>
            </div>
          </aside>

          {/* ── article ─────────────────────────────────────────────── */}
          <article className="min-w-0">
            <header className="border-b border-border pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="accent">{tutorial.language ?? "general"}</Tag>
                <span className="mono-label !text-[9.5px]">
                  {minutes} min read · {longDate(tutorial.createdAt)}
                </span>
              </div>
              <h1 className="display mt-4 text-[clamp(34px,5.4vw,62px)] leading-[1.02] text-foreground">
                {tutorial.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Avatar name={authorName} image={tutorial.user.image} size={32} />
                <div>
                  <Link
                    href={`/u/${tutorial.user.username}`}
                    className="text-[13px] font-semibold hover:text-primary"
                  >
                    {authorName}
                  </Link>
                  <p className="mono-label !text-[9px]">
                    @{tutorial.user.username} · {longDate(tutorial.createdAt)}
                  </p>
                </div>
              </div>
            </header>

            {tutorial.coverImage && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-muted">
                <ViewTransition
                  name={`blog-cover-${tutorial.id}`}
                  share="morph"
                  default="none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tutorial.coverImage}
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                  />
                </ViewTransition>
              </div>
            )}

            <RichContent className="medium-article mt-8" html={tutorial.content} />

            <footer className="mt-12 border-t border-border pt-7">
              <div className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={authorName} image={tutorial.user.image} size={44} />
                  <div>
                    <p className="mono-label !text-[9px]">Written by</p>
                    <p className="text-[14px] font-semibold">{authorName}</p>
                    <Link
                      href={`/u/${tutorial.user.username}`}
                      className="mono-label !text-[9px] hover:text-primary"
                    >
                      @{tutorial.user.username}
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handleShare} className="btn btn-outline h-9 px-4 text-[12.5px]">
                    <Share2 className="size-3.5" /> Share
                  </button>
                  <Link
                    href="/blog"
                    transitionTypes={["blog-back"]}
                    className="btn btn-ink h-9 px-4 text-[12.5px]"
                  >
                    More essays <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <p className="mono-label">End of essay · thanks for reading</p>
                <Link
                  href="/blog/new"
                  className="link-underline inline-flex items-center gap-1.5 text-[12.5px] font-medium hover:text-primary"
                >
                  <Pencil className="size-3.5" /> Write your own
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </main>
    </div>
  );
}
