import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/votes  { questionId } or { answerId } → toggle upvote → { voted, count }
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login to vote" }, { status: 401 });
    }

    const { questionId, answerId } = await request.json();
    if (!questionId && !answerId) {
      return NextResponse.json({ error: "questionId or answerId is required" }, { status: 400 });
    }
    if (questionId && answerId) {
      return NextResponse.json({ error: "vote on one thing at a time" }, { status: 400 });
    }

    if (questionId) {
      const existing = await prisma.vote.findUnique({
        where: { userId_questionId: { userId: user.id, questionId } },
      });
      if (existing) {
        await prisma.vote.delete({ where: { id: existing.id } });
      } else {
        await prisma.vote.create({ data: { userId: user.id, questionId } });
      }
      const count = await prisma.vote.count({ where: { questionId } });
      return NextResponse.json({ voted: !existing, count });
    }

    const existing = await prisma.vote.findUnique({
      where: { userId_answerId: { userId: user.id, answerId } },
    });
    if (existing) {
      await prisma.vote.delete({ where: { id: existing.id } });
    } else {
      await prisma.vote.create({ data: { userId: user.id, answerId } });
    }
    const count = await prisma.vote.count({ where: { answerId } });
    return NextResponse.json({ voted: !existing, count });
  } catch (error) {
    console.error("votes POST error:", error);
    return NextResponse.json({ error: "Failed to toggle vote" }, { status: 500 });
  }
}
