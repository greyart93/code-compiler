"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RoomQuestion = { kind: "intro" | "theory" | "code" | "open"; q: string; snippetId?: string };
export type LiveRoom = {
  code: string;
  phase: string;
  cursor: number;
  questions: RoomQuestion[];
  codeState: string | null;
  codeLang: string | null;
  interviewerId: string;
  interviewer: { username: string; name: string | null };
  candidate: { username: string; name: string | null } | null;
  candidateId: string | null;
};

export type Signal = { id: string; sender: string; type: string; payload: any };

/**
 * Per-browser-tab id: each open tab/code window joins the room as its own
 * listener, so two windows on the SAME account still exchange events.
 */
export function clientTabId(): string {
  try {
    const w = window as unknown as { __codevitTabId?: string };
    if (w.__codevitTabId) return w.__codevitTabId;
    w.__codevitTabId = `t_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    return w.__codevitTabId;
  } catch {
    return "t_unknown";
  }
}

/**
 * Subscribes to a live room with a single coordinated heartbeat per tab:
 *  - waits on `/api/live/signal?code=&after=&wait=1`
 *  - refreshes `room` state from that same response whenever it returns
 *  - keeps a slow standalone room-state refresh as a fallback so a quiet
 *    room does not go stale
 *
 * Do not add a separate 1-second `GET /api/live?code=` interval alongside
 * this loop — that is what caused the idle-request burst during live
 * interviews. See AGENTS.md → "Live interview room polling".
 */
export function useLiveRoom(code: string | null, onSignal?: (s: Signal) => void) {
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handlerRef = useRef(onSignal);
  handlerRef.current = onSignal;

  useEffect(() => {
    if (!code) return;

    let alive = true;
    let after = 0;
    let roomRefreshPending = false;

    // refresh room state on its own slow clock (fallback when the room is quiet)
    const scheduleRoomRefresh = () => {
      if (roomRefreshPending) return;
      roomRefreshPending = true;
      setTimeout(() => {
        if (!alive) return;
        roomRefreshPending = false;
        refreshRoomState();
      }, 8_000);
    };

    const refreshRoomState = async () => {
      try {
        const res = await fetch(`/api/live?code=${code}`);
        if (!alive) return;
        if (res.ok) {
          const body = await res.json();
          setRoom(body.room);
          setError(null);
        } else if (res.status === 404) {
          setError("Room not found");
        }
      } catch {
        /* transient — the next tick retries */
      }
    };

    // single long-lived loop: wait for signals, refresh room state from the
    // same response whenever it returns, keep the fallback clock running.
    const loop = async () => {
      while (alive) {
        try {
          const res = await fetch(
            `/api/live/signal?code=${code}&after=${after}&wait=1`,
          );
          if (!res.ok) {
            // auth/session problems should back off, not spin on the
            // cheap poll path. Keep a short, capped retry instead.
            if (alive) {
              await new Promise((r) => setTimeout(r, res.status === 401 ? 5_000 : 2_000));
            }
            continue;
          }
          const data = await res.json();
          const myTab = clientTabId();

          let refreshed = false;
          for (const s of data.signals) {
            if (Number(s.id) > after) after = Number(s.id);
            if (s.payload?.tabId === myTab) continue;
            delete s.payload?.tabId;
            handlerRef.current?.(s);
          }

          // room state is shipped on every signal response too - apply it
          // here so a quiet room still refreshes from this loop when
          // events arrive.
          if (data.room) {
            setRoom(data.room);
            setError(null);
            refreshed = true;
          }

          if (!refreshed) {
            scheduleRoomRefresh();
          }
        } catch {
          if (alive) {
            await new Promise((r) => setTimeout(r, 2_000));
          }
        }
      }
    };

    refreshRoomState();
    scheduleRoomRefresh();
    loop();

    return () => {
      alive = false;
    };
  }, [code]);

  const send = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      if (!code) return;
      fetch("/api/live/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type, payload: { ...payload, tabId: clientTabId() } }),
      }).catch(() => {});
    },
    [code]
  );

  /** push code buffer to the room row (sender=requesting side ignores its own echo) */
  const pushCode = useCallback(
    (text: string) => {
      if (!code) return;
      fetch(`/api/live?code=${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeState: text }),
      }).catch(() => {});
    },
    [code]
  );

  return { room, error, send, pushCode };
}

export const PHASES = ["lobby", "intro", "theory", "coding", "open", "done"] as const;
export const PHASE_LABEL: Record<string, string> = {
  lobby: "Lobby",
  intro: "Introductions",
  theory: "Theory questions",
  coding: "Coding questions",
  open: "Open discussion",
  done: "Finished",
};
