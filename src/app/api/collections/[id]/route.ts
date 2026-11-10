import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { invalidate } from "@/lib/server-cache";

// GET    /api/collections/:id  → folder + its snippets (public folder or owner)
// PATCH  /api/collections/:id  → rename, re-describe, flip visibility (owner)
// DELETE /api/collections/:id  → delete the folder; snippets themselves survive (owner)

const MAX_NAME = 48;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = await getCurrentUser();
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { username: true, name: true, image: true } },
        items: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            snippet: {
              select: {
                id: true,
                title: true,
                language: true,
                code: true,
                isPublic: true,
                createdAt: true,
                user: { select: { username: true, name: true, image: true } },
                _count: { select: { likes: true, comments: true } },
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    const isOwner = viewer?.id === collection.userId;
    if (!collection.isPublic && !isOwner) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        user: collection.user,
        count: collection.items.length,
        items: collection.items,
      },
      isOwner,
    });
  } catch (error) {
    console.error("collection GET error:", error);
    return NextResponse.json({ error: "Failed to load folder" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { userId: true, name: true },
    });
    if (!existing) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    let name: string | undefined;
    if (body?.name !== undefined) {
      name = String(body.name).trim().slice(0, MAX_NAME);
      if (!name) return NextResponse.json({ error: "Give the folder a name" }, { status: 400 });
      if (name !== existing.name) {
        const clash = await prisma.collection.findUnique({
          where: { userId_name: { userId: user.id, name } },
          select: { id: true },
        });
        if (clash) {
          return NextResponse.json(
            { error: `You already have a folder called “${name}”` },
            { status: 409 }
          );
        }
      }
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(body?.description !== undefined
          ? { description: body.description ? String(body.description).slice(0, 280) : null }
          : {}),
        ...(body?.isPublic !== undefined ? { isPublic: Boolean(body.isPublic) } : {}),
      },
      select: { id: true, name: true, description: true, isPublic: true },
    });
    invalidate("folders:");
    return NextResponse.json({ collection });
  } catch (error) {
    console.error("collection PATCH error:", error);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.collection.delete({ where: { id } });
    invalidate("folders:");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("collection DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
