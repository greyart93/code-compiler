"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { toast } from "@/components/ui/toaster";
import { useLiveRoom, PHASE_LABEL, clientTabId } from "@/lib/use-live-room";
import { useLiveAV } from "@/lib/use-live-av";
import { LiveWorkspace } from "@/components/live-workspace";

function JoinInner() {
  const search = useSearchParams();
  const [codeInput, setCodeInput] = useState(search.get("code")?.toUpperCase() ?? "");
  const [code, setCode] = useState<string | null>(search.get("code")?.toUpperCase() ?? null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [strokes, setStrokes] = useState<Array<any>>([]);
  const [chat, setChat] = useState<Array<{ sender: string; text: string }>>([]);
  const [pushTimer, setPushTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.user));
  }, []);

  const onSignal = useCallback((s: any) => {
    if (typeof avSignalRef.current === "function") avSignalRef.current(s);
    if (s.type.startsWith("av-")) return; // routed to the A/V panel
    if (s.type === "stroke") {
      const p = s.payload.stroke;
      if (p?.color !== "CLEAR") setStrokes((prev) => [...prev, p]);
    } else if (s.type === "chat") {
      setChat((prev) => [...prev, { sender: s.payload.name ?? "Interviewer", text: s.payload.text ?? "" }]);
    } else if (s.type === "open-code") {
      toast("The interviewer opened a coding screen", { variant: "success" });
    } else if (s.type === "close-code") {
      // the workspace tab state is local to the shell, so no-op here
    } else if (s.type === "show-board") {
      // the workspace tab state is local to the shell, so no-op here
    } else if (s.type === "clear") {
      setStrokes([]);
    }
  }, []);

  const { room, error, send, pushCode } = useLiveRoom(code, onSignal);
  const av = useLiveAV(code, send);
  const avSignalRef = useRef<((s: any) => void) | null>(null);
  useEffect(() => {
    avSignalRef.current = av.onAVSignal;
  }, [av.onAVSignal]);

  const phase = room?.phase ?? "lobby";
  const questions = useMemo(() => room?.questions ?? [], [room?.questions]);
  const current =
    (questions.filter((q) => q.kind === phase)[room?.cursor ?? 0] ?? null);

  // join → announce + claim the candidate seat
  const join = async () => {
    const c = codeInput.trim().toUpperCase();
    if (!c) return;
    const res = await fetch(`/api/live?code=${c}`);
    if (!res.ok) {
      toast("Room not found — check the code", { variant: "error" });
      return;
    }
    setCode(c);
  };

  useEffect(() => {
    if (!room || !myResolvedId) return;
    send("hello", {});
  }, [room?.candidateId]); // eslint-disable-line react-hooks/exhaustive-deps

  // lazily resolve "me" via /api/live?code= room.candidateId comparison
  const [myResolvedId, setMyResolvedId] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMyResolvedId(d.user?.id ?? null));
  }, []);

  // claim the candidate seat once inside the room
  useEffect(() => {
    if (!room || !myResolvedId) return;
    if (room.candidateId && room.candidateId !== myResolvedId) {
      toast("Someone else is already the candidate in this room", { variant: "error" });
      return;
    }
    if (!room.candidateId && myResolvedId !== room.interviewerId) {
      fetch(`/api/live/party`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }).catch(() => {});
    }
  }, [room?.candidateId, myResolvedId, room, code]);

  // throttled code push while typing
  const onEdit = (v: string) => {
    if (pushTimer) clearTimeout(pushTimer);
    const t = setTimeout(() => pushCode(v), 500);
    setPushTimer(t);
  };

  if (authed === false) {
    return (
      <JoinFrame
        eyebrow="Live · candidate"
        title="Sign in to join."
        description="A live interview is tied to your account so the interviewer knows who is in the room."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </JoinFrame>
    );
  }

  if (!code) {
    return (
      <JoinFrame
        eyebrow="Live · candidate"
        title="Join an interview."
        description="Enter the short code your interviewer shared. You will join the room as the candidate — one question at a time."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="7F3KQ"
            maxLength={6}
            aria-label="Room code"
            className="h-12 text-center font-mono text-[22px] tracking-[0.3em]"
            onKeyDown={(e) => e.key === "Enter" && join()}
          />
          <Button onClick={join} className="h-12 shrink-0 px-6">
            <Radio className="size-4" /> Join room
          </Button>
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">
          Hosting instead?{" "}
          <Link href="/live" className="font-medium text-primary hover:underline">
            Create a room
          </Link>
        </p>
      </JoinFrame>
    );
  }

  if (error) {
    return (
      <JoinFrame
        eyebrow="Live · candidate"
        title="That room is unavailable."
        description={error}
      >
        <Button
          className="mt-1"
          onClick={() => {
            setCode(null);
            setCodeInput("");
          }}
        >
          Try another code
        </Button>
      </JoinFrame>
    );
  }

  if (!room) {
    return (
      <div className="app-shell">
        <SiteHeader />
        <main className="page-wrap grid place-items-center py-32">
          <div className="text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
            <p className="mono-label mt-4">Joining the room…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <LiveWorkspace
      side="Candidate"
      code={code}
      room={room}
      strokes={strokes}
      setStrokes={setStrokes}
      chat={chat}
      setChat={setChat}
      send={send}
      pushCode={onEdit}
      av={av}
      role="candidate"
      setRole={() => {}}
      currentQuestion={current ? { kind: current.kind, q: current.q } : null}
      onAdvance={() => {
        // candidate does not advance the phase; no-op
      }}
      advanceLabel="Next"
      canAdvance={false}
    />
  );
}

function JoinFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap flex min-h-[calc(100svh-84px)] items-center py-10 sm:py-14">
        <div className="mx-auto grid w-full max-w-[980px] gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-stretch">
          <section className="reveal card-surface flex flex-col p-6 sm:p-8">
            <p className="mono-label">{eyebrow}</p>
            <h1 className="display mt-3 text-[clamp(36px,5vw,54px)] leading-[1.02]">{title}</h1>
            {description && (
              <p className="mt-3 max-w-[46ch] text-[13.5px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
            <div className="mt-7">{children}</div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 mt-9">
              <Link
                href="/"
                className="text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Back to the site
              </Link>
              <span className="mono-label !text-[8.5px]">CodeVit · live</span>
            </div>
          </section>

          <aside className="reveal reveal-1 relative hidden overflow-hidden rounded-3xl bg-[var(--ink)] p-7 text-[var(--paper)] lg:flex lg:flex-col">
            <div className="pointer-events-none absolute -right-12 -top-14 size-44 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="mono-label !text-[var(--paper)]/45">In the room</p>
                <Sparkles className="size-3.5 text-[var(--paper)]/35" />
              </div>
              <h2 className="display mt-4 text-[30px] leading-[1.05]">
                One question
                <br />
                at a time.
              </h2>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--paper)]/60">
                The interviewer controls the script. You see the current question, the code screen
                when it opens, and a chat for everything else.
              </p>
            </div>

            <ol className="relative mt-7 space-y-3.5">
              {[
                ["They ask", "Voice, or typed into the room."],
                ["You answer", "Speak or type — no timer."],
                ["You code", "Shared editor, changes sync live."],
                ["You ask", "The last question is yours."],
              ].map(([head, body], i) => (
                <li key={head} className="flex gap-3">
                  <span className="mono-label shrink-0 !text-[8.5px] !text-[var(--paper)]/30">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium">{head}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--paper)]/50">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="relative mt-auto flex items-center gap-2 border-t border-white/10 pt-4">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span className="mono-label !text-[8px] !text-[var(--paper)]/35">
                audio · code · chat
              </span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function CandidateJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <SiteHeader />
          <main className="page-wrap grid place-items-center py-32">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </main>
        </div>
      }
    >
      <JoinInner />
    </Suspense>
  );
}
