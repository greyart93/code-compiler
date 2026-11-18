"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { drop } from "@/lib/api-cache";

const MuxUploader = dynamic(() => import("@mux/mux-uploader-react"), {
  ssr: false,
});

/**
 * Mux errors any single asset longer than 12 hours, and only after the whole
 * file has been uploaded, so the length is checked here on the local file.
 */
const MAX_ASSET_SECONDS = 12 * 60 * 60;
/** Flag near-limit lessons before they hit the wall above. */
const SOFT_LIMIT_SECONDS = 11 * 60 * 60;

type VideoResult = {
  id: string;
  playbackId: string;
  title: string | null;
  status: string;
};

type UploadResponse = {
  videoId: string;
  uploadUrl: string;
};

type Phase = "idle" | "checking" | "starting" | "uploading" | "processing" | "ready";

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string") return error;
  }
  return fallback;
}

function lengthLabel(seconds: number) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes ? `${hours} h ${minutes} m` : `${hours} h`;
}

/**
 * Read a file's duration without uploading it. Resolves null when the browser
 * cannot tell (unknown container, corrupt header), which callers treat as a
 * warning rather than a rejection.
 */
function probeVideoSeconds(file: File) {
  return new Promise<number | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    let timer = 0;

    const finish = (seconds: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(seconds);
    };

    const read = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        finish(video.duration);
        return true;
      }
      return false;
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", () => {
      if (read()) return;
      // WebM and some streamed MP4s report Infinity until the timeline is seeked.
      video.currentTime = 1e101;
    });
    video.addEventListener("durationchange", read);
    video.addEventListener("timeupdate", read);
    video.addEventListener("error", () => finish(null));
    timer = window.setTimeout(() => finish(null), 12_000);
    video.src = url;
  });
}

export function VideoUpload({
  title,
  onUploaded,
  compact = false,
}: {
  title?: string;
  onUploaded: (video: VideoResult) => void;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploaderRef = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const poll = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/videos/${id}`, { cache: "no-store" });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(errorMessage(payload, "Could not check the video"));

      const video = (payload as { video?: VideoResult } | null)?.video;
      if (!video) throw new Error("Video not found");
      if (video.status === "READY" && video.playbackId) {
        if (doneRef.current) return;
        doneRef.current = true;
        stopPolling();
        setPhase("ready");
        drop("/api/videos/quota");
        onUploaded({ ...video, title: title?.trim() || video.title || null });
      } else if (video.status === "ERRORED") {
        stopPolling();
        throw new Error("Mux could not process this video");
      }
    },
    [onUploaded, stopPolling, title]
  );

  const start = async (selected: File) => {
    setError(null);
    setPhase("starting");
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title?.trim() || undefined }),
      });
      const payload = (await res.json().catch(() => null)) as UploadResponse | null;
      if (!res.ok || !payload?.uploadUrl) {
        throw new Error(errorMessage(payload, "Could not start the video upload"));
      }
      setVideoId(payload.videoId);
      setEndpoint(payload.uploadUrl);
      sentRef.current = false;
      setPhase("uploading");
    } catch (startError) {
      setPhase("idle");
      setError(startError instanceof Error ? startError.message : "Could not start the video upload");
    }
  };

  const choose = async (selected: File) => {
    setError(null);
    setWarning(null);
    setPhase("checking");

    const seconds = await probeVideoSeconds(selected);

    if (seconds !== null && seconds > MAX_ASSET_SECONDS) {
      setFile(null);
      setPhase("idle");
      setError(
        `That file is ${lengthLabel(seconds)} long. Mux refuses a single video over 12 hours, so nothing was uploaded — split the recording into parts.`
      );
      return;
    }

    setFile(selected);
    if (seconds === null) {
      setWarning(
        "Couldn't read this file's length here. Mux rejects anything over 12 hours after the upload finishes, so split long recordings first."
      );
    } else if (seconds > SOFT_LIMIT_SECONDS) {
      setWarning(
        `${lengthLabel(seconds)} is close to Mux's 12-hour per-video limit, and anything longer is rejected after the upload.`
      );
    }

    await start(selected);
  };

  // Mux Uploader only uploads a file handed to it, so the accepted File is sent
  // through its `file-ready` event once the element exists. The guard keeps
  // React's double effect in development from starting two uploads.
  useEffect(() => {
    if (phase !== "uploading" || !endpoint || !file) return;
    let cancelled = false;
    let tries = 0;

    const send = () => {
      if (cancelled || sentRef.current) return;
      const element = uploaderRef.current?.querySelector("mux-uploader");
      if (element) {
        sentRef.current = true;
        element.dispatchEvent(
          new CustomEvent("file-ready", { detail: file, bubbles: true, composed: true })
        );
      } else if (tries++ < 200) {
        window.setTimeout(send, 50);
      }
    };

    send();
    return () => {
      cancelled = true;
    };
  }, [endpoint, file, phase]);

  const beginPolling = () => {
    if (!videoId) {
      setError("The upload finished, but its video id was lost. Try again.");
      return;
    }
    setPhase("processing");
    stopPolling();
    void poll(videoId).catch((pollError) => {
      stopPolling();
      setPhase("uploading");
      setError(pollError instanceof Error ? pollError.message : "Could not check the video");
    });
    pollRef.current = window.setInterval(() => {
      void poll(videoId).catch((pollError) => {
        stopPolling();
        setPhase("uploading");
        setError(pollError instanceof Error ? pollError.message : "Could not check the video");
      });
    }, 1500);
  };

  const openPicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  if (phase === "idle") {
    return (
      <div className={compact ? "grid gap-2" : "grid gap-3"}>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            event.target.value = "";
            if (picked) void choose(picked);
          }}
        />
        {error && (
          <p className="flex items-start gap-1.5 text-[12px] text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={openPicker}
          className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">Upload a video</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              MP4, MOV or WebM · up to 12 hours per video · Mux stores and streams it
            </span>
          </span>
        </button>
        {error && (
          <Button type="button" variant="outline" size="sm" onClick={openPicker}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (phase === "checking" || phase === "starting") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-5 text-[12px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {phase === "checking" ? "Reading the video length…" : "Preparing a secure upload…"}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {warning && (
        <p className="flex items-start gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[11.5px] leading-relaxed text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {warning}
        </p>
      )}
      {endpoint && phase === "uploading" && (
        <div ref={uploaderRef}>
          <MuxUploader
            endpoint={endpoint}
            pausable
            onProgress={(event) => {
              const detail = (event as CustomEvent<{ percent?: number }>).detail;
              if (typeof detail?.percent === "number") setProgress(detail.percent);
            }}
            onSuccess={beginPolling}
            onUploadError={() => {
              setPhase("idle");
              setError(
                "The upload failed. If this video is longer than 12 hours, split it and upload the parts separately."
              );
            }}
            style={
              {
                "--progress-bar-fill-color": "currentColor",
              } as React.CSSProperties
            }
          />
        </div>
      )}
      {phase === "processing" && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-5 text-[12px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Upload complete · Mux is preparing the stream…
          {progress > 0 && <span className="ml-auto tabular-nums">{Math.round(progress)}%</span>}
        </div>
      )}
      {phase === "ready" && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-[12px] text-primary">
          Video ready. Inserting it into your post…
        </div>
      )}
      {error && (
        <p className="flex items-start gap-1.5 text-[12px] text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
