import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { cached } from "@/lib/server-cache";

// GET /api/feed → newest public snippets from the people you follow.
//
// One statement (snippets + author + counts + the follow filter), because every
// extra query costs a round trip to a database in another region.

type FeedSnippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: string;
  user: { username: string; name: string | null; image: string | null };
  likes: number;
  comments: number;
};

const LIMIT = 30;

export async function GET() {
  try {
    const viewer = await getSessionClaims();
    if (!viewer) {
      return NextResponse.json({ error: "Sign in to see your feed" }, { status: 401 });
    }

    const payload = await cached(`feed:${viewer.id}`, 5_000, async () => {
      const rows = await prisma.$queryRaw<{ snippets: FeedSnippet[]; following: number }[]>`
        SELECT
          COALESCE(json_agg(row_to_json(f)), '[]'::json) AS snippets,
          (SELECT count(*)::int FROM "Follow" fo WHERE fo."followerId" = ${viewer.id}) AS following
        FROM (
          SELECT
            s.id,
            s.title,
            s.language,
            s.code,
            s."createdAt",
            json_build_object('username', u.username, 'name', u.name, 'image', u.image) AS "user",
            (SELECT count(*)::int FROM "Like" l WHERE l."snippetId" = s.id) AS likes,
            (SELECT count(*)::int FROM "Comment" c WHERE c."snippetId" = s.id) AS comments
          FROM "Snippet" s
          JOIN "User" u ON u.id = s."userId"
          WHERE s."isPublic"
            AND EXISTS (
              SELECT 1 FROM "Follow" f
              WHERE f."followerId" = ${viewer.id} AND f."followingId" = s."userId"
            )
          ORDER BY s."createdAt" DESC
          LIMIT ${LIMIT}
        ) f
      `;

      return {
        snippets: rows[0]?.snippets ?? [],
        following: rows[0]?.following ?? 0,
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("feed GET error:", error);
    return NextResponse.json({ error: "Failed to load your feed" }, { status: 500 });
  }
}
