"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Loader2,
  Play,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MarkdownContent } from "@/components/markdown-content";
import { LessonExercises } from "@/components/lesson-exercise";
import { LessonNotes } from "@/components/lesson-notes";
import { COURSES, type Exercise } from "@/data/courses";
import { isRunnableSnippet, resolveLanguage } from "@/lib/language";
import { toast } from "@/components/ui/toaster";
import { readProgress, saveLessonProgress } from "@/lib/course-progress";
import {
  allSolved,
  readSolvedExercises,
  writeSolvedExercises,
} from "@/lib/exercise-progress";
import { cn } from "@/lib/utils";

/**
 * First *runnable* ```lang fence in a lesson → the code "Run code" opens.
 * A static block (```bash no-run), a database client block, or a SQL DDL/DML
 * block is skipped instead of becoming the lesson's primary Run target.
 */
function firstCodeBlock(md: string): { code: string; language: string | null } | null {
  const re = /```([^\n]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(md))) {
    const info = match[1].trim().split(/\s+/).filter(Boolean);
    const language = info[0]?.toLowerCase() || null;
    const noRun = info
      .slice(1)
      .some((flag) => /^(?:no-?run|norun|static)$/i.test(flag));
    const code = match[2].replace(/\n+$/, "");
    if (!noRun && isRunnableSnippet(language, code)) return { code, language };
  }
  return null;
}

export default function LessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const router = useRouter();
  const course = COURSES.find((c) => c.slug === slug);

  const [state, setState] = useState<"loading" | "ready" | "notfound">("loading");
  const [lessonMd, setLessonMd] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [solvedExercises, setSolvedExercises] = useState<Set<number>>(new Set());
  const [lessonTitle, setLessonTitle] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  const [flatLessons, setFlatLessons] = useState<{ id: string; title: string }[]>([]);

  // guards against two solves landing in the same tick, before React commits
  // the state from the first one
  const solvedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!course) {
      setState("notfound");
      return;
    }
    let alive = true;
    course.load().then(({ sections, lessons }) => {
      if (!alive) return;
      const l = lessons[lessonId as string];
      if (!l) {
        setState("notfound");
        return;
      }
      setLessonTitle(l.title);
      setMinutes(l.minutes);
      setLessonMd(l.md);
      setExercises(l.exercises?.length ? l.exercises : l.exercise ? [l.exercise] : []);
      const restored = readSolvedExercises(slug, lessonId as string);
      setSolvedExercises(restored);
      solvedRef.current = restored;
      setFlatLessons(sections.flatMap((s) => s.lessonIds.map((id) => ({ id, title: lessons[id]?.title ?? id }))));
      setIsDone(!!readProgress(slug)[lessonId as string]);
      setState("ready");
    });
    return () => {
      alive = false;
    };
  }, [course, lessonId, slug]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setScrollPct(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const allIds = useMemo(() => flatLessons.map((l) => l.id), [flatLessons]);
  const canRunCourse = course?.runnable !== false;

  const backHref = `/learn/${slug}/${lessonId}`;
  const firstBlock = useMemo(() => (lessonMd ? firstCodeBlock(lessonMd) : null), [lessonMd]);
  const lessonLanguage = useMemo(
    () =>
      canRunCourse
        ? (firstBlock?.language ? resolveLanguage(firstBlock.language) : null) ??
          resolveLanguage(slug as string)
        : null,
    [canRunCourse, firstBlock, slug]
  );

  const playgroundHref = useMemo(() => {
    if (!canRunCourse || !firstBlock || !lessonLanguage) return null;
    return `/playground?lang=${encodeURIComponent(lessonLanguage)}&code=${encodeURIComponent(
      firstBlock.code
    )}&from=${encodeURIComponent(backHref)}`;
  }, [canRunCourse, firstBlock, lessonLanguage, backHref]);

  const openInPlayground = useCallback(
    (code: string, language?: string) => {
      if (!canRunCourse) return;
      const resolved =
        resolveLanguage(language) ?? resolveLanguage(slug as string);
      if (!resolved) return;
      router.push(
        `/playground?lang=${encodeURIComponent(resolved)}&code=${encodeURIComponent(
          code
        )}&from=${encodeURIComponent(backHref)}`
      );
    },
    [canRunCourse, router, slug, backHref]
  );

  const toggleDone = () => {
    const nextVal = !isDone;
    setIsDone(nextVal);
    saveLessonProgress(slug as string, lessonId as string, nextVal, allIds);
  };

  const onExerciseSolved = useCallback(
    (index: number) => {
      if (solvedRef.current.has(index)) return;

      const next = new Set(solvedRef.current).add(index);
      solvedRef.current = next;
      setSolvedExercises(next);
      writeSolvedExercises(slug as string, lessonId as string, next);

      if (allSolved(next, exercises.length) && !isDone) {
        setIsDone(true);
        saveLessonProgress(slug as string, lessonId as string, true, allIds);
        toast("All exercises solved 🎉", {
          description: "This lesson is marked complete.",
          variant: "success",
        });
      }
    },
    [slug, lessonId, exercises.length, isDone, allIds]
  );

  if (state === "notfound" || !course) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · lesson</p>
            <h1 className="display mt-4 text-[42px]">No such lesson.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              It may have moved, or the course slug is wrong.
            </p>
            <Link href={`/learn/${slug ?? ""}`} className="btn btn-outline mt-6">
              <ArrowLeft className="size-4" /> Back to course
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (state === "loading" || lessonMd === null) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-10">
          <div className="mx-auto max-w-[880px]">
            <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            <div className="mt-5 h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-10 grid gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded bg-muted"
                  style={{ width: `${90 - i * 6}%` }}
                />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? flatLessons[idx - 1] : null;
  const next = idx >= 0 && idx < flatLessons.length - 1 ? flatLessons[idx + 1] : null;

  return (
    <div className="app-shell">
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      <SiteHeader />
      <main className="page-wrap pb-20 pt-5 sm:pt-7">
        <div className="mx-auto max-w-[1100px]">
          <nav className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            <Link href="/learn" className="transition-colors hover:text-foreground">
              Learn
            </Link>
            <span className="text-border">/</span>
            <Link href={`/learn/${slug}`} className="transition-colors hover:text-foreground">
              {course.title}
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground">Lesson {idx + 1}</span>
          </nav>

          <header className="mt-5 border-b border-border pb-7">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="mono-label">
                    Lesson {idx + 1} of {flatLessons.length}
                  </span>
                  <span className="size-1 rounded-full bg-border" />
                  <span className="mono-label flex items-center gap-1 !text-[9px]">
                    <Clock className="size-3" /> {minutes} min read
                  </span>
                  {isDone && (
                    <>
                      <span className="size-1 rounded-full bg-border" />
                      <span className="mono-label !text-[9px] text-primary">completed</span>
                    </>
                  )}
                </div>
                <h1 className="display mt-3 text-[clamp(34px,5.4vw,58px)] leading-[1.02]">
                  {lessonTitle}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {playgroundHref && (
                  <Link href={playgroundHref} className="btn btn-outline">
                    <Play className="size-3.5" /> Run code
                  </Link>
                )}
                <button
                  type="button"
                  onClick={toggleDone}
                  className={cn("btn", isDone ? "btn-outline" : "btn-ink")}
                >
                  <Check className="size-4" />
                  {isDone ? "Completed" : "Mark complete"}
                </button>
              </div>
            </div>
          </header>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_250px]">
            <motion.article
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-0"
            >
              <MarkdownContent
                md={lessonMd}
                onRunCode={canRunCourse ? openInPlayground : undefined}
                className="lesson-content rich-content prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-code:before:content-none prose-code:after:content-none"
              />

              <LessonExercises
                exercises={exercises}
                language={slug as string}
                solved={solvedExercises}
                onSolved={onExerciseSolved}
              />
              <LessonNotes courseSlug={slug as string} lessonId={lessonId as string} />
            </motion.article>

            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <div className="card-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="mono-label">Your progress</p>
                  <span className="mono-label !text-[9px]">
                    {idx + 1}/{flatLessons.length}
                  </span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${((idx + 1) / Math.max(flatLessons.length, 1)) * 100}%` }}
                  />
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                  {isDone
                    ? "This lesson is marked complete. Keep going."
                    : canRunCourse
                      ? "Read it, run the snippet, then mark it complete."
                      : "Read it, try the commands in your own project, then mark it complete."}
                </p>
                <button
                  type="button"
                  onClick={toggleDone}
                  className={cn("btn mt-4 w-full", isDone ? "btn-outline" : "btn-ink")}
                >
                  <Check className="size-4" />
                  {isDone ? "Completed" : "Mark complete"}
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-border p-5">
                <p className="mono-label">Make it stick</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  {canRunCourse
                    ? "Change one line in the example and predict the output before you run it. That is the whole trick."
                    : "Rebuild the example in a scratch project and change one thing. That is the whole trick."}
                </p>
                {canRunCourse ? (
                  <Link
                    href="/playground"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:text-primary"
                  >
                    Open playground <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : (
                  course.docsUrl && (
                    <a
                      href={course.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:text-primary"
                    >
                      {course.docsLabel ?? "Open the docs"} <ArrowUpRight className="size-3.5" />
                    </a>
                  )
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
                <p className="mono-label !text-[var(--paper)]/45">Stuck?</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--paper)]/65">
                  Ask the room. A specific question with the failing snippet gets a useful answer.
                </p>
                <Link
                  href="/discuss/new"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--paper)] hover:underline"
                >
                  Ask a question <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </aside>
          </div>

          {/* prev / next */}
          <div className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/learn/${slug}/${prev.id}`}
                className="card-surface card-hover group flex items-center gap-3 p-4"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border">
                  <ArrowLeft className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="mono-label !text-[8.5px]">Previous</p>
                  <p className="mt-0.5 truncate text-[13px] font-medium group-hover:text-primary">
                    {prev.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            {next ? (
              <Link
                href={`/learn/${slug}/${next.id}`}
                className="card-surface card-hover group flex items-center justify-end gap-3 p-4 text-right"
              >
                <div className="min-w-0">
                  <p className="mono-label !text-[8.5px]">Next lesson</p>
                  <p className="mt-0.5 truncate text-[13px] font-medium group-hover:text-primary">
                    {next.title}
                  </p>
                </div>
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border">
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            ) : (
              <Link href={`/learn/${slug}`} className="btn btn-ink justify-center">
                Finish course <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
