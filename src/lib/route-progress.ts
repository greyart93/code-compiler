"use client";

export type RouteProgressState = {
  active: boolean;
  value: number;
};

const IDLE: RouteProgressState = { active: false, value: 0 };

let state: RouteProgressState = IDLE;
const listeners = new Set<() => void>();

let startedAt = 0;
let trickleTimer: ReturnType<typeof setInterval> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function publish(next: RouteProgressState) {
  state = next;
  for (const listener of listeners) listener();
}

function clearTimers() {
  if (trickleTimer) clearInterval(trickleTimer);
  if (finishTimer) clearTimeout(finishTimer);
  if (hideTimer) clearTimeout(hideTimer);
  trickleTimer = null;
  finishTimer = null;
  hideTimer = null;
}

export function subscribeRouteProgress(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRouteProgress() {
  return state;
}

export function getRouteProgressServer(): RouteProgressState {
  return IDLE;
}

/** Begin a page-opening bar. Kept above zero so it reads as a loading bar. */
export function startRouteProgress() {
  clearTimers();
  startedAt = Date.now();
  publish({ active: true, value: 8 });

  trickleTimer = setInterval(() => {
    if (!state.active || state.value >= 90) return;
    const step = Math.max(0.4, (90 - state.value) * 0.07);
    publish({ active: true, value: Math.min(90, state.value + step) });
  }, 120);
}

/**
 * Complete the bar. Short loads still show it long enough to be noticed, so a
 * cached cover does not make it flash in and out in a single frame.
 */
export function finishRouteProgress() {
  if (!state.active || finishTimer || hideTimer) return;

  if (trickleTimer) {
    clearInterval(trickleTimer);
    trickleTimer = null;
  }

  const remaining = Math.max(0, 420 - (Date.now() - startedAt));
  finishTimer = setTimeout(() => {
    finishTimer = null;
    publish({ active: true, value: 100 });
    hideTimer = setTimeout(() => {
      hideTimer = null;
      publish(IDLE);
    }, 240);
  }, remaining);
}

/** Clear immediately when preparing the page failed or was abandoned. */
export function failRouteProgress() {
  clearTimers();
  publish(IDLE);
}
