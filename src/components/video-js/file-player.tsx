"use client";

import { Video, VideoPlayer, VideoSkin } from "@videojs/react/video";
import { cn } from "@/lib/utils";

export default function FileVideoPlayer({
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
          <Video src={url} playsInline />
        </VideoSkin>
      </VideoPlayer>
    </div>
  );
}
