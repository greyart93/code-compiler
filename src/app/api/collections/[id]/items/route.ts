import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { invalidate } from "@/lib/server-cache";

// POST   /api/collections/:id/items { snippetId } → file a snippet into the folder
// DELETE /api/collections/:id/items?snippetId=    → take it back out
//
// Snippets are referenced, not copied: saving someone else's public snippet
// keeps them as the author.

async function ownedCollection(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!collection) {
    return { error: NextResponse.json({ error: "Collection not found" }, { status: 404 }) } as const;
  }
  if (collection.userId !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { user, collection } as const;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const owned = await ownedCollection(id);
    if ("error" in owned) return owned.error;

    const body = await request.json().catch(() => ({}));
    const snippetId = String(body?.snippetId ?? "");
    if (!snippetId) {
      return NextResponse.json({ error: "snippetId is required" }, { status: 400 });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
      select: { id: true, isPublic: true, userId: true },
    });
    if (!snippet || (!snippet.isPublic && snippet.userId !== owned.user.id)) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    await prisma.collectionItem.upsert({
      where: { collectionId_snippetId: { collectionId: id, snippetId } },
      create: { collectionId: id, snippetId },
      update: {},
    });
    // Touch the folder so it sorts to the top of the list
    await prisma.collection.update({ where: { id }, data: { updatedAt: new Date() } });

    const count = await prisma.collectionItem.count({ where: { collectionId: id } });
    invalidate("folders:");
    return NextResponse.json({ saved: true, count });
  } catch (error) {
    console.error("collection item POST error:", error);
    return NextResponse.json({ error: "Failed to save to folder" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const owned = await ownedCollection(id);
    if ("error" in owned) return owned.error;

    const snippetId = new URL(request.url).searchParams.get("snippetId");
    if (!snippetId) {
      return NextResponse.json({ error: "snippetId is required" }, { status: 400 });
    }

    await prisma.collectionItem.deleteMany({ where: { collectionId: id, snippetId } });
    const count = await prisma.collectionItem.count({ where: { collectionId: id } });
    invalidate("folders:");
    return NextResponse.json({ saved: false, count });
  } catch (error) {
    console.error("collection item DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove from folder" }, { status: 500 });
  }
}
