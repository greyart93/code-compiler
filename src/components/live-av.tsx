"use client";

import { useEffect, useRef } from "react";
import { Camera, CameraOff, Loader2, Mic, MicOff, PhoneOff, Video } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { useLiveAV } from "@/lib/use-live-av";

type AV = ReturnType<typeof useLiveAV>;

function VideoTile({
  stream,
  muted,
  label,
  placeholder,
  className,
}: {
  stream: MediaStream | null;
  muted: boolean;
  label: string;
  placeholder: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-black ${className ?? ""}`}>
      {stream ? (
        <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <Video className="size-7 opacity-40" />
          <span className="text-xs">{placeholder}</span>
        </div>
      )}
      <span className="absolute bottom-1.5 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {label}
      </span>
    </div>
  );
}

/** Camera + microphone panel for the Live room — identical on both sides. */
export function LiveAVPanel({ av, side }: { av: AV; side: "Interviewer" | "Candidate" }) {
  if (!av.active) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
        <div className="flex items-center gap-2">
          <Video className="size-5 text-primary" />
          <p className="font-semibold">Camera &amp; microphone</p>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Turn on your {side === "Interviewer" ? "interviewer" : "candidate"} devices for the face-to-face part of the
          interview. The other participant will be prompted to join with theirs.
        </p>
        {av.error && <p className="text-sm text-destructive">{av.error}</p>}
        <div className="flex gap-2">
          <Button onClick={() => av.start(true)} disabled={av.connecting} className="gap-2">
            {av.connecting ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Start camera &amp; mic
          </Button>
          <Button variant="outline" onClick={() => av.start(false)} disabled={av.connecting} className="gap-2">
            {av.connecting ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
            Mic only
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="grid grid-cols-2 gap-3">
        <VideoTile
          stream={av.localStream}
          muted
          label={`${side} (you)`}
          placeholder="Your camera is off"
          className="min-h-44"
        />
        <VideoTile
          stream={av.remoteStream}
          muted={false}
          label={side === "Interviewer" ? "Candidate" : "Interviewer"}
          placeholder={av.connecting ? "Waiting for the other side…" : "Their camera is off"}
          className="min-h-44"
        />
      </div>

      {av.error && <p className="mt-2 text-center text-xs text-destructive">{av.error}</p>}

      <div className="mt-3 flex items-center justify-center gap-2">
        <Button
          size="icon"
          variant={av.micOn ? "outline" : "destructive"}
          onClick={av.toggleMic}
          aria-label={av.micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {av.micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        </Button>
        <Button
          size="icon"
          variant={av.camOn ? "outline" : "destructive"}
          onClick={av.toggleCam}
          aria-label={av.camOn ? "Turn camera off" : "Turn camera on"}
        >
          {av.camOn ? <Camera className="size-4" /> : <CameraOff className="size-4" />}
        </Button>
        <Button size="sm" variant="destructive" onClick={av.stop} className="gap-1.5">
          <PhoneOff className="size-4" /> End call
        </Button>
        {av.peerConnected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-500"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-green-500" /> Connected
          </motion.span>
        )}
      </div>
    </div>
  );
}
