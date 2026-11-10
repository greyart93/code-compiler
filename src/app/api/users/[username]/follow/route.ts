import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { invalidate } from "@/lib/server-cache";

// POST /api/users/:username/follow  { follow: boolean }
// → { following: boolean, followers: number, friends: boolean }
// Following is one-directional; a pair that follows each other is a friendship.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const viewer = await getCurrentUser();
    if (!viewer) {
      return NextResponse.json({ error: "Sign in to follow people" }, { status: 401 });
    }

    const { username } = await params;
    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.id === viewer.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const follow = body?.follow !== false;

    if (follow) {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: { followerId: viewer.id, followingId: target.id },
        },
        create: { followerId: viewer.id, followingId: target.id },
        update: {},
      });
    } else {
      await prisma.follow.deleteMany({
        where: { followerId: viewer.id, followingId: target.id },
      });
    }

    const [followers, followsBack] = await Promise.all([
      prisma.follow.count({ where: { followingId: target.id } }),
      prisma.follow.count({
        where: { followerId: target.id, followingId: viewer.id },
      }),
    ]);

    // Folder/profile counts, the people lists and the feed depend on this edge
    invalidate("profile:");
    invalidate("social:");
    invalidate("feed:");
    return NextResponse.json({
      following: follow,
      followers,
      friends: follow && followsBack > 0,
    });
  } catch (error) {
    console.error("follow POST error:", error);
    return NextResponse.json({ error: "Failed to update follow" }, { status: 500 });
  }
}
