import "server-only";

/**
 * Tiny in-process cache for read endpoints.
 *
 * The database lives in another region, so a single query costs ~330ms no
 * matter how small it is. Most of the traffic on this app is the same handful
 * of lists (explore, profile, folders) read over and over, so keeping the JSON
 * for a few seconds removes nearly all of that latency on repeat visits —
 * without adding Redis or any other moving part.
 *
 * Mutations call `invalidate()`; entries are also dropped when they expire.
 */

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 500;

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  // Two components asking for the same thing should share one round trip
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      if (store.size > MAX_ENTRIES) {
        const now = Date.now();
        for (const [key, entry] of store) if (entry.expiresAt <= now) store.delete(key);
      }
      return value;
    })
    .catch((error) => {
      // A stale entry beats an error page; a cold failure still propagates
      if (hit) return hit.value as T;
      throw error;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

/** Drop everything, or every key starting with `prefix`. */
export function invalidate(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}
