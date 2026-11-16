export type CachedTutorial = {
  id: string;
  title: string;
  content: string;
  language: string | null;
  coverImage: string | null;
  createdAt: string;
  user: { id: string; username: string; name: string | null; image?: string | null };
};

/**
 * Kept when a card is hovered/clicked so the detail page can render (cover
 * included) in the same commit as the navigation, which is what React's
 * `<ViewTransition>` needs to pair the card cover with the article hero.
 *
 * Only the client bundle uses this; it is deliberately a module-level map, not
 * persistent storage.
 */
const cache = new Map<string, CachedTutorial>();

export type CachedTutorialSummary = {
  id: string;
  title: string;
  language: string | null;
  coverImage: string | null;
  createdAt: string;
  excerpt: string;
  minutes: number;
  user: { username: string; name: string | null };
};

/**
 * The index list is cached too so navigating back to /blog renders the featured
 * card (and its cover) in the same commit as the back navigation. Without it
 * the page mounts with `null` data and the cover arrives after the transition,
 * leaving nothing for React to morph into.
 */
let listCache: CachedTutorialSummary[] | null = null;

export function cacheTutorialList(list: CachedTutorialSummary[] | null | undefined) {
  if (list) listCache = list;
}

export function getCachedTutorialList() {
  return listCache;
}

export function cacheTutorial(tutorial: CachedTutorial | null | undefined) {
  if (!tutorial?.id) return;
  cache.set(tutorial.id, tutorial);
}

export function getCachedTutorial(id: string | undefined) {
  return id ? cache.get(id) : undefined;
}
