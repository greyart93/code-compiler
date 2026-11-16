"use client";

import { VideoPlayer, VideoSkin } from "@videojs/react/video";
import { VimeoVideo } from "@videojs/react/media/vimeo-video";
import { cn } from "@/lib/utils";

export default function VimeoVideoPlayer({
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
          <VimeoVideo src={url} playsInline />
        </VideoSkin>
      </VideoPlayer>
    </div>
  );
}
