import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/replies  { answerId, body }
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login to reply" }, { status: 401 });
    }

    const { answerId, body } = await request.json();
    if (!answerId || !body?.trim()) {
      return NextResponse.json({ error: "answerId and body are required" }, { status: 400 });
    }

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { id: true },
    });
    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    const reply = await prisma.reply.create({
      data: {
        answerId,
        body: String(body).trim().slice(0, 4000),
        userId: user.id,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("replies POST error:", error);
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}

// DELETE /api/replies?id=<id> → reply author only
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

    const reply = await prisma.reply.findUnique({ where: { id } });
    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }
    if (reply.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.reply.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("replies DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 });
  }
}
