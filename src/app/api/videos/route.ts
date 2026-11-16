import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { appOrigin, isMuxConfigured } from "@/lib/mux";
import { getMux } from "@/lib/mux";
import { VIDEO_LIMITS, canUploadVideo } from "@/lib/video-access";

const ACTIVE_STATUSES = ["WAITING", "UPLOADING", "PROCESSING"] as const;

function cleanTitle(value: unknown) {
  if (typeof value !== "string") return null;
  const title = value.trim().replace(/\s+/g, " ").slice(0, 140);
  return title || null;
}

// POST /api/videos { title? } → { videoId, uploadUrl, uploadId }
export async function POST(request: Request) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in to upload a video" }, { status: 401 });
    }
    if (!canUploadVideo(user.username)) {
      return NextResponse.json(
        { error: "Video uploads are not enabled for this account" },
        { status: 403 }
      );
    }
    if (!isMuxConfigured()) {
      return NextResponse.json(
        { error: "Video hosting is not configured yet" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = cleanTitle((body as { title?: unknown })?.title);

    const [active, ready] = await Promise.all([
      prisma.video.count({
        where: { userId: user.id, status: { in: [...ACTIVE_STATUSES] } },
      }),
      prisma.video.aggregate({
        where: { userId: user.id, status: "READY" },
        _sum: { duration: true },
      }),
    ]);

    if (active >= VIDEO_LIMITS.activeUploads) {
      return NextResponse.json(
        {
          error: `You can keep ${VIDEO_LIMITS.activeUploads} videos uploading at once. Wait for one to finish.`,
        },
        { status: 429 }
      );
    }
    if ((ready._sum.duration ?? 0) >= VIDEO_LIMITS.totalMinutes * 60) {
      return NextResponse.json(
        {
          error: `Video storage limit reached (${VIDEO_LIMITS.totalMinutes} minutes). Delete a video first.`,
        },
        { status: 429 }
      );
    }

    const video = await prisma.video.create({
      data: { userId: user.id, title },
      select: { id: true },
    });

    try {
      const mux = getMux();
      const upload = await mux.video.uploads.create({
        cors_origin: appOrigin(request),
        new_asset_settings: {
          playback_policies: ["public"],
          video_quality: "basic",
          passthrough: video.id,
        },
        timeout: 3600,
      });

      if (!upload.url) throw new Error("Mux did not return an upload URL");

      await prisma.video.update({
        where: { id: video.id },
        data: {
          muxUploadId: upload.id,
          status: "UPLOADING",
        },
      });

      return NextResponse.json(
        { videoId: video.id, uploadUrl: upload.url, uploadId: upload.id },
        { status: 201 }
      );
    } catch (error) {
      console.error("Mux direct upload error:", error);
      await prisma.video.update({
        where: { id: video.id },
        data: {
          status: "ERRORED",
          error: error instanceof Error ? error.message.slice(0, 300) : "Upload could not be created",
        },
      });
      return NextResponse.json({ error: "Could not start the video upload" }, { status: 502 });
    }
  } catch (error) {
    console.error("videos POST error:", error);
    return NextResponse.json({ error: "Failed to start video upload" }, { status: 500 });
  }
}

// GET /api/videos → the signed-in user's library
export async function GET() {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }
    if (!canUploadVideo(user.username)) {
      return NextResponse.json({ error: "Video library is not enabled" }, { status: 403 });
    }

    const videos = await prisma.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        playbackId: true,
        duration: true,
        aspectRatio: true,
        error: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("videos GET error:", error);
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
  }
}
