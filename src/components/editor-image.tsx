"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadCloudinaryImage } from "@/lib/upload-image";

function isImageSource(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function ImageDialog({
  open,
  onClose,
  onInsert,
  heading = "Insert an image",
  showAlt = true,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (image: { src: string; alt: string }) => void;
  heading?: string;
  showAlt?: boolean;
}) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (mode === "upload") return;
    const clean = src.trim();
    if (!isImageSource(clean)) {
      setError("Use an https:// link or a path starting with /.");
      return;
    }
    onInsert({ src: clean, alt: alt.trim() });
    setSrc("");
    setAlt("");
  };

  const upload = async (file: File | undefined | null) => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCloudinaryImage(file);
      onInsert({ src: url, alt: alt.trim() });
      setSrc("");
      setAlt("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {(
              [
                ["upload", "Upload"],
                ["url", "URL"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={
                  "h-7 rounded-md text-[12px] font-medium transition-colors " +
                  (mode === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {label}
              </button>
            ))}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => void upload(event.target.files?.[0])}
          />

          {mode === "upload" ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40 disabled:opacity-60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                {uploading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <UploadCloud className="size-5" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold">
                  {uploading ? "Uploading…" : "Choose an image"}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  PNG, JPG, WebP or GIF · compressed and stored on Cloudinary
                </span>
              </span>
            </button>
          ) : (
            <>
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

              {src.trim() && isImageSource(src.trim()) && (
                <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src.trim()} alt="" className="max-h-40 w-full object-cover" />
                </div>
              )}
            </>
          )}

          {showAlt && (
            <label className="grid gap-1.5">
              <span className="mono-label">Alt text</span>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image for screen readers"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary/60"
              />
            </label>
          )}

          {error && <p className="text-[12px] text-destructive">{error}</p>}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {mode === "upload"
              ? "Images are compressed in your browser, then served from Cloudinary's CDN."
              : "Paste a direct image link. Paths starting with / are served by CodeVit."}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {mode === "url" && (
            <Button type="submit" size="sm" disabled={!src.trim()}>
              Insert image
            </Button>
          )}
        </div>
      </form>
    </div>,
    document.body
  );
}
