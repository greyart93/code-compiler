"use client";

import { useEffect, useState } from "react";
import { useNextStep } from "nextstepjs";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasSeenEditorTour } from "./tour-provider";

const TOUR = "blogEditor";

/**
 * "Take the tour" entry point. First-time visitors get the tour automatically
 * once the editor has painted; everyone else can replay it from this button.
 */
export function EditorTourButton() {
  const { startNextStep, isNextStepVisible } = useNextStep();
  const [checked, setChecked] = useState(false);
  const [btnMounted, setBtnMounted] = useState(false);
  useEffect(() => setBtnMounted(true), []);

  // Note: no ref guard here. React StrictMode runs effects twice in dev, so a
  // "did it already run" ref would swallow the second run — and because the
  // cleanup cancels the pending timeout, the auto-start would never happen.
  // `checked` is enough: it flips after the timer fires, and the cleanup simply
  // reschedules on the StrictMode remount.
  useEffect(() => {
    if (checked || !btnMounted) return;
    // let the editor mount so the first spotlight can find its target
    const t = setTimeout(() => {
      if (!hasSeenEditorTour()) startNextStep(TOUR);
      setChecked(true);
    }, 900);
    return () => clearTimeout(t);
  }, [checked, btnMounted, startNextStep]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={() => {
        // replaying resets the "seen" flag so it auto-appears next visit too
        try {
  localStorage.removeItem("codevit:editor-tour-seen");
        } catch {
          /* ignore */
        }
        startNextStep(TOUR);
      }}
      disabled={isNextStepVisible}
    >
      <HelpCircle className="size-4" />
      Take the tour
    </Button>
  );
}