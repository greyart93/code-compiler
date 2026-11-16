"use client";

import { cacheTutorial, getCachedTutorial } from "./blog-cache";
import {
  failRouteProgress,
  startRouteProgress,
} from "./route-progress";

const pending = new Map<string, Promise<void>>();
let navigating = false;

/** Load and decode an image so the article hero can paint on its first frame. */
export function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const image = new window.Image();
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const done = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve();
    };

    const decode = () => {
      void image
        .decode()
        .catch(() => {})
        .then(done);
    };

    image.decoding = "async";
    image.onload = decode;
    image.onerror = done;
    timer = setTimeout(done, 6000);
    image.src = src;

    if (image.complete && image.naturalWidth > 0) decode();
  });
}

async function fetchTutorial(id: string) {
  try {
    const res = await fetch(`/api/tutorials?id=${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.tutorial) cacheTutorial(data.tutorial);
  } catch {
    // preloading is best effort; the detail page will fetch on its own
  }
}

async function prepare(id: string) {
  let tutorial = getCachedTutorial(id);
  if (!tutorial) {
    await fetchTutorial(id);
    tutorial = getCachedTutorial(id);
  }
  if (tutorial?.coverImage) await loadImage(tutorial.coverImage);
}

function prepareBlogPost(id: string) {
  const inFlight = pending.get(id);
  if (inFlight) return inFlight;

  const promise = prepare(id).finally(() => pending.delete(id));
  pending.set(id, promise);
  return promise;
}

/** Warm a post (and its cover) when a card is hovered or focused. */
export function prefetchBlogPost(id: string) {
  void prepareBlogPost(id);
}

/**
 * Wait for the essay data and cover to be ready, then navigate. The global
 * progress bar stays up until the detail page reports its hero is painted, so
 * the cover morph never starts with a blank image.
 */
export async function openBlogPost(
  id: string,
  href: string,
  navigate: (href: string) => void
) {
  if (navigating) return;
  navigating = true;
  startRouteProgress();

  try {
    await prepareBlogPost(id);
    navigate(href);
  } catch {
    failRouteProgress();
    navigate(href);
  } finally {
    setTimeout(() => {
      navigating = false;
    }, 1000);
  }
}
