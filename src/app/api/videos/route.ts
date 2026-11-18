import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { appOrigin, isMuxConfigured } from "@/lib/mux";
import { getMux } from "@/lib/mux";
import { canUploadVideo } from "@/lib/video-access";
import { getVideoUsage } from "@/lib/video-usage";

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

    const usage = await getVideoUsage(user.id);

    if (usage.atActiveLimit) {
      return NextResponse.json(
        {
          error: `You can keep ${usage.limits.activeUploads} videos uploading at once. Wait for one to finish.`,
        },
        { status: 429 }
      );
    }
    if (usage.atVideoLimit) {
      return NextResponse.json(
        {
          error: `Mux Free's ${usage.limits.storedVideos}-asset account cap is reached. Delete a video from your library to free a slot.`,
        },
        { status: 429 }
      );
    }
    if (usage.atMinuteLimit) {
      return NextResponse.json(
        {
          error: `Video storage limit reached (${usage.limits.totalMinutes} minutes). Delete a video first.`,
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
        // Direct-upload URLs must outlive a multi-hour lesson upload.
        timeout: 60 * 60 * 24 * 7,
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
