"use client";

import { useEffect, useRef } from "react";

/**
 * Ctrl+Enter (⌘+Enter on macOS) runs the given handler — the shortcut every code
 * editor has. Uses a ref for the handler so the listener attaches only once.
 */
export function useRunShortcut(handler: () => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        // stop the editor/textarea from also inserting a newline
        e.preventDefault();
        e.stopPropagation();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}