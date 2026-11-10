import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { cached } from "@/lib/server-cache";

// GET /api/social              → your own connections (friends / following / followers)
// GET /api/social?user=alice   → someone else's connections, read-only
//
// A "friend" is a mutual follow: you follow them and they follow you back,
// so no request/accept step is needed.

const personSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
  bio: true,
} as const;

type PersonRow = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
};

function toPerson(
  user: PersonRow,
  viewerFollowing: Set<string>,
  viewerFollowers: Set<string>
) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    image: user.image,
    bio: user.bio,
    isFollowing: viewerFollowing.has(user.id),
    followsMe: viewerFollowers.has(user.id),
  };
}

type Payload = { status: number; body: Record<string, unknown> };

async function build(username: string | null, viewer: SessionUser | null): Promise<Payload> {
  {
    const target = username
      ? await prisma.user.findUnique({
          where: { username },
          select: { id: true, username: true, name: true, image: true },
        })
      : viewer;

    if (!target) {
      if (!viewer) {
        return { status: 401, body: { error: "Sign in to see your people" } };
      }
      return { status: 404, body: { error: "User not found" } };
    }

    const isOwner = viewer?.id === target.id;

    const [outRows, inRows] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: target.id },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { following: { select: personSelect } },
      }),
      prisma.follow.findMany({
        where: { followingId: target.id },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { follower: { select: personSelect } },
      }),
    ]);

    // Sets are relative to the viewer so every row can say Follow / Following / Follow back
    let viewerFollowingIds = new Set(outRows.map((row) => row.following.id));
    let viewerFollowerIds = new Set(inRows.map((row) => row.follower.id));

    if (viewer && !isOwner) {
      const [mine, theirs] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: viewer.id },
          select: { followingId: true },
        }),
        prisma.follow.findMany({
          where: { followingId: viewer.id },
          select: { followerId: true },
        }),
      ]);
      viewerFollowingIds = new Set(mine.map((row) => row.followingId));
      viewerFollowerIds = new Set(theirs.map((row) => row.followerId));
    }

    const following = outRows.map((row) => toPerson(row.following, viewerFollowingIds, viewerFollowerIds));
    const followers = inRows.map((row) => toPerson(row.follower, viewerFollowingIds, viewerFollowerIds));
    const friends = following.filter((person) =>
      inRows.some((row) => row.follower.id === person.id)
    );

    // Suggestions: people publishing in the commons whom the viewer does not follow yet
    let discover: ReturnType<typeof toPerson>[] = [];
    if (viewer && isOwner) {
      const recent = await prisma.snippet.findMany({
        where: { isPublic: true, userId: { not: viewer.id } },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { userId: true, user: { select: personSelect } },
      });
      const seen = new Set<string>();
      for (const row of recent) {
        if (seen.has(row.userId) || viewerFollowingIds.has(row.userId)) continue;
        seen.add(row.userId);
        discover.push(toPerson(row.user, viewerFollowingIds, viewerFollowerIds));
        if (discover.length >= 6) break;
      }
    }

    return {
      status: 200,
      body: {
        user: target,
        isOwner,
        stats: {
          following: following.length,
          followers: followers.length,
          friends: friends.length,
        },
        viewer: viewer
          ? {
              following: viewerFollowingIds.has(target.id),
              followsMe: viewerFollowerIds.has(target.id),
            }
          : null,
        lists: { friends, following, followers },
        discover,
      },
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("user");
    const viewer = await getCurrentUser();
    const payload = await cached(
      `social:${username ?? "me"}:${viewer?.id ?? "anon"}`,
      3_000,
      () => build(username, viewer)
    );
    return NextResponse.json(payload.body, { status: payload.status });
  } catch (error) {
    console.error("social GET error:", error);
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 });
  }
}
