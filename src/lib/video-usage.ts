import "server-only";
import { prisma } from "@/lib/db";
import { VIDEO_LIMITS } from "@/lib/video-access";

const ACTIVE_STATUSES = ["WAITING", "UPLOADING", "PROCESSING"] as const;
/** Statuses whose rows hold a Mux asset without further conditions. */
const STORED_STATUSES = ["READY", "PROCESSING"] as const;

export type VideoUsage = {
  storedVideos: number;
  activeUploads: number;
  readyMinutes: number;
  remainingVideos: number;
  remainingMinutes: number;
  limits: {
    storedVideos: number;
    activeUploads: number;
    totalMinutes: number;
  };
  atVideoLimit: boolean;
  atActiveLimit: boolean;
  atMinuteLimit: boolean;
};

/**
 * The Mux video cap is account-wide, while the minute and concurrency limits
 * belong to the signed-in user.
 *
 * The stored count mirrors how Mux bills assets rather than how the library
 * displays them: an errored asset still occupies a slot on the plan.
 */
export async function getVideoUsage(userId: string): Promise<VideoUsage> {
  const [activeUploads, ready, storedVideos] = await Promise.all([
    prisma.video.count({
      where: { userId, status: { in: [...ACTIVE_STATUSES] } },
    }),
    prisma.video.aggregate({
      where: { userId, status: "READY" },
      _sum: { duration: true },
    }),
    prisma.video.count({
      where: {
        OR: [
          { status: { in: [...STORED_STATUSES] } },
          // Mux keeps — and counts against the account cap — an asset whose
          // processing later failed. Only rows that never got an asset back
          // (`muxAssetId` stays null when the upload died early) are free.
          { status: "ERRORED", muxAssetId: { not: null } },
        ],
      },
    }),
  ]);

  const readySeconds = ready._sum.duration ?? 0;
  const totalSeconds = VIDEO_LIMITS.totalMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - readySeconds);

  return {
    storedVideos,
    activeUploads,
    readyMinutes: Math.round((readySeconds / 60) * 10) / 10,
    remainingVideos: Math.max(0, VIDEO_LIMITS.storedVideos - storedVideos),
    remainingMinutes: Math.round((remainingSeconds / 60) * 10) / 10,
    limits: {
      storedVideos: VIDEO_LIMITS.storedVideos,
      activeUploads: VIDEO_LIMITS.activeUploads,
      totalMinutes: VIDEO_LIMITS.totalMinutes,
    },
    atVideoLimit: storedVideos >= VIDEO_LIMITS.storedVideos,
    atActiveLimit: activeUploads >= VIDEO_LIMITS.activeUploads,
    atMinuteLimit: readySeconds >= totalSeconds,
  };
}
