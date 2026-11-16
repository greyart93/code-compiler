"use client";

import { VideoPlayer, VideoSkin } from "@videojs/react/video";
import { YouTubeVideo } from "@videojs/react/media/youtube-video";
import { cn } from "@/lib/utils";

export default function YouTubeVideoPlayer({
  url,
  title,
  poster,
  className,
}: {
  url: string;
  title?: string;
  poster?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden bg-black", className)}>
      <VideoPlayer title={title} poster={poster}>
        <VideoSkin className="aspect-video w-full">
          <YouTubeVideo src={url} playsInline />
        </VideoSkin>
      </VideoPlayer>
    </div>
  );
}
