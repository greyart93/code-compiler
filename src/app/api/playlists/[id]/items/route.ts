import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { ownedPlaylist } from "@/lib/playlist-access";

type Params = { params: Promise<{ id: string }> };

/** POST /api/playlists/:id/items { videoId } → appended at the end. */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const { id } = await params;
    if (!(await ownedPlaylist(id, user.id))) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const videoId = (body as { videoId?: unknown })?.videoId;
    if (typeof videoId !== "string" || !videoId) {
      return NextResponse.json({ error: "Pick a video to add" }, { status: 400 });
    }

    const video = await prisma.video.findFirst({
      where: { id: videoId, userId: user.id },
      select: { id: true },
    });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const existing = await prisma.playlistItem.findUnique({
      where: { playlistId_videoId: { playlistId: id, videoId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "That video is already in this playlist" }, { status: 409 });
    }

    const last = await prisma.playlistItem.findFirst({
      where: { playlistId: id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    await prisma.playlistItem.create({
      data: {
        playlistId: id,
        videoId,
        position: (last?.position ?? -1) + 1,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("playlist item POST error:", error);
    return NextResponse.json({ error: "Failed to add the video" }, { status: 500 });
  }
}

/** DELETE /api/playlists/:id/items?itemId=... → unlink one video from the playlist. */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const { id } = await params;
    if (!(await ownedPlaylist(id, user.id))) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const itemId = new URL(request.url).searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const deleted = await prisma.playlistItem.deleteMany({
      where: { id: itemId, playlistId: id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("playlist item DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove the video" }, { status: 500 });
  }
}
