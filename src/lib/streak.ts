import "server-only";
import { prisma } from "@/lib/db";

/** UTC midnight (as a Date) for a given date-ish value. */
export function utcMidnight(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Record a learning activity today (lesson completed, note saved, interview,
 * code test passed). Idempotent per day; recomputes the streak cache
 * (current count of consecutive days ending today/yesterday, longest ever).
 */
export async function recordActivity(userId: string, kind: string) {
  const day = utcMidnight();

  // upsert the activity day
  await prisma.activityDay.upsert({
    where: { userId_day: { userId, day } },
    update: {},
    create: { userId, day, kind },
  });

  // recompute streak from the activity log (robust to clock jumps / backfills)
  const days = await prisma.activityDay.findMany({
    where: { userId },
    select: { day: true },
    orderBy: { day: "desc" },
    take: 400,
  });

  const today = utcMidnight();
  const have = new Set(days.map((d) => d.day.getTime()));

  // streak counts backward from today; if today has no activity yet, start at
  // yesterday so an active user's streak doesn't visually reset at midnight
  let cursor = have.has(today.getTime()) ? today : new Date(today.getTime() - 86_400_000);
  let current = 0;
  while (have.has(cursor.getTime())) {
    current++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  // longest streak ever (scan backwards from the most recent activity day)
  let longest = 0;
  const sorted = days.map((d) => d.day.getTime()).sort((a, b) => b - a);
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i - 1] - sorted[i] === 86_400_000) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const lastDay = sorted[0] ? new Date(sorted[0]) : null;
  await prisma.streak.upsert({
    where: { userId },
    update: { current, longest, lastDay },
    create: { userId, current, longest, lastDay },
  });

  return { current, longest };
}

export async function getStreak(userId: string) {
  const s = await prisma.streak.findUnique({
    where: { userId },
    select: { current: true, longest: true, lastDay: true },
  });
  const today = utcMidnight();
  const lastDay = s?.lastDay ? s.lastDay.getTime() : null;

  // a stale streak (last activity the day before yesterday) shows 0 today
  const current =
    s && lastDay !== null && (lastDay === today.getTime() || lastDay === today.getTime() - 86_400_000)
      ? s.current
      : 0;

  return { current, longest: s?.longest ?? 0, doneToday: lastDay === today.getTime() };
}
