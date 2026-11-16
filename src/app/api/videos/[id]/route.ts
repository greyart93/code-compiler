import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";
import { getMux, isMuxConfigured } from "@/lib/mux";
import { refreshVideo } from "@/lib/mux-sync";

type Params = { params: Promise<{ id: string }> };

// GET /api/videos/:id → status + playback id; polls Mux while processing.
export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const { id } = await params;
    const owned = await prisma.video.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const video = await refreshVideo(id);
    return NextResponse.json({
      video: video
        ? {
            id: video.id,
            title: video.title,
            status: video.status,
            playbackId: video.playbackId,
            duration: video.duration,
            aspectRatio: video.aspectRatio,
            error: video.error,
          }
        : null,
    });
  } catch (error) {
    console.error("video GET error:", error);
    return NextResponse.json({ error: "Failed to load video" }, { status: 500 });
  }
}

// DELETE /api/videos/:id → delete at Mux first, then forget the row.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const { id } = await params;
    const video = await prisma.video.findFirst({
      where: { id, userId: user.id },
      select: { id: true, muxAssetId: true, muxUploadId: true },
    });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if ((video.muxAssetId || video.muxUploadId) && !isMuxConfigured()) {
      return NextResponse.json(
        { error: "Video hosting is not configured, so the remote asset was left alone" },
        { status: 503 }
      );
    }

    const mux = getMux();
    if (video.muxAssetId) {
      try {
        await mux.video.assets.delete(video.muxAssetId);
      } catch (error) {
        console.error("Mux asset delete error:", error);
        return NextResponse.json(
          { error: "Mux could not delete the asset; the video was kept so you can retry" },
          { status: 502 }
        );
      }
    } else if (video.muxUploadId) {
      try {
        await mux.video.uploads.cancel(video.muxUploadId);
      } catch {
        // Cancelling is best-effort; an upload that already created an asset is
        // caught by the asset_id branch above on the next attempt.
      }
    }

    await prisma.video.delete({ where: { id: video.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("video DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
