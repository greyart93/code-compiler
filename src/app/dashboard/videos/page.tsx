"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Trash2,
  UploadCloud,
  Video as VideoIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VideoPlayer } from "@/components/video-player";
import { VideoUpload } from "@/components/video-upload";
import { useMe } from "@/lib/use-me";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type LibraryVideo = {
  id: string;
  title: string | null;
  status: "WAITING" | "UPLOADING" | "PROCESSING" | "READY" | "ERRORED";
  playbackId: string | null;
  duration: number | null;
  aspectRatio: string | null;
  error: string | null;
  createdAt: string;
};

function durationLabel(seconds: number | null) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function VideoLibraryPage() {
  const router = useRouter();
  const { me, loaded } = useMe();
  const [videos, setVideos] = useState<LibraryVideo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/videos", { cache: "no-store" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setError(
        (payload as { error?: string } | null)?.error ?? "Could not load your video library"
      );
      setVideos([]);
      return;
    }
    setError(null);
    setVideos((payload as { videos: LibraryVideo[] }).videos ?? []);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!me) {
      router.replace(`/login?next=${encodeURIComponent("/dashboard/videos")}`);
      return;
    }
    void load();
  }, [loaded, me, router, load]);

  const copy = async (id: string, value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      toast(message, { variant: "success" });
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      toast("Copy failed", { variant: "error" });
    }
  };

  const remove = async (video: LibraryVideo) => {
    if (!window.confirm(`Delete “${video.title || "this video"}” from Mux?`)) return;
    const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      toast((payload as { error?: string } | null)?.error ?? "Delete failed", {
        variant: "error",
      });
      return;
    }
    setVideos((current) => current?.filter((item) => item.id !== video.id) ?? null);
    toast("Video deleted", { variant: "success" });
  };

  if (!loaded || !me) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap py-16">
          <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your video library…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <div className="mx-auto max-w-[920px]">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Dashboard
          </Link>

          <header className="mt-5 border-b border-border pb-7">
            <p className="mono-label">Video library · Mux</p>
            <h1 className="display mt-3 text-[clamp(36px,6vw,64px)] leading-none">
              Your videos.
            </h1>
            <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-muted-foreground">
              Upload a clip once, then use its playback id in Learn lessons or paste the HLS URL
              into a discuss post. Mux stores the file and streams an adaptive version.
            </p>
          </header>

          <section className="mt-7 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <UploadCloud className="size-4 text-primary" />
              <h2 className="text-[14px] font-semibold">Upload a lesson video</h2>
            </div>
            <VideoUpload
              onUploaded={() => {
                void load();
              }}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Videos are public by default. Processing usually takes a few seconds to a minute
              after the upload finishes.
            </p>
          </section>

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
              {error}
              {error.includes("not enabled") && (
                <span className="mt-1 block text-muted-foreground">
                  Set <code className="font-mono">MUX_UPLOAD_ALLOWLIST</code> to your username,
                  or enable uploads in development.
                </span>
              )}
            </div>
          )}

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Library</h2>
              <span className="mono-label !text-[9px]">{videos?.length ?? 0} videos</span>
            </div>

            {videos === null ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-[12px] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : videos.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center">
                <VideoIcon className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-[13px] font-medium">No videos yet.</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Upload your first lesson above.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {videos.map((video) => {
                  const playback = video.playbackId
                    ? `https://stream.mux.com/${video.playbackId}.m3u8`
                    : null;
                  return (
                    <article
                      key={video.id}
                      className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[190px_minmax(0,1fr)]"
                    >
                      <div className="overflow-hidden rounded-xl border border-border bg-black">
                        {playback ? (
                          <VideoPlayer
                            src={`mux:${video.playbackId}`}
                            title={video.title ?? "Lesson video"}
                          />
                        ) : (
                          <div className="grid aspect-video place-items-center bg-muted/30">
                            {video.status === "ERRORED" ? (
                              <span className="px-3 text-center text-[10px] text-destructive">
                                Processing failed
                              </span>
                            ) : (
                              <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                            {video.title || "Untitled video"}
                          </h3>
                          <span
                            className={cn(
                              "mono-label !text-[8px]",
                              video.status === "READY" && "text-primary",
                              video.status === "ERRORED" && "text-destructive"
                            )}
                          >
                            {video.status.toLowerCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {durationLabel(video.duration) ?? "Duration pending"} ·{" "}
                          {new Date(video.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>

                        {video.error && (
                          <p className="mt-2 text-[11px] text-destructive">{video.error}</p>
                        )}

                        {video.playbackId && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void copy(
                                  `${video.id}-id`,
                                  `mux:${video.playbackId}`,
                                  "Playback id copied"
                                )
                              }
                              className="btn btn-outline !h-8 !px-2.5 !text-[11px]"
                            >
                              {copied === `${video.id}-id` ? (
                                <Check className="size-3.5" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                              Copy mux id
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void copy(
                                  `${video.id}-url`,
                                  `https://stream.mux.com/${video.playbackId}.m3u8`,
                                  "HLS URL copied"
                                )
                              }
                              className="btn btn-outline !h-8 !px-2.5 !text-[11px]"
                            >
                              {copied === `${video.id}-url` ? (
                                <Check className="size-3.5" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                              Copy HLS URL
                            </button>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                          <code className="truncate font-mono text-[10px] text-muted-foreground">
                            {video.playbackId ? `mux:${video.playbackId}` : video.id}
                          </code>
                          <button
                            type="button"
                            onClick={() => void remove(video)}
                            className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
