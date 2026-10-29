"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  FileCode2,
  Flame,
  LayoutDashboard,
  Lock,
  Pencil,
  Plus,
  StickyNote,
  Target,
  TerminalSquare,
  Trophy,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { useMe } from "@/lib/use-me";
import { fileNameFor } from "@/lib/language";
import { toast } from "@/components/ui/toaster";
import { AreaChart, Bars, Heatmap, Ring, Sparkline } from "@/components/ui/data-viz";
import { ArrowLink, Avatar, Empty, SectionHead, Stat, Tag } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Snippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  isPublic: boolean;
  updatedAt: string;
};

type Note = { id: string; title: string; body: string; updatedAt: string };

type InterviewSession = {
  id: string;
  kind: string;
  topic: string;
  questions: unknown;
  score: number | null;
  createdAt: string;
};

type Attempt = {
  id: string;
  problemId: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  score: number;
  passed: boolean;
  createdAt: string;
};

type Tutorial = {
  id: string;
  title: string;
  language: string | null;
  createdAt: string;
  user: { username: string; name: string | null };
};

type StreakData = { current: number; longest: number; doneToday: boolean };

type ProfileData = {
  completedCourses?: Array<{ slug: string; completedAt: string }>;
  stats?: { publicSnippets?: number; tutorials?: number };
};

const WEEK_DAYS = 84;

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function CardHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {hint && <span className="mono-label !text-[9.5px]">{hint}</span>}
      </div>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { me, loaded } = useMe();
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[] | null>(null);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [tutorials, setTutorials] = useState<Tutorial[] | null>(null);
  const [streak, setStreak] = useState<{ streak: StreakData; days: string[] } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [ready, setReady] = useState(false);
  const [unauthed, setUnauthed] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!me) {
      setUnauthed(true);
      router.replace(`/login?next=${encodeURIComponent("/dashboard")}`);
      return;
    }

    let alive = true;
    setReady(false);
    const json = (url: string) =>
      fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(url))));

    Promise.allSettled([
      json("/api/snippets?mine=1"),
      json("/api/notes"),
      json("/api/interview-sessions"),
      json("/api/code-attempt"),
      json("/api/streak"),
      json(`/api/users/${me.username}`),
      json("/api/tutorials"),
    ]).then(([snips, ns, sess, atts, str, prof, tuts]) => {
      if (!alive) return;
      setSnippets(snips.status === "fulfilled" ? snips.value.snippets ?? [] : []);
      setNotes(ns.status === "fulfilled" ? ns.value.notes ?? [] : []);
      setSessions(sess.status === "fulfilled" ? sess.value.sessions ?? [] : []);
      setAttempts(atts.status === "fulfilled" ? atts.value.attempts ?? [] : []);
      setStreak(str.status === "fulfilled" ? str.value : null);
      setProfile(prof.status === "fulfilled" ? prof.value : null);
      setTutorials(
        tuts.status === "fulfilled"
          ? (tuts.value.tutorials ?? []).filter((t: Tutorial) => t.user.username === me.username)
          : []
      );
      setReady(true);
    });

    return () => {
      alive = false;
    };
  }, [loaded, me, router]);

  const togglePublic = useCallback(async (s: Snippet) => {
    const next = !s.isPublic;
    setSnippets((prev) => prev?.map((x) => (x.id === s.id ? { ...x, isPublic: next } : x)) ?? prev);
    const res = await fetch(`/api/snippets?id=${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    if (!res.ok) {
      setSnippets((prev) => prev?.map((x) => (x.id === s.id ? { ...x, isPublic: !next } : x)) ?? prev);
      toast("Could not update visibility", { variant: "error" });
    }
  }, []);

  const copyCode = useCallback(async (s: Snippet) => {
    try {
      await navigator.clipboard.writeText(s.code);
      setCopiedId(s.id);
      toast("Copied to clipboard", { variant: "success" });
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast("Copy failed", { variant: "error" });
    }
  }, []);

  const downloadCode = (s: Snippet) => {
    const blob = new Blob([s.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileNameFor(s.language);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* ── derived analytics ─────────────────────────────────────────────── */
  const analytics = useMemo(() => {
    const sessionList = sessions ?? [];
    const scored = sessionList.filter((s) => typeof s.score === "number");
    const avgInterview = scored.length
      ? Math.round(scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length)
      : 0;
    const bestInterview = scored.length ? Math.max(...scored.map((s) => s.score ?? 0)) : 0;

    const chronological = [...scored].reverse();
    const trend = chronological.slice(-12);
    const trendValues = trend.map((s) => s.score ?? 0);
    const trendLabels = trend.map((s) => shortDate(s.createdAt));

    const attemptList = attempts ?? [];
    const passedCount = attemptList.filter((a) => a.passed).length;
    const passRate = attemptList.length ? Math.round((passedCount / attemptList.length) * 100) : 0;

    const snippetList = snippets ?? [];
    const languageCounts = new Map<string, number>();
    for (const s of snippetList) {
      const key = s.language || "other";
      languageCounts.set(key, (languageCounts.get(key) ?? 0) + 1);
    }
    const languages = [...languageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    const days = streak?.days ?? [];
    const activeLast30 = days.filter((d) => {
      const t = new Date(d + "T00:00:00Z").getTime();
      return Date.now() - t <= 30 * 86_400_000;
    }).length;
    const activeLast7 = days.filter((d) => {
      const t = new Date(d + "T00:00:00Z").getTime();
      return Date.now() - t <= 7 * 86_400_000;
    }).length;

    const timeline = [
      ...snippetList.slice(0, 8).map((s) => ({
        id: `s-${s.id}`,
        at: s.updatedAt,
        kind: "snippet" as const,
        title: s.title,
        meta: s.language,
        href: "/playground?snippet=" + s.id,
      })),
      ...(notes ?? []).slice(0, 8).map((n) => ({
        id: `n-${n.id}`,
        at: n.updatedAt,
        kind: "note" as const,
        title: n.title,
        meta: "note",
        href: "/learn",
      })),
      ...sessionList.slice(0, 8).map((s) => ({
        id: `i-${s.id}`,
        at: s.createdAt,
        kind: "interview" as const,
        title: `${s.topic} interview`,
        meta: `${s.score ?? 0}%`,
        href: "/interview",
      })),
      ...attemptList.slice(0, 8).map((a) => ({
        id: `a-${a.id}`,
        at: a.createdAt,
        kind: "attempt" as const,
        title: a.title,
        meta: a.passed ? "passed" : `${a.score}%`,
        href: `/code-test/${a.problemId}`,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);

    return {
      sessionList,
      avgInterview,
      bestInterview,
      trendValues,
      trendLabels,
      attemptList,
      passedCount,
      passRate,
      snippetList,
      languages,
      days,
      activeLast30,
      activeLast7,
      timeline,
      publicCount: snippetList.filter((s) => s.isPublic).length,
      privateCount: snippetList.filter((s) => !s.isPublic).length,
      courses: profile?.completedCourses ?? [],
    };
  }, [sessions, attempts, snippets, notes, streak, profile]);

  if (unauthed) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-16">
          <div className="mx-auto max-w-xl">
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Lock className="size-5" />
              </span>
              <h1 className="display mt-5 text-[34px]">Sign in required.</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The dashboard is private. Taking you to the sign-in page…
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link href="/login?next=%2Fdashboard" className="btn btn-ink">
                  Continue to sign in
                </Link>
                <Link href="/" className="btn btn-outline">
                  Back home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const loading = !ready;

  const firstName = (me?.name ?? me?.username ?? "").trim().split(/\s+/)[0] || "there";
  const hour = now?.getHours() ?? 12;
  const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const joined = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : null;

  const kpis = [
    {
      label: "Current streak",
      value: streak?.streak.current ?? 0,
      hint: `Longest ${streak?.streak.longest ?? 0} days · ${streak?.streak.doneToday ? "today is safe" : "practice today to keep it"}`,
      accent: true,
      spark: null as number[] | null,
    },
    {
      label: "Interview average",
      value: `${analytics.avgInterview}%`,
      hint: `${analytics.sessionList.length} session${analytics.sessionList.length === 1 ? "" : "s"} · best ${analytics.bestInterview}%`,
      spark: analytics.trendValues.length > 1 ? analytics.trendValues : null,
    },
    {
      label: "Problems passed",
      value: `${analytics.passedCount}/${analytics.attemptList.length}`,
      hint: `${analytics.passRate}% pass rate across saved attempts`,
    },
    {
      label: "Snippets",
      value: analytics.snippetList.length,
      hint: `${analytics.publicCount} public · ${analytics.privateCount} private`,
    },
  ];

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        {/* ── header ─────────────────────────────────────────────────── */}
        <header className="reveal border-b border-border pb-7">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">
                Dashboard
                {joined ? ` · member since ${joined}` : ""}
                {now ? ` · ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}` : ""}
              </p>
              <h1 className="display mt-3 text-[clamp(40px,7vw,82px)]">
                {greeting}, {firstName}.
              </h1>
              <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                A read on your practice — how often you show up, how your interviews score, which
                problems you have cleared, and what to do next.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/playground" className="btn btn-ink">
                <Plus className="size-4" /> New snippet
              </Link>
              {me && (
                <Link href={`/u/${me.username}`} className="btn btn-outline">
                  Public profile <ArrowUpRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* ── KPI band ───────────────────────────────────────────────── */}
        <section className="reveal reveal-1 mt-7 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-4 lg:divide-y-0">
            {kpis.map((k) => (
              <div key={k.label} className="relative p-5">
                <p className="mono-label">{k.label}</p>
                <p className={cn("kpi-num mt-3 text-[42px]", k.accent && "text-primary")}>{k.value}</p>
                <p className="mt-2 min-h-[32px] text-[11.5px] leading-snug text-muted-foreground">{k.hint}</p>
                {k.spark && (
                  <div className="mt-1 text-primary/70">
                    <Sparkline values={k.spark} className="h-7" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="grid gap-5">
              <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted/40" />
              <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
            </div>
            <div className="grid gap-5">
              <div className="h-48 animate-pulse rounded-2xl border border-border bg-muted/40" />
              <div className="h-56 animate-pulse rounded-2xl border border-border bg-muted/40" />
            </div>
          </div>
        ) : (
          <>
            <div className="reveal reveal-2 mt-7 grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
              {/* left column */}
              <div className="grid gap-5">
                {/* activity */}
                <section className="card-surface overflow-hidden">
                  <CardHead
                    title="Activity"
                    hint={`${analytics.days.length} active days`}
                    action={<span className="mono-label !text-[10px]">Last {WEEK_DAYS} days</span>}
                  />
                  <div className="p-5">
                    <div className="mb-5 grid grid-cols-3 gap-4">
                      <div>
                        <p className="mono-label">This week</p>
                        <p className="mt-1.5 text-2xl font-semibold tabular-nums">{analytics.activeLast7}/7</p>
                      </div>
                      <div>
                        <p className="mono-label">Last 30 days</p>
                        <p className="mt-1.5 text-2xl font-semibold tabular-nums">{analytics.activeLast30}</p>
                      </div>
                      <div>
                        <p className="mono-label">Longest run</p>
                        <p className="mt-1.5 text-2xl font-semibold tabular-nums">
                          {streak?.streak.longest ?? 0}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">days</span>
                        </p>
                      </div>
                    </div>
                    <Heatmap days={analytics.days} weeks={12} />
                  </div>
                </section>

                {/* interview trend */}
                <section className="card-surface overflow-hidden">
                  <CardHead
                    title="Interview score"
                    hint={`${analytics.sessionList.length} sessions`}
                    action={
                      <span className="mono-label !text-[10px]">
                        avg {analytics.avgInterview}% · best {analytics.bestInterview}%
                      </span>
                    }
                  />
                  <div className="p-5">
                    {analytics.trendValues.length ? (
                      <>
                        <AreaChart
                          values={analytics.trendValues}
                          labels={analytics.trendLabels}
                          suffix="%"
                          height={210}
                        />
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Every scored interview, oldest to newest. The line is your session average.
                        </p>
                      </>
                    ) : (
                      <Empty
                        icon={Video}
                        title="No interviews scored yet"
                        body="Run a mock interview and the score trend will appear here."
                        action={
                          <Link href="/interview" className="btn btn-outline">
                            Start an interview
                          </Link>
                        }
                        className="border-0 py-6"
                      />
                    )}
                  </div>
                </section>

                {/* code tests */}
                <section className="card-surface overflow-hidden">
                  <CardHead
                    title="Code tests"
                    hint={`${analytics.attemptList.length} attempts`}
                    action={<ArrowLink href="/code-test">Open problems</ArrowLink>}
                  />
                  <div className="grid gap-5 p-5 sm:grid-cols-[150px_1fr] sm:items-center">
                    <div className="flex justify-center">
                      <Ring
                        value={analytics.passRate}
                        label={`${analytics.passRate}%`}
                        sublabel="pass rate"
                        size={132}
                      />
                    </div>
                    <div className="min-w-0 space-y-2.5">
                      {analytics.attemptList.slice(0, 4).map((a) => (
                        <Link
                          key={a.id}
                          href={`/code-test/${a.problemId}`}
                          className="flex items-center gap-3 rounded-xl border border-transparent px-1 py-1.5 transition-colors hover:border-border hover:bg-muted/40"
                        >
                          <Tag tone={a.passed ? "success" : a.difficulty === "hard" ? "danger" : "warn"}>
                            {a.passed ? "pass" : a.difficulty}
                          </Tag>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{a.title}</span>
                          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{a.score}%</span>
                        </Link>
                      ))}
                      {analytics.attemptList.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No attempts saved yet — solved problems are recorded here automatically.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {/* right column */}
              <div className="grid gap-5">
                {/* today / next up */}
                <section className="overflow-hidden rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
                  <div className="flex items-center justify-between">
                    <p className="mono-label !text-[var(--paper)]/55">Today</p>
                    <Flame
                      className={cn(
                        "size-5",
                        streak?.streak.doneToday ? "text-orange-400" : "text-[var(--paper)]/35"
                      )}
                    />
                  </div>
                  <p className="display mt-3 text-[38px] leading-none">
                    {streak?.streak.current ?? 0}
                    <span className="ml-2 text-base font-medium tracking-normal text-[var(--paper)]/55">
                      day streak
                    </span>
                  </p>
                  <p className="mt-2 text-[12.5px] leading-snug text-[var(--paper)]/60">
                    {streak?.streak.doneToday
                      ? "You already practised today. Anything extra is a bonus."
                      : "A lesson, note, interview or code test keeps the run alive."}
                  </p>
                  <div className="mt-5 grid gap-2">
                    <Link
                      href="/learn"
                      className="flex items-center justify-between rounded-xl bg-[var(--paper)]/10 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--paper)]/15"
                    >
                      Continue a course <ArrowUpRight className="size-3.5" />
                    </Link>
                    <Link
                      href="/interview"
                      className="flex items-center justify-between rounded-xl bg-[var(--paper)]/10 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--paper)]/15"
                    >
                      Take a mock interview <ArrowUpRight className="size-3.5" />
                    </Link>
                    <Link
                      href="/playground"
                      className="flex items-center justify-between rounded-xl bg-[var(--paper)]/10 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--paper)]/15"
                    >
                      Write a snippet <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </section>

                {/* languages */}
                <section className="card-surface overflow-hidden">
                  <CardHead
                    title="Language mix"
                    hint={`${analytics.snippetList.length} snippets`}
                    action={<ArrowLink href="/explore">Explore</ArrowLink>}
                  />
                  <div className="p-5">
                    {analytics.languages.length ? (
                      <Bars items={analytics.languages} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Saved snippets will be grouped by language here.
                      </p>
                    )}
                  </div>
                </section>

                {/* courses */}
                <section className="card-surface overflow-hidden">
                  <CardHead
                    title="Courses finished"
                    hint={`${analytics.courses.length} completed`}
                    action={<ArrowLink href="/learn">Browse</ArrowLink>}
                  />
                  <div className="p-5">
                    {analytics.courses.length ? (
                      <div className="flex flex-wrap gap-2">
                        {analytics.courses.slice(0, 8).map((c) => (
                          <Link key={c.slug} href={`/learn/${c.slug}`} className="chip chip-active">
                            <BookOpen className="size-3" /> {c.slug}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Finish a course to collect it here.
                      </p>
                    )}
                  </div>
                </section>

                {/* timeline */}
                <section className="card-surface overflow-hidden">
                  <CardHead title="Recent activity" hint="latest first" />
                  <div className="divide-y divide-border">
                    {analytics.timeline.length ? (
                      analytics.timeline.map((item) => {
                        const Icon =
                          item.kind === "snippet"
                            ? Code2
                            : item.kind === "note"
                              ? StickyNote
                              : item.kind === "interview"
                                ? Video
                                : TerminalSquare;
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                              <Icon className="size-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium">{item.title}</p>
                              <p className="mono-label !text-[9px]">{item.meta}</p>
                            </div>
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              {shortDate(item.at)}
                            </span>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="px-5 py-6 text-sm text-muted-foreground">
                        Your activity will show up here.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* ── snippets ────────────────────────────────────────────── */}
            <section className="reveal reveal-3 mt-10">
              <SectionHead
                index="01"
                title="Your snippets"
                count={analytics.snippetList.length}
                action={
                  <div className="flex items-center gap-3">
                    <ArrowLink href="/explore">Community feed</ArrowLink>
                    <Link href="/playground" className="btn btn-outline h-9 px-4 text-[12.5px]">
                      <Plus className="size-3.5" /> New
                    </Link>
                  </div>
                }
              />
              {analytics.snippetList.length === 0 ? (
                <Empty
                  icon={Code2}
                  title="No snippets saved"
                  body="Write something in the playground and hit Save — it lands here."
                  action={
                    <Link href="/playground" className="btn btn-ink">
                      Open playground
                    </Link>
                  }
                  className="mt-5"
                />
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {analytics.snippetList.slice(0, 6).map((s) => (
                    <article key={s.id} className="card-surface overflow-hidden">
                      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Code2 className="size-3.5 shrink-0 text-primary" />
                          <span className="truncate text-[13px] font-medium">{s.title}</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={s.isPublic}
                          aria-label={`Toggle ${s.title} visibility`}
                          onClick={() => togglePublic(s)}
                          className={cn(
                            "relative h-4.5 w-8 shrink-0 rounded-full border border-transparent transition-colors",
                            s.isPublic ? "bg-primary" : "bg-input"
                          )}
                          style={{ height: 18, width: 32 }}
                        >
                          <span
                            className="absolute top-[2px] size-3.5 rounded-full bg-card shadow-sm transition-transform"
                            style={{ transform: `translateX(${s.isPublic ? 15 : 2}px)` }}
                          />
                        </button>
                      </div>
                      <div className="min-h-[92px] px-4 py-3">
                        <pre className="max-h-[92px] overflow-hidden whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                          {s.code.length > 160 ? `${s.code.slice(0, 160)}…` : s.code}
                        </pre>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                        <span className="mono-label !text-[9px]">
                          {s.language} · {s.isPublic ? "public" : "private"}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Link
                            href={`/playground?snippet=${s.id}`}
                            className="rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            Run
                          </Link>
                          <button
                            type="button"
                            onClick={() => copyCode(s)}
                            className="rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {copiedId === s.id ? <Check className="size-3.5" /> : "Copy"}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadCode(s)}
                            className="rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* ── interviews + notes + writing ────────────────────────── */}
            <div className="reveal reveal-4 mt-10 grid gap-8 lg:grid-cols-2">
              <section>
                <SectionHead
                  index="02"
                  title="Interview log"
                  count={analytics.sessionList.length}
                  action={<ArrowLink href="/interview">Start new</ArrowLink>}
                />
                {analytics.sessionList.length === 0 ? (
                  <Empty
                    icon={Video}
                    title="No interviews yet"
                    body="IRIS mock interviews score each answer and save the session here."
                    className="mt-5"
                  />
                ) : (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
                    {analytics.sessionList.slice(0, 6).map((s, i) => {
                      const qCount = Array.isArray(s.questions) ? s.questions.length : 0;
                      const score = s.score ?? 0;
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3",
                            i > 0 && "border-t border-border"
                          )}
                        >
                          <Tag tone="accent">{s.topic}</Tag>
                          <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
                            {qCount > 0 ? `${qCount} questions` : "Session"} · {shortDate(s.createdAt)}
                          </span>
                          <div className="flex w-[130px] items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-[width] duration-700"
                                style={{ width: `${Math.min(100, score)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right font-mono text-[11px] font-semibold text-primary">
                              {score}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <SectionHead
                  index="03"
                  title="Notes"
                  count={notes?.length ?? 0}
                  action={<ArrowLink href="/learn">Take notes</ArrowLink>}
                />
                {(notes ?? []).length === 0 ? (
                  <Empty icon={StickyNote} title="No notes yet" body="Notes taken inside lessons live here." className="mt-5" />
                ) : (
                  <div className="mt-5 grid gap-3">
                    {(notes ?? []).slice(0, 4).map((n) => (
                      <article key={n.id} className="card-surface p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="truncate text-[13.5px] font-semibold">{n.title}</h3>
                          <span className="mono-label shrink-0 !text-[9px]">{shortDate(n.updatedAt)}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                          {n.body}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="reveal reveal-5 mt-10">
              <SectionHead
                index="04"
                title="Writing"
                count={tutorials?.length ?? 0}
                action={
                  <Link href="/blog/new" className="btn btn-outline h-9 px-4 text-[12.5px]">
                    <Pencil className="size-3.5" /> New tutorial
                  </Link>
                }
              />
              {(tutorials ?? []).length === 0 ? (
                <Empty
                  icon={FileCode2}
                  title="No tutorials yet"
                  body="Publishing is free — share something you wish you had when you started."
                  className="mt-5"
                  action={
                    <Link href="/blog/new" className="btn btn-ink">
                      Write a tutorial
                    </Link>
                  }
                />
              ) : (
                <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
                  {(tutorials ?? []).slice(0, 6).map((t, i) => (
                    <div
                      key={t.id}
                      className={cn(
                        "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3",
                        i > 0 && "border-t border-border"
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FileCode2 className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/blog/${t.id}`} className="truncate text-[13px] font-medium hover:text-primary">
                          {t.title}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2">
                          {t.language && <span className="mono-label !text-[9px]">{t.language}</span>}
                          <span className="mono-label !text-[9px]">{shortDate(t.createdAt)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${t.id}/edit`}>
                          <Pencil className="size-3.5" /> Edit
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── footer strip ─────────────────────────────────────────── */}
            <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <p className="mono-label">
                <LayoutDashboard className="mr-1.5 inline size-3" /> Dashboard · private to you
              </p>
              <div className="flex flex-wrap items-center gap-5 text-[12.5px] text-muted-foreground">
                <Link href="/u/pythoncpp07" className="link-underline inline-flex items-center gap-1.5 hover:text-foreground">
                  <Trophy className="size-3.5" /> Public profile
                </Link>
                <Link href="/explore" className="link-underline hover:text-foreground">
                  Explore community code
                </Link>
                <Link href="/code-test" className="link-underline inline-flex items-center gap-1.5 hover:text-foreground">
                  <Target className="size-3.5" /> Practice problems
                </Link>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
