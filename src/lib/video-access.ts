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

/** Keep a public discussion board from becoming an unlimited paid video host. */
export const VIDEO_LIMITS = {
  get activeUploads() {
    return Math.min(20, numberEnv("MUX_MAX_ACTIVE_UPLOADS", 3));
  },
  get totalMinutes() {
    return Math.min(10_000, numberEnv("MUX_MAX_TOTAL_MINUTES", 20));
  },
};
