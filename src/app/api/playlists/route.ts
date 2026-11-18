import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { canUploadVideo } from "@/lib/video-access";
import { cleanText } from "@/lib/playlist-access";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "playlist"
  );
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  let candidate = base;
  for (let attempt = 2; attempt < 60; attempt += 1) {
    const taken = await prisma.playlist.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

const playlistSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  topic: true,
  userId: true,
  items: {
    orderBy: { position: "asc" as const },
    select: {
      id: true,
      videoId: true,
      video: {
        select: {
          title: true,
          status: true,
          playbackId: true,
          duration: true,
        },
      },
    },
  },
} as const;

/** GET /api/playlists → every playlist, flagged with `mine` for the caller. */
export async function GET() {
  try {
    const user = await getSessionClaims();
    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: "asc" },
      take: 200,
      select: playlistSelect,
    });

    return NextResponse.json({
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        slug: playlist.slug,
        title: playlist.title,
        description: playlist.description,
        topic: playlist.topic,
        mine: playlist.userId === user?.id,
        items: playlist.items.map((item) => ({
          itemId: item.id,
          videoId: item.videoId,
          title: item.video.title,
          status: item.video.status,
          playbackId: item.video.playbackId,
          duration: item.video.duration,
        })),
      })),
    });
  } catch (error) {
    console.error("playlists GET error:", error);
    return NextResponse.json({ error: "Failed to load playlists" }, { status: 500 });
  }
}

/** POST /api/playlists { title, topic?, description? } → the new playlist. */
export async function POST(request: Request) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in to create a playlist" }, { status: 401 });
    }
    if (!canUploadVideo(user.username)) {
      return NextResponse.json(
        { error: "Video playlists are not enabled for this account" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = cleanText((body as { title?: unknown })?.title, 90);
    if (!title) {
      return NextResponse.json({ error: "Give the playlist a title" }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId: user.id,
        title,
        slug: await uniqueSlug(title),
        topic: cleanText((body as { topic?: unknown })?.topic, 40),
        description: cleanText((body as { description?: unknown })?.description, 300),
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: playlist.id }, { status: 201 });
  } catch (error) {
    console.error("playlists POST error:", error);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}
