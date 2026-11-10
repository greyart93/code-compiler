import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser, getSessionClaims } from "@/lib/auth";
import { cached, invalidate } from "@/lib/server-cache";

// Collections (folders) of snippets — CodePen-style grouping.
//
// GET /api/collections                 → your folders, all visibilities
// GET /api/collections?user=alice      → alice's public folders
// GET /api/collections?snippet=<id>    → your folders + which ones already hold the snippet
// POST /api/collections { name, description?, isPublic? }

const MAX_NAME = 48;

/** One folder row, already shaped for `CollectionCard` */
type FolderRow = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  count: number;
  previews: { id: string; title: string; language: string; excerpt: string }[];
  contains?: boolean;
};

/**
 * Folders + item counts + the first few previews + "does it hold this snippet".
 *
 * Prisma needed three queries for that (folders, counts, previews) and each one
 * costs a round trip to another region, so the whole list is one statement.
 * `filter` is the SQL that picks the owner's rows; `snippetId` only adds the
 * `contains` flag.
 */
async function loadFolders(filter: Prisma.Sql, snippetId?: string): Promise<FolderRow[]> {
  const rows = await prisma.$queryRaw<{ folders: FolderRow[] }[]>`
    SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) AS folders
    FROM (
      SELECT
        c.id,
        c.name,
        c.description,
        c."isPublic",
        c."createdAt",
        c."updatedAt",
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
        ) AS previews,
        ${
          snippetId
            ? Prisma.sql`EXISTS (
                SELECT 1 FROM "CollectionItem" ci3
                WHERE ci3."collectionId" = c.id AND ci3."snippetId" = ${snippetId}
              )`
            : Prisma.sql`false`
        } AS contains
      FROM "Collection" c
      WHERE ${filter}
      ORDER BY c."updatedAt" DESC
    ) f
  `;
  return rows[0]?.folders ?? [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userParam = searchParams.get("user");
    const snippetId = searchParams.get("snippet");
    const viewer = await getSessionClaims();

    if (snippetId) {
      if (!viewer) return NextResponse.json({ error: "Sign in" }, { status: 401 });
      const snippet = await prisma.snippet.findUnique({
        where: { id: snippetId },
        select: { id: true, isPublic: true, userId: true },
      });
      if (!snippet || (!snippet.isPublic && snippet.userId !== viewer.id)) {
        return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
      }
      const collections = await cached(`folders:of:${viewer.id}:${snippetId}`, 3_000, () =>
        loadFolders(Prisma.sql`c."userId" = ${viewer.id}`, snippetId)
      );
      return NextResponse.json({ collections });
    }

    if (userParam) {
      const isOwner = viewer?.username === userParam;
      const collections = await cached(
        `folders:user:${userParam}:${isOwner ? viewer?.id : "anon"}`,
        5_000,
        () =>
          loadFolders(
            Prisma.sql`c."userId" = (SELECT u.id FROM "User" u WHERE u.username = ${userParam})
              ${isOwner ? Prisma.empty : Prisma.sql`AND c."isPublic"`}`
          )
      );
      if (collections.length === 0) {
        const exists = await prisma.user.findUnique({
          where: { username: userParam },
          select: { id: true },
        });
        if (!exists) return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ collections, isOwner });
    }

    if (!viewer) return NextResponse.json({ error: "Sign in" }, { status: 401 });
    const collections = await cached(`folders:own:${viewer.id}`, 5_000, () =>
      loadFolders(Prisma.sql`c."userId" = ${viewer.id}`)
    );
    return NextResponse.json({ collections, isOwner: true });
  } catch (error) {
    console.error("collections GET error:", error);
    return NextResponse.json({ error: "Failed to load collections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to create a folder" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim().slice(0, MAX_NAME);
    if (!name) {
      return NextResponse.json({ error: "Give the folder a name" }, { status: 400 });
    }

    const existing = await prisma.collection.findUnique({
      where: { userId_name: { userId: user.id, name } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: `You already have a folder called “${name}”` }, { status: 409 });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description: body?.description ? String(body.description).slice(0, 280) : null,
        isPublic: body?.isPublic !== false,
        userId: user.id,
      },
      select: { id: true, name: true, isPublic: true },
    });

    invalidate("folders:");
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("collections POST error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
