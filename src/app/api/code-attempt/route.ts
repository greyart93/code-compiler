import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordActivity } from "@/lib/streak";
import { PROBLEMS } from "@/data/code-tests";

// POST /api/code-attempt  { problemId, passed, score } → attempt saved
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { problemId, passed, score } = await request.json();
  if (!problemId || typeof problemId !== "string") {
    return NextResponse.json({ error: "problemId is required" }, { status: 400 });
  }

  const attempt = await prisma.codeAttempt.create({
    data: {
      userId: user.id,
      problemId,
      passed: !!passed,
      score: Math.max(0, Math.min(100, Number(score) || 0)),
    },
  });

  // solving a problem counts toward the streak
  await recordActivity(user.id, "code-test");

  return NextResponse.json({ attempt });
}

// GET /api/code-attempt → the signed-in user's attempts (newest first)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempts = await prisma.codeAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // join problem title/difficulty from the static problem set (dashboard rows)
  const enriched = attempts.map((a) => {
    const p = PROBLEMS.find((x) => x.id === a.problemId);
    return {
      ...a,
      title: p?.title ?? a.problemId,
      difficulty: p?.difficulty ?? "easy",
    };
  });
  return NextResponse.json({ attempts: enriched });
}
