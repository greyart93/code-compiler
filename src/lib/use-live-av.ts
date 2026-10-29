"use client";

/**
 * Peer-to-peer camera + microphone for the Live interview room.
 *
 * Transport: WebRTC, signaled over the room's existing signal channel
 * (POST /api/live/signal + long-poll GET). Perfect-negotiation-lite:
 * whichever side presses "Start camera & mic" first becomes the offerer,
 * the other side auto-answers. Mic and webcam toggles only change track
 * state (no renegotiation).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Signal } from "./use-live-room";

type AVState = {
  active: boolean;
  connecting: boolean;
  peerConnected: boolean;
  micOn: boolean;
  camOn: boolean;
  error: string | null;
};

const INITIAL: AVState = {
  active: false,
  connecting: false,
  peerConnected: false,
  micOn: true,
  camOn: true,
  error: null,
};

/** Kick off the initial getUserMedia+RTCPeerConnection flow. */
export function useLiveAV(code: string | null, send: (type: string, payload?: Record<string, unknown>) => void) {
  const [state, setState] = useState<AVState>(INITIAL);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const makingOffer = useRef(false);
  const roleRef = useRef<"offerer" | "answerer" | null>(null);

  const cleanupPeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    makingOffer.current = false;
    roleRef.current = null;
    setState((s) => ({ ...s, active: false, connecting: false, peerConnected: false }));
  }, []);

  const onSignal = useCallback(
    (s: Signal) => {
      const pc = pcRef.current;
      if (!pc) return;
      const p = s.payload ?? {};

      if (s.type === "av-offer" && roleRef.current === "answerer") {
        // remote SDP offer arriving → answer
        pc.setRemoteDescription(new RTCSessionDescription(p.sdp))
          .then(() => pc.createAnswer())
          .then((ans) => pc.setLocalDescription(ans))
          .then(() => send("av-answer", { sdp: { type: "answer", sdp: pcRef.current?.localDescription?.sdp } }))
          .catch(() => setState((st) => ({ ...st, error: "Couldn't connect the call" })));
      } else if (s.type === "av-answer" && roleRef.current === "offerer") {
        pc.setRemoteDescription(new RTCSessionDescription(p.sdp)).catch(() => {});
      } else if (s.type === "av-ice" && p.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(p.candidate)).catch(() => {});
      } else if (s.type === "av-stop") {
        cleanupPeer();
      }
    },
    [send, cleanupPeer]
  );

  const start = useCallback(
    async (withVideo: boolean) => {
      if (!code || pcRef.current) return;
      setState((s) => ({ ...s, connecting: true, error: null }));
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: withVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });
        pcRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (ev) => {
          remoteStreamRef.current = ev.streams[0];
          setRemoteStream(ev.streams[0]);
          setState((s) => ({ ...s, peerConnected: true, connecting: false }));
        };
        pc.onicecandidate = (ev) => {
          if (ev.candidate) send("av-ice", { candidate: ev.candidate.toJSON() });
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setState((s) => ({ ...s, peerConnected: true, connecting: false }));
          } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
            setState((s) => ({ ...s, peerConnected: false }));
          }
        };

        // this side is the offerer
        roleRef.current = "offerer";
        makingOffer.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send("av-start-request", {}); // tell the peer to prepare as answerer
        send("av-offer", { sdp: { type: "offer", sdp: pc.localDescription?.sdp } });
        setState((s) => ({ ...s, active: true, connecting: false, micOn: true, camOn: withVideo }));
      } catch (err) {
        const e = err as DOMException;
        cleanupPeer();
        const msg =
          e.name === "NotAllowedError"
            ? "Camera/mic permission denied — allow access in your browser address bar."
            : e.name === "NotFoundError"
              ? "No camera or microphone found."
              : "Couldn't start the camera or mic.";
        setState((s) => ({ ...s, error: msg, connecting: false }));
      }
    },
    [code, send, cleanupPeer]
  );

  /** Called when the peer offers first — we buckle in as the answerer. */
  const prepareAnswerer = useCallback(() => {
    if (pcRef.current) return;
    roleRef.current = "answerer";
    setState((s) => ({ ...s, connecting: true }));
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        pc.ontrack = (ev) => {
          remoteStreamRef.current = ev.streams[0];
          setRemoteStream(ev.streams[0]);
          setState((s) => ({ ...s, peerConnected: true, connecting: false }));
        };
        pc.onicecandidate = (ev) => {
          if (ev.candidate) send("av-ice", { candidate: ev.candidate.toJSON() });
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setState((s) => ({ ...s, peerConnected: true, connecting: false }));
          else if (pc.connectionState === "failed") setState((s) => ({ ...s, peerConnected: false }));
        };
        setState((s) => ({ ...s, active: true }));
      })
      .catch(() => {
        setState((s) => ({
          ...s,
          connecting: false,
          active: false,
          error: "Camera/mic permission denied — allow access in your browser address bar.",
        }));
      });
  }, [send]);

  const stop = useCallback(() => {
    send("av-stop", {});
    cleanupPeer();
  }, [send, cleanupPeer]);

  const toggleMic = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = next));
    setState((s) => ({ ...s, micOn: next }));
  }, []);

  const toggleCam = useCallback(() => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = next));
    setState((s) => ({ ...s, camOn: next }));
  }, []);

  // listen for the peer's start request → become answerer
  const onAVSignal = useCallback(
    (s: Signal) => {
      if (s.type === "av-start-request" && !pcRef.current) prepareAnswerer();
      onSignal(s);
    },
    [onSignal, prepareAnswerer]
  );

  useEffect(() => {
    if (!code) {
      cleanupPeer();
    }
  }, [code, cleanupPeer]);

  return {
    ...state,
    localStream,
    remoteStream,
    start,
    stop,
    toggleMic,
    toggleCam,
    onAVSignal,
  };
}
