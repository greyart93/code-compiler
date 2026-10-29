"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

type StreakData = { current: number; longest: number; doneToday: boolean };

/** Tiny streak badge for the header — flame + count, hidden while loading or signed out. */
export function StreakBadge() {
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/streak")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setStreak(d.streak))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!streak) return null;

  return (
    <span
      title={streak.doneToday ? "Streak safe for today 🔥" : "Do any lesson, note, interview or code test today to keep it"}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
        streak.doneToday
          ? "bg-orange-500/15 text-orange-500"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <Flame className={`size-4 ${streak.current === 0 ? "opacity-50" : ""}`} />
      {streak.current}
    </span>
  );
}
