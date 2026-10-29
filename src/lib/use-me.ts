"use client";

import { useEffect, useState } from "react";

/**
 * Shared /api/auth/me hook with a module-level cache + 30s TTL.
 *
 * Every page used to refetch the session on mount (and the header refetched on
 * every pathname change), which made the nav flicker between logged-in/logged-out
 * while navigating. The cache keeps the session stable across routes; call
 * `refresh()` after login/logout to force a clean refetch.
 */

export type Me = {
  id: string;
  username: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt?: string | null;
};

const TTL = 30_000;

let cache: { me: Me | null; at: number } | null = null;
let inflight: Promise<Me | null> | null = null;

export function invalidateMe() {
  cache = null;
}

async function fetchMe(): Promise<Me | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.me;
  if (!inflight) {
    inflight = fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const me = (d?.user ?? null) as Me | null;
        cache = { me, at: Date.now() };
        inflight = null;
        return me;
      })
      .catch(() => {
        inflight = null;
        invalidateMe();
        return null;
      });
  }
  return inflight;
}

export function useMe(): {
  me: Me | null;
  loaded: boolean;
  refresh: () => void;
} {
  const [me, setMe] = useState<Me | null>(cache ? cache.me : null);
  const [loaded, setLoaded] = useState(!!cache);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchMe().then((m) => {
      if (!alive) return;
      setMe(m);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  return { me, loaded, refresh: () => { invalidateMe(); setVersion((v) => v + 1); } };
}
