import "server-only";
import { prisma } from "@/lib/db";

/** Normalise user text; an emptied optional field becomes null so it can be cleared. */
export function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g, " ").slice(0, max);
  return text || null;
}

/**
 * A playlist is only visible to mutate for its owner. Returning null for a
 * playlist someone else owns is deliberate: callers answer 404, not 403, so ids
 * cannot be probed.
 */
export async function ownedPlaylist(id: string, userId: string) {
  return prisma.playlist.findFirst({
    where: { id, userId },
    select: { id: true },
  });
}
