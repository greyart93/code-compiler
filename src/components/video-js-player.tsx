"use client";

import dynamic from "next/dynamic";
import type { VideoSource } from "@/components/video-player";
import { Loader2 } from "lucide-react";

const loading = () => (
  <div className="grid aspect-video w-full place-items-center bg-black">
    <Loader2 className="size-6 animate-spin text-white/60" />
  </div>
);

const MuxVideoPlayer = dynamic(() => import("@/components/video-js/mux-player"), {
  ssr: false,
  loading,
});
const YouTubeVideoPlayer = dynamic(
  () => import("@/components/video-js/youtube-player"),
  { ssr: false, loading }
);
const VimeoVideoPlayer = dynamic(() => import("@/components/video-js/vimeo-player"), {
  ssr: false,
  loading,
});
const FileVideoPlayer = dynamic(() => import("@/components/video-js/file-player"), {
  ssr: false,
  loading,
});

export function VideoJsPlayer({
  source,
  title,
  poster,
  className,
}: {
  source: VideoSource;
  title?: string;
  poster?: string;
  className?: string;
}) {
  if (source.kind === "mux") {
    return (
      <MuxVideoPlayer
        playbackId={source.playbackId}
        title={title}
        poster={poster}
        className={className}
      />
    );
  }
  if (source.kind === "youtube") {
    return (
      <YouTubeVideoPlayer
        url={source.url}
        title={title}
        poster={poster}
        className={className}
      />
    );
  }
  if (source.kind === "vimeo") {
    return (
      <VimeoVideoPlayer
        url={source.url}
        title={title}
        poster={poster}
        className={className}
      />
    );
  }
  return (
    <FileVideoPlayer url={source.url} title={title} poster={poster} className={className} />
  );
}
