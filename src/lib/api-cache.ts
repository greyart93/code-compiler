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

/** How long a payload is trusted without a network call */
export const DEFAULT_TTL = 20_000;

/** Last known payload, no freshness check — used to paint before fetching. */
export function peek<T>(url: string): T | undefined {
  return store.get(url)?.data as T | undefined;
}

export function put(url: string, data: unknown) {
  store.set(url, { data, at: Date.now() });
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

export async function getJson<T>(url: string, ttl = DEFAULT_TTL): Promise<T> {
  const hit = store.get(url);
  if (hit && Date.now() - hit.at < ttl) return hit.data as T;

  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const promise = fetch(url, { headers: { accept: "application/json" } })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as T;
      put(url, data);
      return data;
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return promise;
}
