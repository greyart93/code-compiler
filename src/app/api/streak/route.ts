import { NextResponse } from "next/server";
import { getStreak } from "@/lib/streak";
import { getSessionClaims } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cached } from "@/lib/server-cache";

// GET /api/streak → { streak: { current, longest, doneToday }, days: string[] (UTC ISO dates of last ~12 weeks) }
export async function GET() {
  const user = await getSessionClaims();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 84 * 86_400_000);

  // The header asks for this on every page; both queries run together and the
  // result is reused for a few seconds instead of costing a round trip each.
  const payload = await cached(`streak:${user.id}`, 10_000, async () => {
    const [streak, days] = await Promise.all([
      getStreak(user.id),
      prisma.activityDay.findMany({
        where: { userId: user.id, day: { gte: since } },
        select: { day: true },
        orderBy: { day: "asc" },
      }),
    ]);
    return { streak, days: days.map((d) => d.day.toISOString().slice(0, 10)) };
  });

  return NextResponse.json(payload);
}
