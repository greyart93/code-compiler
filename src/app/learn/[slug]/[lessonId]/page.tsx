"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { MarkdownContent } from "@/components/markdown-content";
import { LessonExercises } from "@/components/lesson-exercise";
import { COURSES, type Exercise } from "@/data/courses";
import { toast } from "@/components/ui/toaster";
import { readProgress, saveLessonProgress } from "@/lib/course-progress";
import {
  allSolved,
  readSolvedExercises,
  writeSolvedExercises,
} from "@/lib/exercise-progress";

/** first ```lang fence in a markdown lesson → the code "Run code" opens */
function firstCodeBlock(md: string): string | null {
  const m = md.match(/```[a-z0-9+#.-]*\n([\s\S]*?)```/i);
  return m ? m[1].replace(/\n+$/, "") : null;
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

  const allIds = useMemo(() => flatLessons.map((l) => l.id), [flatLessons]);

  // ⏩ open this lesson's code in the Playground, with a way back
  const backHref = `/learn/${slug}/${lessonId}`;
  const playgroundHref = useMemo(() => {
    if (!lessonMd) return null;
    const code = firstCodeBlock(lessonMd);
    if (!code) return null;
    return `/playground?lang=${encodeURIComponent(slug as string)}&code=${encodeURIComponent(
      code
    )}&from=${encodeURIComponent(backHref)}`;
  }, [lessonMd, slug, backHref]);

  const openInPlayground = useCallback(
    (code: string) => {
      router.push(
        `/playground?lang=${encodeURIComponent(slug as string)}&code=${encodeURIComponent(
          code
        )}&from=${encodeURIComponent(backHref)}`
      );
    },
    [router, slug, backHref]
  );

  const toggleDone = () => {
    const nextVal = !isDone;
    setIsDone(nextVal);
    saveLessonProgress(slug as string, lessonId as string, nextVal, allIds);
  };

  /**
   * An exercise was solved. Every side effect lives in the handler body, never
   * inside a setState updater — React runs updaters during render, and calling
   * setState/toast from in there is what throws "Cannot update a component
   * ('Toaster') while rendering a different component ('LessonPage')".
   */
  const onExerciseSolved = useCallback(
    (index: number) => {
      // guard on the ref so a re-click cannot double-fire the toast
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
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Lesson not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/learn/${slug ?? ""}`}>
              <ArrowLeft className="size-4" /> Back to course
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (state === "loading" || lessonMd === null) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? flatLessons[idx - 1] : null;
  const next = idx >= 0 && idx < flatLessons.length - 1 ? flatLessons[idx + 1] : null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/learn/${slug}`}>
              <ArrowLeft className="size-4" /> {course.title}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {playgroundHref && (
              <Button size="sm" variant="secondary" asChild className="gap-1.5">
                <Link href={playgroundHref}>
                  <Play className="size-3.5" /> Run code
                </Link>
              </Button>
            )}
            <Button
              variant={isDone ? "default" : "outline"}
              size="sm"
              onClick={toggleDone}
              className="gap-1.5"
            >
              <Check className="size-4" />
              {isDone ? "Completed" : "Mark complete"}
            </Button>
          </div>
        </div>

        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="py-6">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
                Lesson {idx + 1} of {flatLessons.length}
                <span className="font-normal text-muted-foreground">
                  · <Clock className="inline size-3" /> {minutes} min
                </span>
              </p>
              <h1 className="mb-5 text-2xl font-bold">{lessonTitle}</h1>
              <MarkdownContent
                md={lessonMd}
                onRunCode={openInPlayground}
                className="lesson-content rich-content prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-code:before:content-none prose-code:after:content-none"
              />
              <LessonExercises
                exercises={exercises}
                language={slug as string}
                solved={solvedExercises}
                onSolved={onExerciseSolved}
              />
            </CardContent>
          </Card>
        </motion.article>

        {/* Prev / next */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {prev ? (
            <Button variant="outline" asChild className="max-w-[48%]">
              <Link href={`/learn/${slug}/${prev.id}`} className="gap-2">
                <ArrowLeft className="size-4 shrink-0" />
                <span className="truncate">{prev.title}</span>
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button asChild className="max-w-[48%]">
              <Link href={`/learn/${slug}/${next.id}`} className="gap-2">
                <span className="truncate">{next.title}</span>
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            </Button>
          ) : (
            <Button variant="secondary" asChild>
              <Link href={`/learn/${slug}`}>Finish course 🎉</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}