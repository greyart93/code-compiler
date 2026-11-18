"use client";

/**
 * Small client-side cache for JSON endpoints.
 *
 * Pages are client components that fetch on mount, so every navigation used to
 * paint a spinner and wait for a round trip (the database is ~330ms away, and a
 * page usually needs two or three endpoints). This keeps the last payload per
 * URL in memory: revisiting a page renders the data it already had and only
 * revalidates when the entry is older than `ttl`.
 */

type Entry = { data: unknown; at: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Keys carry ids (`/api/snippets?id=…`, `/api/users/<name>`), so a long session
 * would otherwise keep every payload it ever saw. Same bound as the server
 * cache: evict expired entries first, then the oldest insertions.
 */
const MAX_ENTRIES = 500;

/** How long a payload is trusted without a network call */
export const DEFAULT_TTL = 20_000;

/**
 * A read must never hold a page hostage: when the database is unreachable the
 * route sits on its connection timeout, and without this the UI looks stuck.
 */
export const DEFAULT_TIMEOUT = 10_000;

/** Last known payload, no freshness check — used to paint before fetching. */
export function peek<T>(url: string): T | undefined {
  return store.get(url)?.data as T | undefined;
}

export function put(url: string, data: unknown) {
  store.set(url, { data, at: Date.now() });
  if (store.size > MAX_ENTRIES) evict();
}

/** Map iterates in insertion order, so the front of it is the oldest entry. */
function evict() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.at >= DEFAULT_TTL) store.delete(key);
  }
  for (const key of store.keys()) {
    if (store.size <= MAX_ENTRIES) break;
    store.delete(key);
  }
}

/** Forget cached payloads, e.g. after a mutation. Pass a URL prefix to narrow it. */
export function drop(prefix = "") {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}

/** Start a request early (hover/focus) so the click finds it in memory. */
export function prefetch(url: string) {
  void getJson(url).catch(() => {});
}

export async function getJson<T>(
  url: string,
  ttl = DEFAULT_TTL,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<T> {
  const hit = store.get(url);
  if (hit && Date.now() - hit.at < ttl) return hit.data as T;

  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const promise = fetch(url, {
    headers: { accept: "application/json" },
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as T;
      put(url, data);
      return data;
    })
    .catch((error) => {
      if (controller.signal.aborted) {
        throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
      }
      throw error;
    })
    .finally(() => {
      clearTimeout(timer);
      inflight.delete(url);
    });

  inflight.set(url, promise);
  return promise;
}
