/** Shapes returned by /api/playlists, shared by the watch pages and dashboard. */

export type PlaylistItemStatus =
  | "WAITING"
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "ERRORED";

export type PlaylistVideo = {
  /** PlaylistItem row id — used for reordering and removal */
  itemId: string;
  videoId: string;
  title: string | null;
  status: PlaylistItemStatus;
  playbackId: string | null;
  duration: number | null;
};

export type PlaylistSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  topic: string | null;
  /** True when the signed-in user owns this playlist */
  mine: boolean;
  items: PlaylistVideo[];
};

export function watchHref(slug: string, videoId?: string) {
  return videoId
    ? `/videos/${encodeURIComponent(slug)}?v=${encodeURIComponent(videoId)}`
    : `/videos/${encodeURIComponent(slug)}`;
}

export function durationLabel(seconds: number | null) {
  if (!seconds) return null;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function totalDuration(items: PlaylistVideo[]) {
  return items.reduce((sum, item) => sum + (item.duration ?? 0), 0);
}

export function isPlayable(item: PlaylistVideo) {
  return item.status === "READY" && Boolean(item.playbackId);
}
