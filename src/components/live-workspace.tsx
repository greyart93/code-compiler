"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Play, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { LiveAVPanel } from "@/components/live-av";
import { LiveWhiteboard } from "@/components/live-collab";
import { useLiveRoom, PHASES, PHASE_LABEL } from "@/lib/use-live-room";
import { useLiveAV } from "@/lib/use-live-av";

type Side = "Interviewer" | "Candidate";
type Role = "interviewer" | "candidate";

type StrokePayload = { points: { x: number; y: number }[]; color: string; erase?: boolean };

const PHASE_TABS: { id: typeof PHASES[number]; label: string }[] = [
  { id: "intro", label: "Introductions" },
  { id: "theory", label: "Theory" },
  { id: "coding", label: "Coding" },
  { id: "open", label: "Wrap-up" },
];

export function LiveWorkspace({
  side,
  code,
  room,
  strokes,
  setStrokes,
  chat,
  setChat,
  send,
  pushCode,
  av,
  role,
  setRole,
  currentQuestion,
  onAdvance,
  advanceLabel,
  canAdvance,
}: {
  side: Side;
  code: string | null;
  room: ReturnType<typeof useLiveRoom>["room"];
  strokes: StrokePayload[];
  setStrokes: React.Dispatch<React.SetStateAction<StrokePayload[]>>;
  chat: { sender: string; text: string }[];
  setChat: React.Dispatch<React.SetStateAction<{ sender: string; text: string }[]>>;
  send: (type: string, payload?: Record<string, unknown>) => void;
  pushCode: (text: string) => void;
  av: ReturnType<typeof useLiveAV>;
  role: Role;
  setRole: (r: Role) => void;
  currentQuestion: { kind: string; q: string } | null;
  onAdvance: () => void;
  advanceLabel: string;
  canAdvance: boolean;
}) {
  const [pane, setPane] = useState<"code" | "board">("code");
  const [sideTab, setSideTab] = useState<"questions" | "notes" | "score" | "current" | "chat">(
    role === "interviewer" ? "questions" : "current"
  );
  const [lang, setLang] = useState("plain");
  const [log, setLog] = useState<{ sender: string; text: string; mine: boolean }[]>([]);
  const logEnd = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  const remoteName =
    role === "interviewer"
      ? room?.candidate?.name ?? room?.candidate?.username ?? "Candidate"
      : room?.interviewer?.name ?? room?.interviewer?.username ?? "Interviewer";
  const phaseLabel = room ? PHASE_LABEL[room.phase] ?? room.phase : "";
  const phaseIndex = room ? PHASES.indexOf(room.phase as typeof PHASES[number]) : -1;

  useEffect(() => {
    if (!room) return;
    if (!joined) {
      setJoined(true);
      send("hello", {});
    }
  }, [room, joined, send]);

  useEffect(() => {
    setLog((prev) => {
      const merged = [...prev];
      for (const m of chat) {
        if (!m.sender) continue;
        const key = m.sender + "\n" + m.text;
        if (!merged.some((x) => x.sender + "\n" + x.text === key))
          merged.push({ sender: m.sender, text: m.text, mine: false });
      }
      return merged;
    });
  }, [chat]);

  useEffect(() => {
    if (!logEnd.current) return;
    requestAnimationFrame(() => {
      logEnd.current!.scrollIntoView({ block: "nearest" });
    });
  }, [log]);

  useEffect(() => {
    if (document.getElementById("live-timer")) return;
    const el = document.createElement("span");
    el.id = "live-timer";
    el.className = "timer";
    let s = 0;
    const tick = setInterval(() => {
      s += 1;
      el.textContent =
        String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const noteValue = useMemo(() => {
    try {
      const saved = sessionStorage.getItem("live-notes-" + room?.code);
      return saved ?? "";
    } catch {
      return "";
    }
  }, [room?.code]);

  useEffect(() => {
    try {
      sessionStorage.setItem("live-notes-" + room?.code, noteValue);
    } catch {
      // ignore
    }
  }, [noteValue, room?.code]);

  const openCodingScreen = () => {
    if (!room) return;
    send("open-code", {});
    if (!room.codeState) pushCode("");
    setPane("code");
    toast("Coding screen opened for the candidate", { variant: "success" });
  };

  const langs = ["plain", "python", "cpp", "javascript", "java", "go"];

  const tabDisabled = !room ? true : false;

  return (
    <div className="live-app" data-role={role}>
      <header className="live-bar">
        <div className="brand">
          &lt;/&gt; Code<span>Vit</span>
        </div>
        <div className="live">
          <span className="dot" />
          <b>Live with {remoteName}</b>
          <span className="timer" />
        </div>
        <div className="stepper" role="tablist" aria-label="Interview phase">
          {PHASE_TABS.map((t, i) => {
            const active = phaseIndex === i;
            return (
              <button
                key={t.id}
                className={`phase-tab ${active ? "on" : ""}`}
                onClick={() => {
                  if (!room) return;
                  fetch(`/api/live?code=${room.code}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phase: t.id }),
                  }).catch(() => {});
                }}
                disabled={!room}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="spacer" />
        <div className="seg" role="tablist" aria-label="Preview as">
          <button
            className={`role-tab ${role === "interviewer" ? "on" : ""}`}
            onClick={() => setRole("interviewer")}
          >
            Interviewer
          </button>
          <button
            className={`role-tab ${role === "candidate" ? "on" : ""}`}
            onClick={() => setRole("candidate")}
          >
            Candidate
          </button>
        </div>
        <button
          className="icon-btn"
          onClick={() => {
            if (!code) return;
            navigator.clipboard.writeText(
              `${typeof window !== "undefined" ? window.location.origin : ""}/live/join?code=${code}`
            );
            toast("Join link copied", { variant: "success" });
          }}
        >
          <Copy className="icon" />
        </button>
      </header>

      <main className="live-main">
        <section className="work">
          <div className="card editor-card">
            <div className="tabs" role="tablist" aria-label="Workspace">
              <button
                className={`tab ${pane === "code" ? "on" : ""}`}
                onClick={() => setPane("code")}
                disabled={tabDisabled}
              >
                <Code2 className="tab-icon" /> Code
              </button>
              <button
                className={`tab ${pane === "board" ? "on" : ""}`}
                onClick={() => setPane("board")}
                disabled={tabDisabled}
              >
                <Play className="tab-icon" /> Whiteboard
              </button>
              <span className="spacer" />
              <select
                aria-label="Language"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={tabDisabled}
              >
                {langs.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
              <button
                className="run"
                disabled={tabDisabled}
                onClick={() => {
                  toast("Run is a placeholder in this reference build", { variant: "default" });
                }}
              >
                Run
              </button>
            </div>

            <div className={`pane ${pane === "code" ? "on" : ""}`} id="code">
              <div className="code">
                <div className="gutter" id="gutter">
                  {Array.from({ length: 46 }, (_, i) => i + 1).map((n) => (
                    <pre key={n} className="gutter-line">
                      {n}
                    </pre>
                  ))}
                </div>
                <pre
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  className="src"
                  onInput={() => {
                    const src = document.getElementById("live-src");
                    if (!src || !room) return;
                    const value = src.textContent ?? "";
                    if (value !== room.codeState) {
                      pushCode(value);
                    }
                  }}
                  id="live-src"
                >
                  {room?.codeState ?? "Write code here — both sides share this buffer."}
                </pre>
              </div>
            </div>

            <div className={`pane ${pane === "board" ? "on" : ""}`} id="board">
              <div className="board">
                <LiveWhiteboard
                  isHost={role === "interviewer"}
                  strokes={strokes}
                  onStroke={(s) => {
                    if (s.color === "CLEAR") {
                      setStrokes([]);
                      send("clear", {});
                      return;
                    }
                    setStrokes((prev) => [...prev, s]);
                    send("stroke", { stroke: s });
                  }}
                />
              </div>
            </div>

            <div className="console" id="console">
              <div className="h">Output</div>
              <div className="c">Press Run to execute the shared code.</div>
            </div>
          </div>
        </section>

        <aside className="side">
          <div className="videos">
            <div className="remote">
              <div>
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                  <path d="M16 10l6-3v10l-6-3" />
                </svg>
                <div className="remote-msg">Their camera is off</div>
              </div>
            </div>
            <div className="name">{remoteName}</div>
            <div className="pip" id="pip">
              You
            </div>
          </div>

          <div className="card notes">
            <div className="stabs" role="tablist" aria-label="Sidebar">
              {role === "interviewer" ? (
                <>
                  <button
                    className={`stab int-only ${sideTab === "questions" ? "on" : ""}`}
                    onClick={() => setSideTab("questions")}
                    disabled={tabDisabled}
                  >
                    Questions
                  </button>
                  <button
                    className={`stab int-only ${sideTab === "notes" ? "on" : ""}`}
                    onClick={() => setSideTab("notes")}
                    disabled={tabDisabled}
                  >
                    Notes
                  </button>
                  <button
                    className={`stab int-only ${sideTab === "score" ? "on" : ""}`}
                    onClick={() => setSideTab("score")}
                    disabled={tabDisabled}
                  >
                    Score
                  </button>
                </>
              ) : (
                <button
                  className={`stab cand-only ${sideTab === "current" ? "on" : ""}`}
                  onClick={() => setSideTab("current")}
                  disabled={tabDisabled}
                >
                  Question
                </button>
              )}
              <button
                className={`stab ${sideTab === "chat" ? "on" : ""}`}
                onClick={() => setSideTab("chat")}
              >
                Chat
                {chat.length > 0 && <span className="badge">{chat.length}</span>}
              </button>
            </div>

            {role === "interviewer" && sideTab === "questions" && (
              <div className="spane int-only" id="questions">
                {currentQuestion ? (
                  <>
                    <div className="q">
                      <small>Now asking</small>
                      <h3>{currentQuestion.q}</h3>
                    </div>
                    {currentQuestion.kind === "code" && (
                      <button
                        className="queue-send"
                        onClick={() => openCodingScreen()}
                      >
                        <span>
                          Open coding screen for “{currentQuestion.q.slice(0, 32)}{currentQuestion.q.length > 32 ? "…" : ""}”
                        </span>
                        <span className="sent">Open</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="q">
                    <small>{phaseLabel}</small>
                    <h3>Waiting for the interviewer…</h3>
                  </div>
                )}
                <div className="queue">
                  {room?.questions
                    .filter(
                      (q) => q.kind === room?.phase || q.kind === "intro" || q.kind === "open"
                    )
                    .slice(0, 6)
                    .map((q, i) => {
                      const used = q.q === currentQuestion?.q;
                      return (
                        <button
                          key={i}
                          className="queue-item"
                          onClick={() => {
                            if (q.kind === "code") {
                              openCodingScreen();
                            } else {
                              toast(`Queued “${q.q}”`, { variant: "default" });
                            }
                          }}
                          disabled={tabDisabled}
                        >
                          <span>{q.q}</span>
                          <span className={used ? "sent" : ""}>
                            {used ? "Open" : "Send"}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {role === "interviewer" && sideTab === "notes" && (
              <div className="spane int-only" id="notes">
                <textarea
                  placeholder="Private notes. The candidate can't see these."
                  value={noteValue}
                  onChange={(e) => {
                    try {
                      sessionStorage.setItem("live-notes-" + room?.code, e.target.value);
                    } catch {
                      // ignore
                    }
                  }}
                  disabled={tabDisabled}
                />
              </div>
            )}

            {role === "interviewer" && sideTab === "score" && (
              <div className="spane int-only" id="score">
                <div className="rubric" id="rubric">
                  {["Communication", "Problem solving", "Code quality"].map((label) => (
                    <div key={label} className="rubric-row">
                      <span>{label}</span>
                      <div className="stars" data-label={label}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <button
                            key={i}
                            className="star"
                            aria-label={`${label} ${i + 1}`}
                            onClick={() => {
                              const row = document.querySelector(`[data-label="${label}"]`);
                              if (!row) return;
                              const stars = [...row.querySelectorAll<HTMLButtonElement>(".star")];
                              const idx = stars.indexOf(document.activeElement as HTMLButtonElement);
                              stars.forEach((s, j) => s.classList.toggle("on", j <= idx));
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {role === "candidate" && sideTab === "current" && (
              <div className="spane cand-only" id="current">
                {currentQuestion ? (
                  <>
                    <div className="q">
                      <small>{phaseLabel}</small>
                      <h3 id="candQ">{currentQuestion.q}</h3>
                    </div>
                    <small style={{ color: "var(--muted)" }}>
                      Your interviewer can see your code and whiteboard live.
                    </small>
                  </>
                ) : (
                  <div className="q">
                    <small>{phaseLabel}</small>
                    <h3>Waiting for the interviewer…</h3>
                  </div>
                )}
              </div>
            )}

            {sideTab === "chat" && (
              <div className="spane" id="chat">
                <div className="chatlog" id="log">
                  {log.map((m, i) => (
                    <div
                      key={i}
                      className={`msg-bubble ${m.mine ? "me" : ""}`}
                    >
                      {!m.mine && <small>{m.sender}</small>}
                      {m.text}
                    </div>
                  ))}
                  <div className="typing" id="typing" hidden>
                    Candidate is typing…
                  </div>
                  <div ref={logEnd} />
                </div>
                <div className="msg">
                  <Input
                    id="live-chat-input"
                    placeholder="Message…"
                    aria-label="Message"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const el = e.currentTarget;
                      const v = el.value.trim();
                      if (!v) return;
                      send("chat", {
                        text: v,
                        name:
                          side === "Interviewer" ? "Interviewer" : "Candidate",
                      });
                      setChat((prev) => [
                        ...prev,
                        {
                          sender:
                            side === "Interviewer" ? "Interviewer" : "Candidate",
                          text: v,
                        },
                      ]);
                      el.value = "";
                    }}
                  />
                  <Button
                    className="send"
                    onClick={() => {
                      const el = document.getElementById(
                        "live-chat-input"
                      ) as HTMLInputElement | null;
                      if (!el) return;
                      const v = el.value.trim();
                      if (!v) return;
                      send("chat", {
                        text: v,
                        name:
                          side === "Interviewer" ? "Interviewer" : "Candidate",
                      });
                      setChat((prev) => [
                        ...prev,
                        {
                          sender:
                            side === "Interviewer" ? "Interviewer" : "Candidate",
                          text: v,
                        },
                      ]);
                      el.value = "";
                    }}
                  >
                    <Send className="icon" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="controls">
        <LiveAVPanel av={av} side={side} />
        <button
          className="cbtn end"
          onClick={() => {
            toast("End call is wired to the A/V panel in this build", {
              variant: "default",
            });
          }}
        >
          <Play className="icon" />
          <span>End call</span>
        </button>
      </footer>
    </div>
  );
}
