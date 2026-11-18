"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The app's own confirm box — replaces window.confirm(), which renders a
 * browser-chrome dialog that ignores the theme and blocks the thread.
 *
 * Mount it once per page and drive it with state:
 *
 *   <ConfirmDialog
 *     open={!!pending}
 *     title="Delete this video?"
 *     description="It is removed from Mux and from every playlist."
 *     tone="danger"
 *     onClose={() => setPending(null)}
 *     onConfirm={remove}
 *   />
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "default",
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  // Escape closes, the page behind does not scroll, and focus starts on Cancel
  // so a stray Enter cannot delete anything.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, close]);

  if (!mounted) return null;

  const danger = tone === "danger";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          className="fixed inset-0 z-[130] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? "confirm-dialog-body" : undefined}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.32 }}
            className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-start gap-3 px-5 pb-1 pt-5">
              <span
                className={cn(
                  "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full",
                  danger
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}
              >
                <AlertTriangle className="size-4" />
              </span>
              <h2
                id="confirm-dialog-title"
                className="min-w-0 flex-1 pt-1.5 text-[15px] font-semibold tracking-[-0.01em]"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close dialog"
                disabled={busy}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            {description && (
              <p
                id="confirm-dialog-body"
                className="px-5 pb-1 pl-[68px] text-[12.5px] leading-relaxed text-muted-foreground"
              >
                {description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-5 py-3.5">
              <button
                ref={cancelRef}
                type="button"
                onClick={close}
                disabled={busy}
                className="btn btn-outline !h-9 !px-4 !text-[12.5px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={cn(
                  "btn !h-9 !px-4 !text-[12.5px] disabled:opacity-60",
                  danger
                    ? "bg-destructive text-white hover:bg-destructive/90"
                    : "btn-ink"
                )}
              >
                {busy && <Loader2 className="size-3.5 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
