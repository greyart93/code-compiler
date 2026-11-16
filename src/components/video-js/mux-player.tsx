"use client";

import { VideoPlayer, VideoSkin } from "@videojs/react/video";
import { MuxVideo } from "@videojs/react/media/mux-video";
import { MuxData } from "@videojs/react/extensions/mux-data";
import { cn } from "@/lib/utils";

export default function MuxVideoPlayer({
  playbackId,
  title,
  poster,
  className,
}: {
  playbackId: string;
  title?: string;
  poster?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden bg-black", className)}>
      <VideoPlayer title={title} poster={poster}>
        <VideoSkin className="aspect-video w-full">
          <MuxVideo
            source={{ playbackId }}
            playsInline
            crossOrigin="anonymous"
          />
          <MuxData {...(title ? { metadata: { video_title: title } } : {})} />
        </VideoSkin>
      </VideoPlayer>
    </div>
  );
}
