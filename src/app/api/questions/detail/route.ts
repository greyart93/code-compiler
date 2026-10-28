import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/questions/detail?id=<id> → question + answers (with votes + votedByMe)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const viewer = await getCurrentUser();

    const question = await prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
        _count: { select: { votes: true } },
        ...(viewer
          ? { votes: { where: { userId: viewer.id }, select: { id: true } } }
          : {}),
      },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const answers = await prisma.answer.findMany({
      where: { questionId: id },
      orderBy: { createdAt: "asc" as const },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
        _count: { select: { votes: true } },
        ...(viewer
          ? { votes: { where: { userId: viewer.id }, select: { id: true } } }
          : {}),
      },
    });

    return NextResponse.json({
      question: {
        ...(() => {
          const { votes, ...rest } = question;
          return { ...rest, votedByMe: viewer ? votes.length > 0 : false };
        })(),
      },
      answers: answers
        .map((a) => {
          const { votes, ...rest } = a;
          return { ...rest, votedByMe: viewer ? votes.length > 0 : false };
        })
        .sort((a, b) => b._count.votes - a._count.votes || +new Date(a.createdAt) - +new Date(b.createdAt)),
    });
  } catch (error) {
    console.error("question detail GET error:", error);
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 });
  }
}
