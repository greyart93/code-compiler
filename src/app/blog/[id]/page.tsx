"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, CalendarDays, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { RichContent } from "@/components/rich-content";

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

/** Medium shows "5 min read" — 200 words per minute, always at least 1 */
function readTime(html: string): number {
  return Math.max(1, Math.round(readableLength(html) / 200));
}

export default function TutorialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tutorials?id=${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setTutorial(d.tutorial))
      .catch(() => setNotFound(true));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user));
  }, [id]);

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
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Post not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/blog">
              <ArrowLeft className="size-4" /> Back to Blog
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isAuthor = me?.id === tutorial.user.id;
  const minutes = readTime(tutorial.content);
  const authorName = tutorial.user.name ?? tutorial.user.username;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {/* Medium's reading column: wide on desktop, one measure of text */}
      <main className="mx-auto w-full max-w-[740px] px-5 pb-24 pt-10 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/blog">
              <ArrowLeft className="size-4" /> All posts
            </Link>
          </Button>
          {isAuthor && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/blog/${id}/edit`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </Button>
              <Button
                variant={confirming ? "destructive" : "ghost"}
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className={confirming ? "" : "text-destructive hover:text-destructive"}
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {confirming ? "Click again to delete" : "Delete"}
              </Button>
            </div>
          )}
        </div>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Title + byline, no card chrome */}
          <header className="mb-8">
            <h1 className="text-[2.6rem] font-bold leading-[1.12] tracking-[-0.03em] sm:text-5xl">
              {tutorial.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <Link href={`/u/${tutorial.user.username}`} className="flex items-center gap-2">
                {tutorial.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tutorial.user.image}
                    alt={`${authorName}'s avatar`}
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {authorName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-medium text-foreground hover:underline">
                  {authorName}
                </span>
              </Link>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {new Date(tutorial.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span aria-hidden>·</span>
              <span>{minutes} min read</span>
              {tutorial.language && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {tutorial.language}
                </span>
              )}
            </div>
            <hr className="mt-6" />
          </header>

          {/* Body authored via TipTap; rendered exactly as written */}
          <RichContent className="medium-article" html={tutorial.content} />
        </motion.article>
      </main>
    </div>
  );
}