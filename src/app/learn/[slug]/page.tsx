"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Lock,
  Play,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { COURSES, type LessonData, type SectionMeta } from "@/data/courses";
import { QUIZZES } from "@/data/quiz";
import { readProgress, saveLessonProgress } from "@/lib/course-progress";
import { Ring } from "@/components/ui/data-viz";
import { cn } from "@/lib/utils";

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const course = COURSES.find((c) => c.slug === slug);

  const [sections, setSections] = useState<SectionMeta[] | null>(null);
  const [lessons, setLessons] = useState<Record<string, LessonData>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!course) return;
    course.load().then(({ sections, lessons }) => {
      setSections(sections);
      setLessons(lessons);
      if (sections[0]) setOpen({ [sections[0].id]: true });
    });
    setDone(readProgress(slug));
  }, [course, slug]);

  if (!course) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · course</p>
            <h1 className="display mt-4 text-[42px]">No such course.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              That slug does not match a track in the library.
            </p>
            <Link href="/learn" className="btn btn-outline mt-6">
              <ArrowLeft className="size-4" /> All courses
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const canRunCourse = course.runnable !== false;
  const hasQuiz = QUIZZES.some((q) => q.slug === course.slug);
  const allLessonIds = sections?.flatMap((s) => s.lessonIds) ?? [];
  const completed = allLessonIds.filter((id) => done[id]).length;
  const pct = allLessonIds.length ? Math.round((completed / allLessonIds.length) * 100) : 0;
  const nextLessonId = allLessonIds.find((id) => !done[id]) ?? allLessonIds[0];

  const toggleDone = (lessonId: string) => {
    setDone((prev) => saveLessonProgress(slug, lessonId, !prev[lessonId], allLessonIds));
  };

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-5 sm:pt-7">
        <Link
          href="/learn"
          className="group inline-flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="grid size-7 place-items-center rounded-full border border-border transition-colors group-hover:border-foreground/30">
            <ArrowLeft className="size-3.5" />
          </span>
          All courses
        </Link>

        <header className="reveal mt-6 grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl font-mono text-[12px] font-bold",
                  course.accent
                )}
              >
                {course.icon}
              </span>
              <p className="mono-label">
                Track · {sections?.length ?? "—"} sections · {allLessonIds.length || "—"} lessons
              </p>
            </div>
            <h1 className="display mt-4 text-[clamp(44px,8vw,88px)]">{course.title}.</h1>
            <p className="mt-4 max-w-[64ch] text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
              {course.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {nextLessonId && (
                <Link href={`/learn/${slug}/${nextLessonId}`} className="btn btn-ink">
                  {completed > 0 ? "Continue" : "Start course"} <ArrowRight className="size-4" />
                </Link>
              )}
              {canRunCourse ? (
                <Link href="/playground" className="btn btn-outline">
                  <Play className="size-3.5" /> Open playground
                </Link>
              ) : (
                course.docsUrl && (
                  <a
                    href={course.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                  >
                    <ArrowUpRight className="size-3.5" />
                    {course.docsLabel ?? "Official docs"}
                  </a>
                )
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mono-label">Your progress</p>
            <div className="mt-4 flex items-center gap-4">
              <Ring value={pct} size={84} stroke={8} label={`${pct}%`} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">
                  {completed} of {allLessonIds.length || "—"}
                </p>
                <p className="mono-label mt-1 !text-[8.5px]">lessons complete</p>
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  {completed === 0
                    ? "Tick lessons as you finish them."
                    : completed === allLessonIds.length
                      ? "Track complete. Nicely done."
                      : "Progress is kept in this browser."}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* ── syllabus ──────────────────────────────────────────────── */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-baseline gap-3">
                <span className="mono-label">01</span>
                <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Syllabus</h2>
                <span className="mono-label !text-[10px]">{sections?.length ?? 0}</span>
              </div>
              <span className="mono-label !text-[10px]">
                {canRunCourse ? "read · run · keep the notes" : "read · practice · keep the notes"}
              </span>
            </div>

            {sections === null ? (
              <div className="mt-4 grid gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl border border-border bg-muted/30"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {sections.map((s, i) => {
                  const isOpen = open[s.id];
                  const doneCount = s.lessonIds.filter((id) => done[id]).length;
                  const secPct = s.lessonIds.length
                    ? Math.round((doneCount / s.lessonIds.length) * 100)
                    : 0;
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: Math.min(i * 0.04, 0.24) }}
                      className="overflow-hidden rounded-2xl border border-border bg-card"
                    >
                      <button
                        type="button"
                        onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                        aria-expanded={!!isOpen}
                        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-5"
                      >
                        <span className="mono-label w-6 shrink-0 !text-[9px]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em]">
                            {s.title}
                          </p>
                          <p className="mono-label mt-1 !text-[8.5px]">
                            {doneCount}/{s.lessonIds.length} done · {secPct}%
                          </p>
                        </div>
                        <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-muted sm:block">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500"
                            style={{ width: `${secPct}%` }}
                          />
                        </div>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-border border-t border-border">
                          {s.lessonIds.map((id, j) => {
                            const lesson = lessons[id];
                            if (!lesson) return null;
                            const isDone = !!done[id];
                            const locked = j > 0 && !done[s.lessonIds[j - 1]];
                            return (
                              <div
                                key={id}
                                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:px-5"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleDone(id)}
                                  aria-label={isDone ? "Mark as not done" : "Mark as done"}
                                  className={cn(
                                    "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                                    isDone
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border text-transparent hover:border-foreground/40"
                                  )}
                                >
                                  <Check className="size-3" />
                                </button>

                                <span className="mono-label w-7 shrink-0 !text-[9px] text-muted-foreground">
                                  {String(j + 1).padStart(2, "0")}
                                </span>

                                <Link href={`/learn/${slug}/${id}`} className="group min-w-0 flex-1">
                                  <span
                                    className={cn(
                                      "block truncate text-[13.5px] font-medium transition-colors group-hover:text-primary",
                                      isDone && "text-muted-foreground line-through"
                                    )}
                                  >
                                    {lesson.title}
                                  </span>
                                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <Clock className="size-3" /> {lesson.minutes} min read
                                  </span>
                                </Link>

                                {locked ? (
                                  <Lock
                                    className="size-3.5 shrink-0 text-muted-foreground/40"
                                    aria-label="Previous lesson not complete"
                                  />
                                ) : (
                                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── rail ──────────────────────────────────────────────────── */}
          <aside className="grid gap-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-dashed border-border p-5">
              <p className="mono-label">How to use a track</p>
              <ol className="mt-3 space-y-3">
                {[
                  ["01", "Read the lesson", "Skim the code first, then the prose."],
                  canRunCourse
                    ? ["02", "Run every snippet", "Open it in the playground and change it."]
                    : ["02", "Try every command", "Use a scratch project and run it locally."],
                  ["03", "Keep a note", "Write the one thing you want to remember."],
                  ["04", "Tick it off", "The ring fills as you go."],
                ].map(([n, head, body]) => (
                  <li key={n} className="flex gap-2.5">
                    <span className="mono-label shrink-0 !text-[9px] text-primary">{n}</span>
                    <div>
                      <p className="text-[12.5px] font-medium leading-snug">{head}</p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
              <p className="mono-label !text-[var(--paper)]/45">Pair it with</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--paper)]/65">
                {hasQuiz
                  ? "A quiz after the track is the fastest way to find the edges you skipped."
                  : "The practice prompts inside each lesson are the fastest way to make it stick."}
              </p>
              <div className="mt-4 grid gap-2">
                {hasQuiz ? (
                  <Link
                    href={`/quiz/${course.slug}`}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
                  >
                    Take the {course.title} quiz <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={nextLessonId ? `/learn/${slug}/${nextLessonId}` : `/learn/${slug}`}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
                  >
                    Continue the track <ArrowUpRight className="size-3.5" />
                  </Link>
                )}
                {canRunCourse ? (
                  <Link
                    href="/code-test"
                    className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
                  >
                    Practice problems <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : (
                  course.docsUrl && (
                    <a
                      href={course.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-white/15"
                    >
                      {course.docsLabel ?? "Read the docs"} <ArrowUpRight className="size-3.5" />
                    </a>
                  )
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
