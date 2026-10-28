import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/snippets/like  { snippetId } → toggle like → { liked, count }
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login to like snippets" }, { status: 401 });
    }

    const { snippetId } = await request.json();
    if (!snippetId) {
      return NextResponse.json({ error: "snippetId is required" }, { status: 400 });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
      select: { id: true, isPublic: true },
    });
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_snippetId: { userId: user.id, snippetId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
    } else {
      await prisma.like.create({ data: { userId: user.id, snippetId } });
    }

    const count = await prisma.like.count({ where: { snippetId } });
    return NextResponse.json({ liked: !existing, count });
  } catch (error) {
    console.error("like POST error:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
