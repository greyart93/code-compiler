import { NextResponse } from "next/server";
import { getStreak } from "@/lib/streak";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/streak → { streak: { current, longest, doneToday }, days: string[] (UTC ISO dates of last ~12 weeks) }
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streak = await getStreak(user.id);

  // last 84 days of activity for the heatmap
  const since = new Date(Date.now() - 84 * 86_400_000);
  const days = await prisma.activityDay.findMany({
    where: { userId: user.id, day: { gte: since } },
    select: { day: true },
    orderBy: { day: "asc" },
  });

  return NextResponse.json({ streak, days: days.map((d) => d.day.toISOString().slice(0, 10)) });
}
