// Course progress lives in localStorage (key: codevit-progress-<slug>) and is
// mirrored to the DB (CourseProgress table) whenever a course reaches 100%,
// so the profile page can show completed courses publicly.

export const progressKey = (slug: string) => `codevit-progress-${slug}`;

export function readProgress(slug: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(progressKey(slug));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isCourseComplete(map: Record<string, boolean>, allIds: string[]): boolean {
  return allIds.length > 0 && allIds.every((id) => map[id]);
}

/**
 * Set one lesson's done-state, persist to localStorage and sync the server:
 * 100% → POST /api/progress (record completion), below → DELETE (remove it).
 * Returns the updated map so callers can setState with it.
 */
export function saveLessonProgress(
  slug: string,
  lessonId: string,
  done: boolean,
  allIds: string[]
): Record<string, boolean> {
  const map = { ...readProgress(slug), [lessonId]: done };
  try {
    localStorage.setItem(progressKey(slug), JSON.stringify(map));
  } catch {}
  syncServer(slug, map, allIds);
  return map;
}

// Sync requests must land in order: toggling lessons fast fires several DELETEs
// before the final POST. Queue them per slug so the last state always wins.
const syncQueue = new Map<string, Promise<unknown>>();
const lastDesired = new Map<string, boolean>();

function syncServer(slug: string, map: Record<string, boolean>, allIds: string[]) {
  const complete = isCourseComplete(map, allIds);
  if (lastDesired.get(slug) === complete) return; // already synced this state
  lastDesired.set(slug, complete);

  const prev = syncQueue.get(slug) ?? Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() =>
      complete
        ? fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          })
        : fetch(`/api/progress?slug=${encodeURIComponent(slug)}`, { method: "DELETE" })
    )
    .catch(() => {});
  syncQueue.set(slug, next);
}
