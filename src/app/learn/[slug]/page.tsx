"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { COURSES, type LessonData, type SectionMeta } from "@/data/courses";
import { readProgress, saveLessonProgress } from "@/lib/course-progress";

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
    // load progress from localStorage
    setDone(readProgress(slug));
  }, [course, slug]);

  if (!course) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/learn">
              <ArrowLeft className="size-4" /> Back to Learn
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const allLessonIds = sections?.flatMap((s) => s.lessonIds) ?? [];
  const completed = allLessonIds.filter((id) => done[id]).length;
  const pct = allLessonIds.length ? Math.round((completed / allLessonIds.length) * 100) : 0;

  const toggleDone = (lessonId: string) => {
    setDone((prev) => saveLessonProgress(slug, lessonId, !prev[lessonId], allLessonIds));
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/learn">
            <ArrowLeft className="size-4" /> All courses
          </Link>
        </Button>

        {/* Course header card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <span
                  className={`flex size-14 items-center justify-center rounded-xl font-mono text-base font-bold ${course.accent}`}
                >
                  {course.icon}
                </span>
                <div>
                  <h1 className="text-2xl font-bold">{course.title}</h1>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {completed} of {allLessonIds.length} lessons
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections */}
        {sections === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {sections.map((s, i) => {
              const isOpen = open[s.id];
              const doneCount = s.lessonIds.filter((id) => done[id]).length;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-semibold">{s.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {doneCount}/{s.lessonIds.length}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t px-4 py-3">
                        <div className="grid gap-2.5">
                          {s.lessonIds.map((id, j) => {
                            const lesson = lessons[id];
                            if (!lesson) return null;
                            const isDone = !!done[id];
                            return (
                              <div
                                key={id}
                                className="flex items-center gap-3 rounded-lg border bg-background/40 px-3 py-2.5"
                              >
                                <button
                                  onClick={() => toggleDone(id)}
                                  aria-label={isDone ? "Mark as not done" : "Mark as done"}
                                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors ${
                                    isDone
                                      ? "border-green-500 bg-green-500 text-white"
                                      : "border-muted-foreground/40 text-transparent hover:border-primary"
                                  }`}
                                >
                                  ✓
                                </button>
                                <Link
                                  href={`/learn/${slug}/${id}`}
                                  className="min-w-0 flex-1"
                                >
                                  <span
                                    className={`block truncate text-sm font-medium hover:text-primary ${
                                      isDone ? "text-muted-foreground line-through" : ""
                                    }`}
                                  >
                                    {j + 1}. {lesson.title}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="size-3" /> {lesson.minutes} min
                                  </span>
                                </Link>
                                {j > 0 && !done[s.lessonIds[j - 1]] && (
                                  <Lock className="size-3.5 text-muted-foreground/40" aria-hidden />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
