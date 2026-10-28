"use client";

import { useEffect, useRef, useState } from "react";
import { NextStep, NextStepProvider } from "nextstepjs";
import { EDITOR_TOUR } from "./editor-tour";
import { TourCard } from "./tour-card";

/** remember that this browser has already seen the editor tour */
const SEEN_KEY = "codevit:editor-tour-seen";

/**
 * Keep the library's SVG spotlight rect aligned with the current step's
 * element.
 *
 * The library's internal effect does not reliably call setPointerPosition for
 * selector steps, so its motion-driven rect would collapse to 0×0. Instead of
 * fighting its framer-motion values, we drive the mask rect directly with a
 * requestAnimationFrame loop for the lifetime of the current step — that also
 * keeps the spotlight glued to the element if it moves or resizes.
 */
function useSpotlightFix() {
  const raf = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (stepIndex: number) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;

    const step = EDITOR_TOUR[0]?.steps?.[stepIndex];
    if (!step?.selector || typeof document === "undefined") return;

    const overlay = () => document.querySelector('[data-name="nextstep-overlay"]');
    const mask = () => document.getElementById("smooth-spotlight-mask");

    const pad = step.pointerPadding ?? 8;
    const radius = step.pointerRadius ?? 10;
    let misses = 0;

    const loop = () => {
      const m = mask();
      const ov = overlay();
      const target = step.selector ? document.querySelector(step.selector) : null;
      if (!m || !ov || !target || m.children.length < 2) {
        // a missing overlay means the tour ended — stop instead of spinning;
        // short blips (element remounting) just keep the loop alive
        if (++misses > 30) return;
        raf.current = requestAnimationFrame(loop);
        return;
      }
      misses = 0;
      const spotlight = m.children[1] as SVGElement;
      const or = ov.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      spotlight.setAttribute("x", (r.left - pad - or.left).toFixed(2));
      spotlight.setAttribute("y", (r.top - pad - or.top).toFixed(2));
      spotlight.setAttribute("width", (r.width + pad * 2).toFixed(2));
      spotlight.setAttribute("height", (r.height + pad * 2).toFixed(2));
      spotlight.setAttribute("rx", String(radius));
      spotlight.setAttribute("ry", String(radius));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };
}

/**
 * Mounts NextStep once for the whole app so any page can start a tour through
 * the `useNextStep` hook.
 *
 * The provider itself is plain React state and always renders, because
 * `useNextStep` throws when it is missing. The overlay half waits for
 * hydration, since it measures the DOM to position its spotlight.
 *
 * We pass our own themed card — the library default is a hardcoded white card
 * that clashes with CodeVit's dark theme.
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const positionSpotlight = useSpotlightFix();

  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — the tour just runs again next time */
    }
  };

  return (
    <NextStepProvider>
      {hydrated ? (
        <NextStep
          steps={EDITOR_TOUR}
          cardComponent={TourCard}
          shadowRgb="0, 0, 0"
          shadowOpacity="0.7"
          // the app header is sticky at 56px; sit above it but below modals
          overlayZIndex={60}
          clickThroughOverlay={false}
          onStepChange={(step) => positionSpotlight(step)}
          onComplete={markSeen}
          onSkip={markSeen}
        >
          {children}
        </NextStep>
      ) : (
        children
      )}
    </NextStepProvider>
  );
}

/** has this browser already been shown the editor tour? */
export function hasSeenEditorTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** let the user replay the tour later */
export function resetEditorTour(): void {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* ignore */
  }
}
