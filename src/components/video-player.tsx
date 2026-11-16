"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Film, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoJsPlayer } from "@/components/video-js-player";

export type VideoSource =
  | { kind: "mux"; playbackId: string }
  | { kind: "youtube"; id: string; url: string }
  | { kind: "vimeo"; id: string; url: string }
  | { kind: "file"; url: string };

/** Recognise Mux playback ids/URLs, YouTube, Vimeo and direct video files. */
export function parseVideoUrl(raw: string): VideoSource | null {
  const value = raw.trim();
  const muxId = /^mux:([A-Za-z0-9]+)$/.exec(value);
  if (muxId) return { kind: "mux", playbackId: muxId[1] };

  // Videos uploaded into the app's own public folder, e.g. /videos/lesson.mp4
  if (
    value.startsWith("/") &&
    /\.(mp4|m4v|webm|ogv|ogg|mov)(?:$|[?#])/i.test(value)
  ) {
    return { kind: "file", url: value };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();

  if (host === "stream.mux.com" || host === "player.mux.com") {
    const id = url.pathname.split("/").filter(Boolean)[0]?.replace(/\.m3u8$/i, "");
    if (id && /^[A-Za-z0-9]+$/.test(id)) return { kind: "mux", playbackId: id };
  }

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? { kind: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` } : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id =
      url.searchParams.get("v") ??
      (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live"
        ? parts[1]
        : undefined);
    return id ? { kind: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` } : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id && /^\d+$/.test(id)
      ? { kind: "vimeo", id, url: `https://vimeo.com/${id}` }
      : null;
  }

  if (/\.(mp4|m4v|webm|ogv|ogg|mov)(?:$|[?#])/i.test(url.pathname + url.search)) {
    return { kind: "file", url: url.toString() };
  }

  return null;
}

export function isVideoUrl(value: string) {
  return parseVideoUrl(value) !== null;
}

export function VideoPlayer({
  src,
  title,
  className,
}: {
  src: string;
  title?: string;
  className?: string;
}) {
  const source = parseVideoUrl(src);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!source) return null;

  const thumb =
    source.kind === "youtube"
      ? `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`
      : source.kind === "mux"
        ? `https://image.mux.com/${source.playbackId}/thumbnail.jpg?width=960`
      : null;
  const provider =
    source.kind === "mux"
      ? "Mux"
      : source.kind === "youtube"
        ? "YouTube"
        : source.kind === "vimeo"
          ? "Vimeo"
          : "Video";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title ? `Play video: ${title}` : "Play video"}
        className={cn(
          "group relative block aspect-video w-full overflow-hidden rounded-xl border border-border bg-[#0b0d12] text-left",
          className
        )}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          />
        ) : (
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#24304b,#0b0d12_70%)]" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
        <span className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-3 text-white">
          <span className="min-w-0">
            <span className="mono-label block !text-[9px] !text-white/55">{provider}</span>
            <span className="mt-0.5 block truncate text-[13px] font-semibold">
              {title || "Watch the video"}
            </span>
          </span>
          <Film className="size-4 shrink-0 text-white/60" />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title || "Video player"}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
            className="fixed inset-0 z-[125] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close video"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white transition-colors hover:bg-black/70"
            >
              <X className="size-4" />
            </button>
            <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl">
              <VideoJsPlayer
                source={source}
                title={title}
                poster={thumb ?? undefined}
                className="max-h-[82vh]"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
