import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cached, invalidate, isUnavailable } from "@/lib/server-cache";
import { tutorialPreview } from "@/lib/tutorial-preview";
import {
  cloudinaryPublicIdFromUrl,
  cloudinaryPublicIdsInHtml,
  deleteCloudinaryAssets,
} from "@/lib/cloudinary";

function cloudinaryAssetIds(coverImage: string | null, content: string) {
  const ids = [cloudinaryPublicIdFromUrl(coverImage), ...cloudinaryPublicIdsInHtml(content)];
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/**
 * If the lookup fails, treat every candidate as referenced. Skipping cleanup is
 * safer than deleting an asset another post may still use.
 */
async function referencedByOtherPosts(publicIds: string[], excludeId: string) {
  if (publicIds.length === 0) return new Set<string>();

  try {
    const candidates = new Set(publicIds);
    const rows = await prisma.tutorial.findMany({
      where: { id: { not: excludeId } },
      select: { coverImage: true, content: true },
    });
    const referenced = new Set<string>();

    for (const row of rows) {
      for (const publicId of cloudinaryAssetIds(row.coverImage, row.content)) {
        if (candidates.has(publicId)) referenced.add(publicId);
      }
    }
    return referenced;
  } catch (error) {
    console.error("Could not check Cloudinary references before cleanup:", error);
    return new Set(publicIds);
  }
}

// GET /api/tutorials            → latest published tutorials
// GET /api/tutorials?user=alice → just alice's published tutorials
// GET /api/tutorials?id=<id>    → single tutorial (full content)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const username = searchParams.get("user");

    if (id) {
      const tutorial = await prisma.tutorial.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, username: true, name: true } },
        },
      });
      if (!tutorial || !tutorial.published) {
        return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
      }
      return NextResponse.json({ tutorial });
    }

    // Excerpts and read time are derived here, once, so the index needs a
    // single request instead of one full-content request per card.
    const tutorials = await cached(`tutorials:${username ?? "all"}`, 30_000, async () => {
      const rows = await prisma.tutorial.findMany({
        where: { published: true, ...(username ? { user: { username } } : {}) },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          language: true,
          coverImage: true,
          createdAt: true,
          content: true,
          user: { select: { username: true, name: true } },
        },
      });
      return rows.map(({ content, ...tutorial }) => ({
        ...tutorial,
        ...tutorialPreview(content),
      }));
    });
    return NextResponse.json({ tutorials });
  } catch (error) {
    console.error("tutorials GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tutorials" }, { status: isUnavailable(error) ? 503 : 500 });
  }
}

// POST /api/tutorials → publish a tutorial (free, any signed-in user)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to publish a tutorial" },
        { status: 401 }
      );
    }

    const { title, content, language, coverImage } = await request.json();
    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    const tutorial = await prisma.tutorial.create({
      data: {
        title: String(title).slice(0, 150),
        content: String(content),
        language: language ? String(language) : null,
        coverImage: coverImage ? String(coverImage).slice(0, 500) : null,
        published: true,
        userId: user.id,
      },
      select: { id: true, title: true },
    });
    invalidate("tutorials:");
    return NextResponse.json({ tutorial }, { status: 201 });
  } catch (error) {
    console.error("tutorials POST error:", error);
    return NextResponse.json({ error: "Failed to publish tutorial" }, { status: 500 });
  }
}

// PUT /api/tutorials?id=<id> → update (author only)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.tutorial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, language, coverImage } = await request.json();
    const nextContent = content !== undefined ? String(content) : existing.content;
    const nextCover =
      coverImage !== undefined
        ? coverImage
          ? String(coverImage).slice(0, 500)
          : null
        : existing.coverImage;

    const tutorial = await prisma.tutorial.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).slice(0, 150) } : {}),
        content: nextContent,
        ...(language !== undefined ? { language: language ? String(language) : null } : {}),
        coverImage: nextCover,
      },
      select: { id: true, title: true },
    });

    // Only remove assets that are no longer referenced by any post.
    const before = cloudinaryAssetIds(existing.coverImage, existing.content);
    const after = new Set(cloudinaryAssetIds(nextCover, nextContent));
    const removed = before.filter((publicId) => !after.has(publicId));
    const stillUsed = await referencedByOtherPosts(removed, id);
    await deleteCloudinaryAssets(removed.filter((publicId) => !stillUsed.has(publicId)));

    invalidate("tutorials:");
    return NextResponse.json({ tutorial });
  } catch (error) {
    console.error("tutorials PUT error:", error);
    return NextResponse.json({ error: "Failed to update tutorial" }, { status: 500 });
  }
}

// DELETE /api/tutorials?id=<id> → remove (author only)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.tutorial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assets = cloudinaryAssetIds(existing.coverImage, existing.content);
    await prisma.tutorial.delete({ where: { id } });
    const stillUsed = await referencedByOtherPosts(assets, id);
    await deleteCloudinaryAssets(assets.filter((publicId) => !stillUsed.has(publicId)));

    invalidate("tutorials:");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("tutorials DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete tutorial" }, { status: 500 });
  }
}
