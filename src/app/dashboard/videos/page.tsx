"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VideoPlayer } from "@/components/video-player";
import { VideoUpload } from "@/components/video-upload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMe } from "@/lib/use-me";
import { toast } from "@/components/ui/toaster";
import { drop } from "@/lib/api-cache";
import { durationLabel, type PlaylistSummary } from "@/lib/playlist-types";
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

type PendingDelete =
  | { kind: "video"; video: LibraryVideo }
  | { kind: "playlist"; playlist: PlaylistSummary };

export default function VideoLibraryPage() {
  const router = useRouter();
  const { me, loaded } = useMe();
  const [videos, setVideos] = useState<LibraryVideo[] | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  const loadPlaylists = useCallback(async () => {
    const res = await fetch("/api/playlists", { cache: "no-store" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setPlaylists([]);
      return;
    }
    setPlaylists((payload as { playlists: PlaylistSummary[] }).playlists ?? []);
  }, []);

  /** Mutations drop the shared client cache so /videos does not serve a stale playlist. */
  const refreshPlaylists = useCallback(async () => {
    drop("/api/playlists");
    await refreshPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (!loaded) return;
    if (!me) {
      router.replace(`/login?next=${encodeURIComponent("/dashboard/videos")}`);
      return;
    }
    void load();
    void loadPlaylists();
  }, [loaded, me, router, load, loadPlaylists]);

  const mine = useMemo(() => playlists?.filter((p) => p.mine) ?? [], [playlists]);

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

  const removeVideo = async (video: LibraryVideo) => {
    const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      toast((payload as { error?: string } | null)?.error ?? "Delete failed", {
        variant: "error",
      });
      return;
    }
    setVideos((current) => current?.filter((item) => item.id !== video.id) ?? null);
    drop("/api/videos/quota");
    void loadPlaylists();
    toast("Video deleted", { variant: "success" });
  };

  const createPlaylist = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, topic: newTopic.trim() || undefined }),
    });
    const payload = await res.json().catch(() => null);
    setCreating(false);
    if (!res.ok) {
      toast((payload as { error?: string } | null)?.error ?? "Could not create playlist", {
        variant: "error",
      });
      return;
    }
    setNewTitle("");
    setNewTopic("");
    await refreshPlaylists();
    toast("Playlist created", { variant: "success" });
  };

  const startEdit = (playlist: PlaylistSummary) => {
    setEditingId(playlist.id);
    setEditTitle(playlist.title);
    setEditTopic(playlist.topic ?? "");
    setEditDescription(playlist.description ?? "");
  };

  const saveEdit = async (event: React.FormEvent, playlistId: string) => {
    event.preventDefault();
    const title = editTitle.trim();
    if (!title || savingEdit) return;
    setSavingEdit(true);
    const res = await fetch(`/api/playlists/${playlistId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        topic: editTopic.trim(),
        description: editDescription.trim(),
      }),
    });
    const payload = await res.json().catch(() => null);
    setSavingEdit(false);
    if (!res.ok) {
      toast((payload as { error?: string } | null)?.error ?? "Could not save the playlist", {
        variant: "error",
      });
      return;
    }
    setEditingId(null);
    await refreshPlaylists();
    toast("Playlist updated", { variant: "success" });
  };

  const deletePlaylist = async (playlist: PlaylistSummary) => {
    const res = await fetch(`/api/playlists/${playlist.id}`, { method: "DELETE" });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      toast((payload as { error?: string } | null)?.error ?? "Delete failed", {
        variant: "error",
      });
      return;
    }
    await refreshPlaylists();
    toast("Playlist deleted", { variant: "success" });
  };

  const addToPlaylist = async (playlistId: string, videoId: string) => {
    const res = await fetch(`/api/playlists/${playlistId}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      toast((payload as { error?: string } | null)?.error ?? "Could not add the video", {
        variant: "error",
      });
      return;
    }
    await refreshPlaylists();
    toast("Added to playlist", { variant: "success" });
  };

  const removeItem = async (playlistId: string, itemId: string) => {
    const res = await fetch(
      `/api/playlists/${playlistId}/items?itemId=${encodeURIComponent(itemId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast("Could not remove the video", { variant: "error" });
      return;
    }
    await refreshPlaylists();
  };

  const moveItem = async (playlist: PlaylistSummary, index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= playlist.items.length) return;
    const order = playlist.items.map((item) => item.itemId);
    [order[index], order[target]] = [order[target], order[index]];
    const res = await fetch(`/api/playlists/${playlist.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (!res.ok) {
      toast("Could not reorder the playlist", { variant: "error" });
      return;
    }
    await refreshPlaylists();
  };

  const confirmDelete = async () => {
    if (!pending || deleting) return;
    setDeleting(true);
    try {
      if (pending.kind === "video") await removeVideo(pending.video);
      else await deletePlaylist(pending.playlist);
    } finally {
      setDeleting(false);
      setPending(null);
    }
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
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Dashboard
            </Link>
            <Link
              href="/videos"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View public playlists <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <header className="mt-5 border-b border-border pb-7">
            <p className="mono-label">Video library · Mux</p>
            <h1 className="display mt-3 text-[clamp(36px,6vw,64px)] leading-none">
              Your videos.
            </h1>
            <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-muted-foreground">
              Upload a clip once, group it into a playlist, then watch the playlist straight
              through. Mux stores the file and streams an adaptive version.
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
              after the upload finishes. One video per lesson, up to 12 hours (Mux&apos;s
              per-asset limit); longer recordings need splitting.
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

          {/* ── playlists ─────────────────────────────────────────────── */}
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h2 className="text-[14px] font-semibold">Playlists</h2>
              </div>
              <span className="mono-label !text-[9px]">{mine.length} playlists</span>
            </div>

            <form onSubmit={createPlaylist} className="mt-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Playlist title — e.g. JavaScript from zero"
                  aria-label="Playlist title"
                  maxLength={90}
                  className="h-9 min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 text-[12.5px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
                />
                <input
                  value={newTopic}
                  onChange={(event) => setNewTopic(event.target.value)}
                  placeholder="Topic — JS, React…"
                  aria-label="Playlist topic"
                  maxLength={40}
                  className="h-9 w-full rounded-full border border-border bg-background px-3.5 text-[12.5px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30 sm:w-[170px]"
                />
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="btn btn-ink !h-9 shrink-0 !text-[12.5px] disabled:opacity-50"
                >
                  {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Create
                </button>
              </div>
              <p className="mt-2.5 text-[11px] text-muted-foreground">
                A 12-hour lesson per topic works fine — a playlist can hold one long video or
                dozens of short ones, in the order you set.
              </p>
            </form>

            {playlists === null ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-[12px] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading playlists…
              </div>
            ) : mine.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-border p-6 text-center">
                <Layers className="mx-auto size-5 text-muted-foreground" />
                <p className="mt-2 text-[12.5px] font-medium">No playlists yet.</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Create one per topic, then add your videos to it.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {mine.map((playlist) => (
                  <article
                    key={playlist.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[14px] font-semibold">{playlist.title}</h3>
                          {playlist.topic && (
                            <span className="mono-label !text-[8px]">{playlist.topic}</span>
                          )}
                          <span className="mono-label !text-[8px]">
                            {playlist.items.length} videos
                          </span>
                        </div>
                        <Link
                          href={`/videos/${playlist.slug}`}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
                        >
                          /videos/{playlist.slug} <ArrowUpRight className="size-3" />
                        </Link>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            editingId === playlist.id ? setEditingId(null) : startEdit(playlist)
                          }
                          aria-expanded={editingId === playlist.id}
                          aria-label={`Edit ${playlist.title}`}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                          {editingId === playlist.id ? "Close" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPending({ kind: "playlist", playlist })}
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </button>
                      </div>
                    </div>

                    {editingId === playlist.id && (
                      <form
                        onSubmit={(event) => void saveEdit(event, playlist.id)}
                        className="grid gap-2 border-b border-border bg-muted/20 px-4 py-3.5"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
                            aria-label="Playlist title"
                            maxLength={90}
                            autoFocus
                            className="h-9 min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 text-[12.5px] outline-none transition-colors focus:border-foreground/30"
                          />
                          <input
                            value={editTopic}
                            onChange={(event) => setEditTopic(event.target.value)}
                            placeholder="Topic"
                            aria-label="Playlist topic"
                            maxLength={40}
                            className="h-9 w-full rounded-full border border-border bg-background px-3.5 text-[12.5px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30 sm:w-[170px]"
                          />
                        </div>
                        <textarea
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                          placeholder="Short description shown on the playlist page"
                          aria-label="Playlist description"
                          maxLength={300}
                          rows={2}
                          className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-2 text-[12.5px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] text-muted-foreground">
                            {editDescription.length}/300 · the URL slug stays the same
                          </span>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={savingEdit}
                              className="btn btn-outline !h-8 !px-3 !text-[11.5px] disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingEdit || !editTitle.trim()}
                              className="btn btn-ink !h-8 !px-3 !text-[11.5px] disabled:opacity-50"
                            >
                              {savingEdit ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              Save
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {playlist.items.length === 0 ? (
                      <p className="px-4 py-4 text-[11.5px] text-muted-foreground">
                        Empty — pick this playlist under a video below to add it.
                      </p>
                    ) : (
                      <ol className="divide-y divide-border">
                        {playlist.items.map((item, index) => (
                          <li key={item.itemId} className="flex items-center gap-2.5 px-4 py-2.5">
                            <span className="mono-label w-5 shrink-0 !text-[9px] text-muted-foreground">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12.5px] font-medium">
                                {item.title || "Untitled video"}
                              </p>
                              <p className="text-[10.5px] text-muted-foreground">
                                {item.status === "READY"
                                  ? (durationLabel(item.duration) ?? "Ready")
                                  : item.status.toLowerCase()}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => void moveItem(playlist, index, -1)}
                                disabled={index === 0}
                                aria-label="Move up"
                                className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                              >
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void moveItem(playlist, index, 1)}
                                disabled={index === playlist.items.length - 1}
                                aria-label="Move down"
                                className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                              >
                                <ArrowDown className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeItem(playlist.id, item.itemId)}
                                aria-label="Remove from playlist"
                                className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ── library ───────────────────────────────────────────────── */}
          <section className="mt-7">
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
                  const addable = mine.filter(
                    (playlist) => !playlist.items.some((item) => item.videoId === video.id)
                  );
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
                          <div className="mt-3 flex flex-wrap items-center gap-2">
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

                            {addable.length > 0 && (
                              <select
                                value=""
                                onChange={(event) => {
                                  if (event.target.value) {
                                    void addToPlaylist(event.target.value, video.id);
                                  }
                                }}
                                aria-label={`Add ${video.title ?? "video"} to a playlist`}
                                className="h-8 rounded-full border border-border bg-card px-2.5 text-[11px] text-muted-foreground outline-none transition-colors hover:border-foreground/30 focus:border-foreground/30"
                              >
                                <option value="">Add to playlist…</option>
                                {addable.map((playlist) => (
                                  <option key={playlist.id} value={playlist.id}>
                                    {playlist.title}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                          <code className="truncate font-mono text-[10px] text-muted-foreground">
                            {video.playbackId ? `mux:${video.playbackId}` : video.id}
                          </code>
                          <button
                            type="button"
                            onClick={() => setPending({ kind: "video", video })}
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

      <ConfirmDialog
        open={pending !== null}
        tone="danger"
        busy={deleting}
        title={
          pending?.kind === "playlist"
            ? `Delete “${pending.playlist.title}”?`
            : "Delete this video from Mux?"
        }
        description={
          pending?.kind === "playlist"
            ? "The playlist is removed. Its videos stay in your library and in any other playlist."
            : pending?.kind === "video"
              ? `“${pending.video.title || "This video"}” is removed from Mux and from every playlist that uses it. This cannot be undone.`
              : undefined
        }
        confirmLabel={pending?.kind === "playlist" ? "Delete playlist" : "Delete video"}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          if (!deleting) setPending(null);
        }}
      />
    </div>
  );
}
