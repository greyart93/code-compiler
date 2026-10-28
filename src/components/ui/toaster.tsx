"use client";

import { create } from "zustand";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastVariant = "default" | "success" | "error";

export type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Optional link rendered as a small button inside the toast (e.g. "Sign in") */
  actionLabel?: string;
  actionHref?: string;
};

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts.slice(-4), { ...t, id }] }));
    setTimeout(() => get().dismiss(id), 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Fire a toast from anywhere: toast("Saved!", { variant: "success" }) */
export function toast(
  title: string,
  opts?: { description?: string; variant?: ToastVariant; actionLabel?: string; actionHref?: string }
) {
  useToastStore.getState().push({ title, ...opts });
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="size-4 text-primary" />,
  success: <CheckCircle2 className="size-4 text-green-500" />,
  error: <XCircle className="size-4 text-destructive" />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,340px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 32, transition: { duration: 0.15 } }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            className="pointer-events-auto rounded-lg border bg-popover p-3 shadow-lg"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{ICONS[t.variant ?? "default"]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                )}
                {t.actionLabel && t.actionHref && (
                  <a
                    href={t.actionHref}
                    className="mt-1.5 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t.actionLabel}
                  </a>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
