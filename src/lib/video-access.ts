/**
 * Mux uploads cost money per stored/delivered minute, so they are opt-in.
 * Set MUX_UPLOAD_ALLOWLIST to a comma-separated list of usernames. Outside
 * production an empty allowlist allows signed-in users so local testing works.
 */
export function canUploadVideo(username: string) {
  const allowlist = (process.env.MUX_UPLOAD_ALLOWLIST ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) return process.env.NODE_ENV !== "production";
  return allowlist.includes(username.trim().toLowerCase());
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Keep a public discussion board from becoming an unlimited paid video host,
 * while still fitting full-length lessons: a topic playlist is six 5–12 hour
 * recordings, i.e. up to ~72 hours of video, so the defaults allow ~100 hours
 * of ready video. The asset count defaults to Mux's Free plan ceiling of 10
 * on-demand assets, which is a hard account-wide limit rather than a taste.
 */
export const VIDEO_LIMITS = {
  get activeUploads() {
    return Math.min(20, numberEnv("MUX_MAX_ACTIVE_UPLOADS", 4));
  },
  get totalMinutes() {
    // 10_000 min (≈166 h) is the hard ceiling for this deployment.
    return Math.min(10_000, numberEnv("MUX_MAX_TOTAL_MINUTES", 6_000));
  },
  get storedVideos() {
    return Math.min(10_000, numberEnv("MUX_MAX_STORED_VIDEOS", 10));
  },
};
