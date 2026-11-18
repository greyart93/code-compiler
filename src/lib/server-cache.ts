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
 *
 * A failed load also marks its key as down for a few seconds. When the database
 * is unreachable every attempt costs the pool's whole connect timeout, so
 * repeats of the same key would otherwise queue up behind a dead endpoint;
 * they fail immediately with `ServiceUnavailableError` (routes answer 503)
 * until the marker expires or `invalidate()` clears it after a write.
 */

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 500;

/** How long a key that just failed is answered with 503 instead of retried. */
export const UNAVAILABLE_TTL = 5_000;

/** key → time after which it is worth attempting again */
const downUntil = new Map<string, number>();

/**
 * Thrown instead of touching the database while a key is marked down. Routes
 * map it to 503 so a short outage is not reported as an application bug.
 */
export class ServiceUnavailableError extends Error {
  readonly status = 503;

  constructor() {
    super("The database is not responding");
    this.name = "ServiceUnavailableError";
  }
}

/** True for the fast, cached failure — the load was skipped, not retried. */
export function isUnavailable(error: unknown): error is ServiceUnavailableError {
  return error instanceof ServiceUnavailableError;
}

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const down = downUntil.get(key);
  if (down && down > Date.now()) throw new ServiceUnavailableError();
  if (down) downUntil.delete(key);

  // Two components asking for the same thing should share one round trip
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      downUntil.delete(key);
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
      markDown(key);
      throw error;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

function markDown(key: string) {
  const now = Date.now();
  if (downUntil.size > MAX_ENTRIES) {
    for (const [k, until] of downUntil) if (until <= now) downUntil.delete(k);
  }
  downUntil.set(key, now + UNAVAILABLE_TTL);
}

/** Drop everything, or every key starting with `prefix`. */
export function invalidate(prefix?: string) {
  if (!prefix) {
    store.clear();
    // A write that went through proves the database is answering again.
    downUntil.clear();
    return;
  }
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
  for (const key of downUntil.keys()) if (key.startsWith(prefix)) downUntil.delete(key);
}
