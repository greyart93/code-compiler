import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { cleanText, ownedPlaylist } from "@/lib/playlist-access";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/playlists/:id
 * Body: { title?, description?, topic?, order?: string[] }
 * `order` is the playlist's item ids in their new sequence.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const { id } = await params;
    if (!(await ownedPlaylist(id, user.id))) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      title?: unknown;
      description?: unknown;
      topic?: unknown;
      order?: unknown;
    };

    const data: { title?: string; description?: string | null; topic?: string | null } = {};
    if (body.title !== undefined) {
      const title = cleanText(body.title, 90);
      if (!title) {
        return NextResponse.json({ error: "Give the playlist a title" }, { status: 400 });
      }
      data.title = title;
    }
    if (body.description !== undefined) data.description = cleanText(body.description, 300);
    if (body.topic !== undefined) data.topic = cleanText(body.topic, 40);

    if (Object.keys(data).length > 0) {
      await prisma.playlist.update({ where: { id }, data });
    }

    if (Array.isArray(body.order)) {
      const order = body.order.filter((value): value is string => typeof value === "string");
      const items = await prisma.playlistItem.findMany({
        where: { playlistId: id },
        select: { id: true },
      });
      const known = new Set(items.map((item) => item.id));
      if (order.length !== items.length || order.some((itemId) => !known.has(itemId))) {
        return NextResponse.json(
          { error: "The new order does not match this playlist" },
          { status: 400 }
        );
      }

      await prisma.$transaction(
        order.map((itemId, index) =>
          prisma.playlistItem.update({ where: { id: itemId }, data: { position: index } })
        )
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("playlist PATCH error:", error);
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

/** DELETE /api/playlists/:id → removes the playlist; videos stay in the library. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const { id } = await params;
    if (!(await ownedPlaylist(id, user.id))) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    await prisma.playlist.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("playlist DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}
