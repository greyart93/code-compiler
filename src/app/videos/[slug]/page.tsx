"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Film,
  ListVideo,
  Loader2,
  Play,
  Radio,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VideoJsPlayer } from "@/components/video-js-player";
import { getJson } from "@/lib/api-cache";
import {
  durationLabel,
  isPlayable,
  totalDuration,
  watchHref,
  type PlaylistSummary,
} from "@/lib/playlist-types";
import { cn } from "@/lib/utils";

export default function PlaylistWatchPage() {
  const { slug } = useParams<{ slug: string }>();
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ playlists: PlaylistSummary[] }>("/api/playlists")
      .then((data) => setPlaylists(data.playlists ?? []))
      .catch(() => setPlaylists([]));
  }, []);

  const playlist = useMemo(
    () => playlists?.find((entry) => entry.slug === slug) ?? null,
    [playlists, slug]
  );

  const playable = useMemo(
    () => (playlist ? playlist.items.filter(isPlayable) : []),
    [playlist]
  );

  // First render: honour ?v= from a shared link, otherwise start at the top.
  useEffect(() => {
    if (playable.length === 0) return;
    setActiveId((current) => {
      if (current && playable.some((item) => item.videoId === current)) return current;
      const fromUrl =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("v");
      return playable.find((item) => item.videoId === fromUrl)?.videoId ?? playable[0].videoId;
    });
  }, [playable]);

  const active =
    playable.find((item) => item.videoId === activeId) ?? playable[0] ?? null;
  const activeIndex = active
    ? playable.findIndex((item) => item.videoId === active.videoId)
    : -1;
  const previous = activeIndex > 0 ? playable[activeIndex - 1] : null;
  const next =
    activeIndex >= 0 && activeIndex < playable.length - 1
      ? playable[activeIndex + 1]
      : null;

  const select = (videoId: string) => {
    setActiveId(videoId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", watchHref(slug, videoId));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (playlists !== null && !playlist) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-24">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
            <p className="mono-label">404 · playlist</p>
            <h1 className="display mt-4 text-[42px]">No such playlist.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              It may have been renamed, or the link is out of date.
            </p>
            <Link href="/videos" className="btn btn-outline mt-6">
              <ArrowLeft className="size-4" /> All playlists
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-16">
          <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading playlist…
          </div>
        </main>
      </div>
    );
  }

  const total = durationLabel(totalDuration(playlist.items));
  const position = activeIndex >= 0 ? activeIndex + 1 : 0;
  // The queue lists every item, playable or not, so count in the playlist's own order.
  const queuePosition = playlist.items.findIndex(
    (item) => item.videoId === active?.videoId
  );

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-5 sm:pt-7">
        <nav className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <Link href="/videos" className="transition-colors hover:text-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" /> Playlists
            </span>
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{playlist.title}</span>
        </nav>

        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-border bg-black">
              {active?.playbackId ? (
                <VideoJsPlayer
                  key={active.videoId}
                  source={{ kind: "mux", playbackId: active.playbackId }}
                  title={active.title ?? playlist.title}
                  poster={`https://image.mux.com/${active.playbackId}/thumbnail.jpg?width=1280`}
                />
              ) : (
                <div className="grid aspect-video place-items-center bg-muted/20">
                  <div className="text-center">
                    <Film className="mx-auto size-6 text-muted-foreground" />
                    <p className="mt-3 text-[13px] font-medium">No playable video yet</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      Upload a clip and add it to this playlist.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <header className="mt-5 border-b border-border pb-5">
              <p className="mono-label">
                {playlist.topic ?? "Playlist"} · {playlist.items.length}{" "}
                {playlist.items.length === 1 ? "video" : "videos"}
                {total ? ` · ${total}` : ""}
              </p>
              <h1 className="display mt-3 text-[clamp(28px,4.4vw,44px)] leading-[1.05]">
                {active?.title ?? playlist.title}
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {position > 0
                  ? `Video ${position} of ${playable.length} · ${playlist.title}`
                  : playlist.title}
              </p>
              {playlist.description && (
                <p className="mt-3 max-w-[70ch] text-[13.5px] leading-relaxed text-muted-foreground">
                  {playlist.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {previous && (
                  <button
                    type="button"
                    onClick={() => select(previous.videoId)}
                    className="btn btn-outline !h-9 !text-[12.5px]"
                  >
                    <ArrowLeft className="size-3.5" /> Previous
                  </button>
                )}
                {next && (
                  <button
                    type="button"
                    onClick={() => select(next.videoId)}
                    className="btn btn-ink !h-9 !text-[12.5px]"
                  >
                    Next <ArrowRight className="size-3.5" />
                  </button>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <Clock className="size-3.5" />
                  {durationLabel(active?.duration ?? null) ?? "Duration pending"}
                </span>
              </div>
            </header>
          </div>

          {/* ── queue ───────────────────────────────────────────── */}
          <aside className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ListVideo className="size-4 text-primary" />
                <p className="text-[13px] font-semibold">Up next</p>
              </div>
              <span className="mono-label !text-[9px]">
                {queuePosition >= 0 ? queuePosition + 1 : 0}/{playlist.items.length}
              </span>
            </div>

            {playlist.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                This playlist is empty.
              </p>
            ) : (
              <ol className="max-h-[70vh] divide-y divide-border overflow-y-auto">
                {playlist.items.map((item, index) => {
                  const playableItem = isPlayable(item);
                  const current = item.videoId === active?.videoId;
                  const thumb = item.playbackId
                    ? `https://image.mux.com/${item.playbackId}/thumbnail.jpg?width=240&time=1`
                    : null;
                  const body = (
                    <>
                      <span className="mono-label w-4 shrink-0 !text-[9px] text-muted-foreground">
                        {current ? (
                          <Radio className="size-3.5 text-primary" />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <span className="relative h-11 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-black">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover opacity-80"
                          />
                        ) : (
                          <span className="grid size-full place-items-center">
                            <Film className="size-3.5 text-white/50" />
                          </span>
                        )}
                        {playableItem && !current && (
                          <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                            <Play className="size-3.5 fill-white text-white" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[12.5px] font-medium",
                            current && "text-primary"
                          )}
                        >
                          {item.title || "Untitled video"}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                          {item.status === "READY"
                            ? (durationLabel(item.duration) ?? "Ready")
                            : item.status === "ERRORED"
                              ? "Failed to process"
                              : "Processing…"}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li key={item.itemId}>
                      {playableItem ? (
                        <button
                          type="button"
                          onClick={() => select(item.videoId)}
                          className={cn(
                            "group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                            current && "bg-primary/[0.06]"
                          )}
                        >
                          {body}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 px-3 py-2.5 opacity-60">
                          {body}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
