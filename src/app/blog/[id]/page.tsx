"use client";

import { useEffect, useState } from "react";
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

type Tutorial = {
  id: string;
  title: string;
  content: string;
  language: string | null;
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
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

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
              <Link href="/blog" className="btn btn-ink">
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
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="grid size-7 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
              <ArrowLeft className="size-3.5" />
            </span>
            The blog
          </Link>

          <div className="flex items-center gap-1.5">
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

        <div className="mx-auto mt-8 grid max-w-[1120px] items-start gap-10 lg:mt-12 lg:grid-cols-[220px_minmax(0,720px)] lg:justify-center lg:gap-14">
          {/* ── sidebar ─────────────────────────────────────────────── */}
          <aside className="grid gap-6 lg:sticky lg:top-24">
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
                  <Link href="/blog" className="btn btn-ink h-9 px-4 text-[12.5px]">
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
