import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { cached } from "@/lib/server-cache";

// Public profile: identity, counters, the work, the folders, the writing.
//
// The page used to make four requests (profile, snippets, folders, tutorials)
// and each one carried its own round trips to a database in another region.
// Everything now comes back from one statement, cached briefly.

type Row = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  publicSnippets: number;
  totalSnippets: number;
  tutorialsCount: number;
  followers: number;
  following: number;
  friends: number;
  collectionsCount: number;
  viewerFollows: boolean;
  followsViewer: boolean;
  completed: { slug: string; completedAt: string }[] | null;
  snippets: {
    id: string;
    title: string;
    language: string;
    code: string;
    isPublic: boolean;
    updatedAt: string;
  }[];
  tutorials: { id: string; title: string; language: string | null; createdAt: string }[];
  collections: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    count: number;
    previews: { id: string; title: string; language: string; excerpt: string }[];
  }[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    // Claims only — no session query on the profile's critical path
    const viewer = await getSessionClaims();
    const viewerId = viewer?.id ?? "";

    const rows = await cached(`profile:${username}:${viewerId || "anon"}`, 5_000, () =>
      prisma.$queryRaw<Row[]>`
        SELECT
          u.id,
          u.username,
          u.name,
          u.bio,
          u.image,
          u."createdAt",
          (SELECT count(*)::int FROM "Snippet" s WHERE s."userId" = u.id AND s."isPublic") AS "publicSnippets",
          (SELECT count(*)::int FROM "Snippet" s WHERE s."userId" = u.id) AS "totalSnippets",
          (SELECT count(*)::int FROM "Tutorial" t WHERE t."userId" = u.id AND t.published) AS "tutorialsCount",
          (SELECT count(*)::int FROM "Follow" f WHERE f."followingId" = u.id) AS followers,
          (SELECT count(*)::int FROM "Follow" f WHERE f."followerId" = u.id) AS following,
          (SELECT count(*)::int FROM "Follow" f
             WHERE f."followerId" = u.id
               AND EXISTS (
                 SELECT 1 FROM "Follow" g
                 WHERE g."followerId" = f."followingId" AND g."followingId" = u.id
               )) AS friends,
          (SELECT count(*)::int FROM "Collection" c
             WHERE c."userId" = u.id AND (c."isPublic" OR c."userId" = ${viewerId})) AS "collectionsCount",
          EXISTS (
            SELECT 1 FROM "Follow" x WHERE x."followerId" = ${viewerId} AND x."followingId" = u.id
          ) AS "viewerFollows",
          EXISTS (
            SELECT 1 FROM "Follow" y WHERE y."followerId" = u.id AND y."followingId" = ${viewerId}
          ) AS "followsViewer",
          (
            SELECT COALESCE(json_agg(json_build_object('slug', cp.slug, 'completedAt', cp."completedAt") ORDER BY cp."completedAt"), '[]'::json)
            FROM "CourseProgress" cp
            WHERE cp."userId" = u.id
          ) AS completed,
          (
            SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) FROM (
              SELECT sn.id, sn.title, sn.language, sn.code, sn."isPublic", sn."updatedAt"
              FROM "Snippet" sn
              WHERE sn."userId" = u.id AND (sn."isPublic" OR sn."userId" = ${viewerId})
              ORDER BY sn."updatedAt" DESC
            ) s
          ) AS snippets,
          (
            SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
              SELECT t.id, t.title, t.language, t."createdAt"
              FROM "Tutorial" t
              WHERE t."userId" = u.id AND t.published
              ORDER BY t."createdAt" DESC
              LIMIT 50
            ) t
          ) AS tutorials,
          (
            SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json) FROM (
              SELECT
                c.id,
                c.name,
                c.description,
                c."isPublic",
                (SELECT count(*)::int FROM "CollectionItem" ci WHERE ci."collectionId" = c.id) AS count,
                (
                  SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json) FROM (
                    SELECT sn.id, sn.title, sn.language, left(sn.code, 150) AS excerpt
                    FROM "CollectionItem" ci2
                    JOIN "Snippet" sn ON sn.id = ci2."snippetId"
                    WHERE ci2."collectionId" = c.id
                    ORDER BY ci2."createdAt" DESC
                    LIMIT 4
                  ) p
                ) AS previews
              FROM "Collection" c
              WHERE c."userId" = u.id AND (c."isPublic" OR c."userId" = ${viewerId})
              ORDER BY c."updatedAt" DESC
            ) c
          ) AS collections
        FROM "User" u
        WHERE u.username = ${username}
        LIMIT 1
      `
    );

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = viewerId === row.id;

    return NextResponse.json({
      user: {
        id: row.id,
        username: row.username,
        name: row.name,
        bio: row.bio,
        image: row.image,
        createdAt: row.createdAt,
      },
      stats: {
        publicSnippets: row.publicSnippets,
        totalSnippets: isOwner ? row.totalSnippets : undefined,
        tutorials: row.tutorialsCount,
        followers: row.followers,
        following: row.following,
        friends: row.friends,
        collections: row.collectionsCount,
      },
      viewer: viewer ? { following: row.viewerFollows, followsMe: row.followsViewer } : null,
      completedCourses: row.completed ?? [],
      isOwner,
      // Page furniture, so the profile is a single request
      snippets: row.snippets ?? [],
      tutorials: row.tutorials ?? [],
      collections: row.collections ?? [],
    });
  } catch (error) {
    console.error("profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
