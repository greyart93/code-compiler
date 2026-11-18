"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Film, Layers, Play, UploadCloud } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Empty } from "@/components/ui/primitives";
import { getJson } from "@/lib/api-cache";
import {
  durationLabel,
  totalDuration,
  watchHref,
  type PlaylistSummary,
} from "@/lib/playlist-types";

export default function VideoPlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);

  useEffect(() => {
    getJson<{ playlists: PlaylistSummary[] }>("/api/playlists")
      .then((data) => setPlaylists(data.playlists ?? []))
      .catch(() => setPlaylists([]));
  }, []);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">Video library · watched start to finish</p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Watch the tracks.</h1>
              <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                One playlist per topic. Press play and the next lesson is already queued — no
                hunting through a grid, no ads, no paywall.
              </p>
            </div>
            <Link href="/dashboard/videos" className="btn btn-outline">
              <UploadCloud className="size-4" /> Manage videos
            </Link>
          </div>
        </header>

        {playlists === null ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[260px] animate-pulse rounded-2xl border border-border bg-muted/40"
              />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <Empty
            icon={Film}
            title="No playlists yet"
            body="A playlist groups lesson videos by topic, in the order they should be watched."
            className="mt-10"
            action={
              <Link href="/dashboard/videos" className="btn btn-ink">
                <UploadCloud className="size-4" /> Upload a video
              </Link>
            }
          />
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {playlists.map((playlist, index) => {
              const first = playlist.items.find((item) => item.playbackId);
              const cover = first?.playbackId
                ? `https://image.mux.com/${first.playbackId}/thumbnail.jpg?width=720&time=1`
                : null;
              const total = durationLabel(totalDuration(playlist.items));
              return (
                <Link
                  key={playlist.id}
                  href={watchHref(playlist.slug)}
                  className="card-surface card-hover group flex flex-col overflow-hidden"
                >
                  <div className="relative aspect-video overflow-hidden border-b border-border bg-[#0b0d12]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                      />
                    ) : (
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#24304b,#0b0d12_70%)]" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition-transform duration-300 group-hover:scale-110">
                      <Play className="ml-0.5 size-4 fill-current" />
                    </span>
                    <span className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2 text-white">
                      <span className="mono-label !text-[9px] !text-white/70">
                        {String(index + 1).padStart(2, "0")} · playlist
                      </span>
                      {total && (
                        <span className="rounded-full bg-black/50 px-2 py-0.5 font-mono text-[10px]">
                          {total}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2">
                      <Layers className="size-3.5 text-muted-foreground" />
                      <span className="mono-label !text-[9px]">
                        {playlist.topic ?? "General"} · {playlist.items.length}{" "}
                        {playlist.items.length === 1 ? "video" : "videos"}
                      </span>
                    </div>
                    <h2 className="mt-2.5 text-[19px] font-semibold leading-snug tracking-[-0.02em] transition-colors group-hover:text-primary">
                      {playlist.title}
                    </h2>
                    {playlist.description && (
                      <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                        {playlist.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between border-t border-border pt-3.5 text-[12.5px] font-medium">
                      <span className="text-muted-foreground">
                        {first?.title ?? "Nothing uploaded yet"}
                      </span>
                      <ArrowUpRight className="size-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {playlists !== null && playlists.length > 0 && (
          <p className="mt-8 text-[11.5px] text-muted-foreground">
            Open a playlist and pick any lesson from the queue on the right — the next one is one
            click away.
          </p>
        )}
      </main>
    </div>
  );
}
