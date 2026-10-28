import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/answers  { questionId, body }
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login to answer" }, { status: 401 });
    }

    const { questionId, body } = await request.json();
    if (!questionId || !body?.trim()) {
      return NextResponse.json({ error: "questionId and body are required" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const answer = await prisma.answer.create({
      data: {
        questionId,
        body: String(body).trim().slice(0, 10000),
        userId: user.id,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
        _count: { select: { votes: true } },
      },
    });
    return NextResponse.json({ answer: { ...answer, votedByMe: false } }, { status: 201 });
  } catch (error) {
    console.error("answers POST error:", error);
    return NextResponse.json({ error: "Failed to post answer" }, { status: 500 });
  }
}

// DELETE /api/answers?id=<id> → owner only
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const answer = await prisma.answer.findUnique({ where: { id } });
    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }
    if (answer.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.answer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("answers DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete answer" }, { status: 500 });
  }
}
