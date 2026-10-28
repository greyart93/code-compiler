// Which exercises a learner has already solved, per lesson.
//
// Stored in localStorage under `codevit-exercises-<slug>-<lessonId>` as a list
// of solved exercise indices. The lesson page reads it on mount so a solved
// exercise stays solved across reloads, and writes on every solve.
//
// Exercises are keyed by index rather than by a hash of their content, so
// reordering them invalidates stored progress — acceptable, since the notes are
// regenerated rarely and a stale "solved" is a much smaller problem than a
// stale "unsolved".

const key = (slug: string, lessonId: string) =>
  `codevit-exercises-${slug}-${lessonId}`;

export function readSolvedExercises(slug: string, lessonId: string): Set<number> {
  try {
    const raw = localStorage.getItem(key(slug, lessonId));
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? new Set(list.filter((n): n is number => typeof n === "number"))
      : new Set();
  } catch {
    return new Set();
  }
}

export function writeSolvedExercises(
  slug: string,
  lessonId: string,
  solved: Set<number>
): void {
  try {
    localStorage.setItem(key(slug, lessonId), JSON.stringify([...solved]));
  } catch {
    /* private mode / quota — progress just won't persist */
  }
}

/**
 * Every exercise solved? `total` of 0 means the lesson has no exercises, which
 * is never "all solved" — that case is handled by the caller.
 */
export function allSolved(solved: Set<number>, total: number): boolean {
  return total > 0 && solved.size >= total;
}