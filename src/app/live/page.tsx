"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Check,
  Copy,
  Loader2,
  Plus,
  Radio,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { toast } from "@/components/ui/toaster";
import {
  useLiveRoom,
  PHASES,
  type RoomQuestion,
} from "@/lib/use-live-room";
import { useLiveAV } from "@/lib/use-live-av";
import { LiveWorkspace } from "@/components/live-workspace";

type Phase = "lobby" | "intro" | "theory" | "coding" | "open" | "done";

const KINDS: Array<{ id: RoomQuestion["kind"]; label: string }> = [
  { id: "intro", label: "Intro" },
  { id: "theory", label: "Theory" },
  { id: "code", label: "Code" },
  { id: "open", label: "Open" },
];

export default function LiveHostPage() {
  const [step, setStep] = useState<"setup" | "room">("setup");
  const [code, setCode] = useState<string | null>(null);

  // builder state
  const [items, setItems] = useState<RoomQuestion[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newKind, setNewKind] = useState<RoomQuestion["kind"]>("theory");
  const [introQ, setIntroQ] = useState("Tell me about yourself.");
  const [openQ, setOpenQ] = useState("Do you have any questions for us?");

  // room state
  const [strokes, setStrokes] = useState<Array<any>>([]);
  const [chat, setChat] = useState<Array<{ sender: string; text: string }>>([]);
  const [candidateJoined, setCandidateJoined] = useState(false);
  const [saving, setSaving] = useState(false);

  const myIdRef = useRef<string | null>(null);
  const codeRef = useRef<string | null>(null);
  const avSignalRef = useRef<((s: any) => void) | null>(null);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // who am I (for chat styling + sender comparison)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        myIdRef.current = d.user?.id ?? null;
      });
  }, []);

  // ── create room ──
  const createRoom = async () => {
    setSaving(true);
    try {
      const all: RoomQuestion[] = [
        { kind: "intro", q: introQ },
        ...items,
        { kind: "open", q: openQ },
      ];
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: all }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not create the room", { variant: "error" });
        return;
      }
      setCode(data.room.code);
      setStep("room");
      toast(`Room created — share code ${data.room.code}`, { variant: "success" });
    } finally {
      setSaving(false);
    }
  };

  // ── signal handling (stable handler per mount) ──
  const onSignal = useCallback((s: any) => {
    if (typeof avSignalRef.current === "function") avSignalRef.current(s);
    if (s.type.startsWith("av-")) return; // already routed to the A/V panel
    if (s.type === "stroke") {
      const p = s.payload.stroke;
      if (p?.color === "CLEAR") setStrokes((prev) => prev);
      else setStrokes((prev) => [...prev, p]);
    } else if (s.type === "chat") {
      setChat((prev) => [...prev, { sender: s.payload.name ?? "them", text: s.payload.text ?? "" }]);
    } else if (s.type === "hello") {
      setCandidateJoined(true);
      toast("Candidate joined 🎉", { variant: "success" });
    } else if (s.type === "clear") {
      setStrokes([]);
    }
  }, []);

  const { room, error, send, pushCode } = useLiveRoom(code, onSignal);
  const av = useLiveAV(code, send);

  const phase = room?.phase ?? "lobby";
  const questions = useMemo(() => room?.questions ?? [], [room?.questions]);
  const inPhase = questions.filter((q) => q.kind === phase);
  const current = inPhase[room?.cursor ?? 0] ?? null;

  // route A/V signals to the WebRTC hook once it mounts
  useEffect(() => {
    avSignalRef.current = av.onAVSignal;
  }, [av.onAVSignal]);

  useEffect(() => {
    if (room?.candidateId) setCandidateJoined(true);
  }, [room?.candidateId]);

  const setPhase = async (p: Phase) => {
    if (!room) return;
    await fetch(`/api/live?code=${room.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: p }),
    });
    setStrokes([]); // fresh board per phase
    send("clear", {});
  };

  const setCursor = async (i: number) => {
    if (!room) return;
    await fetch(`/api/live?code=${room.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cursor: i }),
    });
  };

  const nextQuestion = async () => {
    if (!room || !current) return;
    const idx = room.cursor ?? 0;
    if (idx < inPhase.length - 1) return setCursor(idx + 1);
    const next = PHASES[PHASES.indexOf(room.phase as Phase) + 1];
    if (next) setPhase(next);
  };

  // share the code screen with the candidate
  const openCode = () => {
    if (!room) return;
    send("open-code", {});
    if (!room.codeState) pushCode("");
    toast("Coding screen opened on the candidate's view", { variant: "success" });
  };

  const joinLink = `${typeof window !== "undefined" ? window.location.origin : ""}/live/join?code=${code ?? ""}`;

  if (step === "room" && code) {
    return (
      <LiveWorkspace
        side="Interviewer"
        code={code}
        room={room}
        strokes={strokes}
        setStrokes={setStrokes}
        chat={chat}
        setChat={setChat}
        send={send}
        pushCode={pushCode}
        av={av}
        role="interviewer"
        setRole={() => {}}
        currentQuestion={current ? { kind: current.kind, q: current.q } : null}
        onAdvance={nextQuestion}
        advanceLabel="Next"
        canAdvance={true}
      />
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="reveal border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="mono-label">Live · host a room · one question at a time</p>
              <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Host a live interview.</h1>
              <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Build the script — intro, theory, code, open — then share one short code. You decide
                what the candidate sees, question by question. Code, whiteboard, chat and audio live
                in the room.
              </p>
            </div>
            <Link href="/live/join" className="btn btn-outline">
              <Users className="size-4" /> Join as candidate
            </Link>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* ── script builder ─────────────────────────────────────────── */}
          <section className="reveal reveal-1 card-surface overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="mono-label">Room script</p>
                <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.02em]">
                  What will you ask?
                </h2>
              </div>
              <span className="mono-label !text-[9px]">{items.length + 2} questions</span>
            </div>

            <div className="grid gap-6 p-5 sm:p-6">
              <div>
                <Label htmlFor="intro" className="mono-label !text-[9px]">
                  01 · Intro
                </Label>
                <Input
                  id="intro"
                  value={introQ}
                  onChange={(e) => setIntroQ(e.target.value)}
                  placeholder="Kick-off question"
                  className="mt-2"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Always first. Warm the candidate up.
                </p>
              </div>

              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="mono-label !text-[9px]">02 · Your questions</p>
                  <span className="mono-label !text-[8.5px] text-muted-foreground">
                    theory or code
                  </span>
                </div>

                <div className="mt-2.5 grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as RoomQuestion["kind"])}
                    className="h-10 rounded-xl border border-border bg-card px-3 text-[12.5px] outline-none focus:border-foreground/30"
                    aria-label="Question kind"
                  >
                    {KINDS.filter((k) => k.id !== "intro").map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={newQ}
                    onChange={(e) => setNewQ(e.target.value)}
                    placeholder="e.g. Explain the event loop in JS"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newQ.trim()) {
                        e.preventDefault();
                        setItems((it) => [...it, { kind: newKind, q: newQ.trim() }]);
                        setNewQ("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newQ.trim()) return;
                      setItems((it) => [...it, { kind: newKind, q: newQ.trim() }]);
                      setNewQ("");
                    }}
                    className="h-10 gap-1.5 px-4"
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </div>

                <div className="mt-3 grid gap-2">
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                      <p className="text-[12px] font-medium">No extra questions yet</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Intro and the open-ended closer are always included.
                      </p>
                    </div>
                  )}
                  {items.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5"
                    >
                      <span className="mono-label w-5 shrink-0 !text-[9px]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="chip shrink-0 !text-[9px] capitalize">{q.kind}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px]">{q.q}</span>
                      <button
                        type="button"
                        onClick={() => setItems((it) => it.filter((_, j) => j !== i))}
                        aria-label="Remove question"
                        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <Label htmlFor="open" className="mono-label !text-[9px]">
                  03 · Open-ended closer
                </Label>
                <Input
                  id="open"
                  value={openQ}
                  onChange={(e) => setOpenQ(e.target.value)}
                  placeholder="Wrap-up question"
                  className="mt-2"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Always last. “Anything you want to ask us?” works well.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
              <Button onClick={createRoom} disabled={saving} className="h-10 gap-1.5 px-5">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
                Create live room
              </Button>
              <p className="text-[11.5px] text-muted-foreground">
                You will get a short code and a join link to share.
              </p>
            </div>
          </section>

          {/* ── rail ───────────────────────────────────────────────────── */}
          <aside className="reveal reveal-2 grid gap-4 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-[var(--ink)] p-5 text-[var(--paper)]">
              <p className="mono-label !text-[var(--paper)]/45">How a room runs</p>
              <ol className="mt-4 space-y-3.5">
                {[
                  ["Intro", "A warm-up. Both faces on, no code."],
                  ["Theory", "One concept at a time. You advance."],
                  ["Code", "Shared editor, synced live."],
                  ["Open", "Their questions for you."],
                ].map(([head, body], i) => (
                  <li key={head} className="flex gap-3">
                    <span className="mono-label shrink-0 !text-[8.5px] !text-[var(--paper)]/30">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium">{head}</p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--paper)]/55">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-dashed border-border p-5">
              <p className="mono-label">The candidate sees</p>
              <ul className="mt-3 grid gap-2">
                {[
                  "One question at a time",
                  "The code screen only when you open it",
                  "A chat and whiteboard tab",
                  "No score, no notes, no script",
                ].map((line) => (
                  <li key={line} className="flex gap-2 text-[12px] leading-snug text-muted-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!joinLink) return;
                navigator.clipboard.writeText(joinLink);
                toast("Join link copied", { variant: "success" });
              }}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/25"
            >
              <div>
                <p className="mono-label !text-[8.5px]">Join link</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Created with the room
                </p>
              </div>
              <Copy className="size-4 text-muted-foreground" />
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
