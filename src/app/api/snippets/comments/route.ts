import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/snippets/comments?snippetId=<id> → comments with author
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const snippetId = searchParams.get("snippetId");
    if (!snippetId) {
      return NextResponse.json({ error: "snippetId is required" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { snippetId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true } },
      },
    });
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("comments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/snippets/comments  { snippetId, body }
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login to comment" }, { status: 401 });
    }

    const { snippetId, body } = await request.json();
    if (!snippetId || !body?.trim()) {
      return NextResponse.json({ error: "snippetId and body are required" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        snippetId: String(snippetId),
        body: String(body).trim().slice(0, 2000),
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
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("comments POST error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

// DELETE /api/snippets/comments?id=<commentId> → comment author only
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

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    if (comment.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("comments DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
