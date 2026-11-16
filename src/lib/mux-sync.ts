import "server-only";
import { prisma } from "@/lib/db";
import { assetFields, getMux, isMuxConfigured } from "@/lib/mux";

/**
 * Pull the latest state for a video while it is processing. The webhook is the
 * source of truth once configured; this makes local development and a missed
 * webhook recover without a separate job.
 */
export async function refreshVideo(videoId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || !isMuxConfigured()) return video;
  if (video.status === "READY" || video.status === "ERRORED") return video;

  const mux = getMux();

  try {
    if (video.muxUploadId) {
      const upload = await mux.video.uploads.retrieve(video.muxUploadId);
      if (
        upload.status === "errored" ||
        upload.status === "cancelled" ||
        upload.status === "timed_out"
      ) {
        return prisma.video.update({
          where: { id: video.id },
          data: {
            status: "ERRORED",
            error: upload.error?.message ?? `Upload ${upload.status.replaceAll("_", " ")}`,
          },
        });
      }
      if (!upload.asset_id) return video;

      const asset = await mux.video.assets.retrieve(upload.asset_id);
      return prisma.video.update({
        where: { id: video.id },
        data: assetFields(asset),
      });
    }

    if (video.muxAssetId) {
      const asset = await mux.video.assets.retrieve(video.muxAssetId);
      return prisma.video.update({
        where: { id: video.id },
        data: assetFields(asset),
      });
    }
  } catch (error) {
    console.error("Could not refresh Mux video:", error);
  }

  return video;
}
