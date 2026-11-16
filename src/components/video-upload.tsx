"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

const MuxUploader = dynamic(() => import("@mux/mux-uploader-react"), {
  ssr: false,
});

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

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string") return error;
  }
  return fallback;
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
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "starting" | "uploading" | "processing" | "ready">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<number | null>(null);
  const doneRef = useRef(false);

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
        onUploaded({ ...video, title: title?.trim() || video.title || null });
      } else if (video.status === "ERRORED") {
        stopPolling();
        throw new Error(video.status === "ERRORED" ? "Mux could not process this video" : "Upload failed");
      }
    },
    [onUploaded, stopPolling, title]
  );

  const start = async () => {
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
      setPhase("uploading");
    } catch (startError) {
      setPhase("idle");
      setError(startError instanceof Error ? startError.message : "Could not start the video upload");
    }
  };

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

  if (phase === "idle") {
    return (
      <div className={compact ? "grid gap-2" : "grid gap-3"}>
        {error && (
          <p className="flex items-start gap-1.5 text-[12px] text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void start()}
          className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">Upload a video</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              MP4, MOV or WebM from your laptop · Mux stores and streams it
            </span>
          </span>
        </button>
        {error && (
          <Button type="button" variant="outline" size="sm" onClick={() => void start()}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (phase === "starting") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-5 text-[12px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Preparing a secure upload…
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {endpoint && phase === "uploading" && (
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
            setError("The upload failed. Try a smaller file or retry.");
          }}
          style={
            {
              "--progress-bar-fill-color": "currentColor",
            } as React.CSSProperties
          }
        />
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
