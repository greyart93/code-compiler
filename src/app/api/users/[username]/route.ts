import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        image: true,
        createdAt: true,
        _count: { select: { snippets: true, tutorials: true } },
        courseProgress: {
          select: { slug: true, completedAt: true },
          orderBy: { completedAt: "asc" },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const viewer = await getCurrentUser();
    const isOwner = viewer?.id === user.id;

    const publicSnippets = await prisma.snippet.count({
      where: { userId: user.id, isPublic: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        image: user.image,
        createdAt: user.createdAt,
      },
      stats: {
        publicSnippets,
        totalSnippets: isOwner ? user._count.snippets : undefined,
        tutorials: user._count.tutorials,
      },
      completedCourses: user.courseProgress.map((c) => ({
        slug: c.slug,
        completedAt: c.completedAt,
      })),
      isOwner,
    });
  } catch (error) {
    console.error("profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
