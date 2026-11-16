"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE = "/blog/shiroko.png";

export function ImageDialog({
  open,
  onClose,
  onInsert,
  heading = "Insert an image",
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (image: { src: string; alt: string }) => void;
  heading?: string;
}) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = src.trim();
    if (!/^(https?:\/\/|\/|data:image\/)/i.test(clean)) {
      setError("Use an https:// link, a path starting with /, or a data image.");
      return;
    }
    onInsert({ src: clean, alt: alt.trim() });
    setSrc("");
    setAlt("");
  };

  return createPortal(
    <div
      role="presentation"
      onMouseDown={onClose}
      className="fixed inset-0 z-[95] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
    >
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold">
            <ImageIcon className="size-4 text-primary" /> {heading}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-3 px-4 py-4">
          <label className="grid gap-1.5">
            <span className="mono-label">Image URL</span>
            <input
              autoFocus
              value={src}
              onChange={(e) => {
                setSrc(e.target.value);
                setError(null);
              }}
              placeholder="https://… or /blog/photo.png"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary/60"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="mono-label">Alt text</span>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for screen readers"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary/60"
            />
          </label>

          <button
            type="button"
            onClick={() => setSrc(SAMPLE)}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SAMPLE} alt="" className="size-9 rounded-md object-cover" />
            Use the sample artwork
          </button>

          {src.trim() && /^(https?:\/\/|\/|data:image\/)/i.test(src.trim()) && (
            <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src.trim()}
                alt=""
                className="max-h-40 w-full object-cover"
              />
            </div>
          )}

          {error && <p className="text-[12px] text-destructive">{error}</p>}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Paste a direct image link here. Discuss posts also accept uploaded screenshots.
            Readers can click an image to open the big view.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!src.trim()}>
            Insert image
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
