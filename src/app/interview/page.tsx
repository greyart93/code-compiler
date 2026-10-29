"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Languages,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { toast } from "@/components/ui/toaster";
import { fixupTranscript } from "@/lib/speech-fixups";
import { cn } from "@/lib/utils";

type Question = { q: string; keywords?: string[]; a?: string; eval?: { score: number; feedback: string; simulated: boolean } | null };
type Session = { id: string; kind: string; topic: string; score: number | null };

const TOPICS = [
  { id: "javascript", label: "JavaScript" },
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "sql", label: "SQL" },
  { id: "mongodb", label: "MongoDB" },
  { id: "prisma", label: "Prisma / ORMs" },
];

// ───────────────────────── speech utilities ─────────────────────────

// minimal SpeechRecognition typings (lib.dom doesn't ship them)
interface SRResultItem { transcript: string }
interface SRResult { isFinal: boolean; 0: SRResultItem; length: number }
interface SREvent extends Event { resultIndex: number; results: { length: number; [i: number]: SRResult } }
interface SpeechRecognitionEvent extends SREvent {}
interface SpeechRecognitionErrorEvent extends Event { error: string }
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

/** Browser SpeechRecognition (Chrome/Edge; Firefox uses its own). */
function getRecognition(): SpeechRecognition | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

// Female voice heuristics for the browser fallback. Prefer neural/natural
// voices, and never let a male system voice win by accident.
const FEMALE_VOICE =
  /(female|aria|jenny|zira|samantha|victoria|karen|moira|tessa|fiona|serena|allison|ava|susan|hazel|libby|sonia|natasha|clara|emma|amelie|joanna|salli|kimberly|amy|nicole|olivia|coral|shimmer|sage|nova|google us english)/i;
const MALE_VOICE =
  /(male|david|mark|george|guy|ryan|brian|alex|daniel|fred|tom|james|arthur|oliver|thomas|liam|william|eric|andrew|christopher|roger|steffan|davis)/i;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve([]);

  const existing = window.speechSynthesis.getVoices();
  if (existing.length) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = done;
    window.setTimeout(done, 1500);
  });
}

function pickIrisVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const english = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const pool = english.length ? english : voices;

  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    if (FEMALE_VOICE.test(v.name)) s += 60;
    if (MALE_VOICE.test(v.name)) s -= 120;
    if (/natural|neural|online/i.test(v.name)) s += 25;
    if (/^en[-_]US/i.test(v.lang)) s += 10;
    if (!v.localService) s += 5;
    return s;
  };

  const notMale = pool.filter((v) => !MALE_VOICE.test(v.name));
  return [...(notMale.length ? notMale : pool)].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** Split long lines so Chrome's speechSynthesis doesn't truncate them. */
function splitSpeech(text: string, max = 180): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    let cut = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! ")
    );
    if (cut < max * 0.45) cut = Math.max(cut, window.lastIndexOf(", "));
    if (cut < max * 0.3) cut = window.lastIndexOf(" ");
    if (cut < 1) cut = max;
    else cut += 1;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts.filter(Boolean);
}

async function speakBrowser(text: string, rate: number, cancelled: () => boolean): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const voices = await loadVoices();
  if (cancelled()) return;

  const voice = pickIrisVoice(voices);
  const chunks = splitSpeech(text);

  await new Promise<void>((resolve) => {
    let i = 0;
    const next = () => {
      if (cancelled() || i >= chunks.length) {
        resolve();
        return;
      }
      const utter = new SpeechSynthesisUtterance(chunks[i++]);
      if (voice) utter.voice = voice;
      utter.lang = voice?.lang || "en-US";
      utter.rate = rate;
      utter.pitch = 1.06;
      utter.volume = 1;
      utter.onend = next;
      utter.onerror = next;
      window.speechSynthesis.speak(utter);
    };
    next();
  });
}

// Module-level object-URL cache: remounting the page or replaying a question
// should not hit the TTS route again.
const ttsCache = new Map<string, string>();

function cacheTts(text: string, url: string) {
  if (ttsCache.size >= 40) {
    const oldest = ttsCache.keys().next().value;
    if (oldest) {
      const oldUrl = ttsCache.get(oldest);
      ttsCache.delete(oldest);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
    }
  }
  ttsCache.set(text, url);
}

function joinText(a: string, b: string): string {
  const left = a.trim();
  const right = b.trim();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}

async function transcribeAudio(blob: Blob): Promise<string | null> {
  try {
    const body = new FormData();
    const ext = blob.type.includes("mp4")
      ? "m4a"
      : blob.type.includes("ogg")
        ? "ogg"
        : "webm";
    body.append("audio", blob, `answer.${ext}`);
    body.append("language", "en");

    const res = await fetch("/api/stt", { method: "POST", body });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    const text = String(data.text ?? "").trim();
    return text || null;
  } catch {
    return null;
  }
}

// ───────────────────────── small UI atoms ─────────────────────────

/** Pulsing halo ring around the IRIS avatar when she speaks or listens. */
function AvatarHalo({ active }: { active: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary/40" hidden={!active}>
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-primary/40"
        animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
    </span>
  );
}

/** Five-bar soundwave that dances when listening / speaking. */
function SoundBars({ active }: { active: boolean }) {
  const heights = [10, 16, 22, 16, 10];
  return (
    <span className="flex h-6 items-end gap-[3px]" aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-primary"
          style={{ height: h }}
          animate={active ? { scaleY: [1, 0.45, 1.15, 0.7, 1] } : { scaleY: 0.35 }}
          transition={
            active
              ? { duration: 0.9, repeat: Infinity, delay: i * 0.09, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        />
      ))}
    </span>
  );
}

/** Animated circular score meter (0–10) for the summary screen. */
function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score * 10));
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative mx-auto size-32">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="stroke-muted" />
        <motion.circle
          cx="60" cy="60" r={R} fill="none" strokeWidth="9" strokeLinecap="round"
          className={score >= 7 ? "stroke-green-500" : score >= 4 ? "stroke-primary" : "stroke-destructive"}
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (C * pct) / 100 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}/10
        </motion.span>
        <span className="text-xs text-muted-foreground">IRIS score</span>
      </div>
    </div>
  );
}

// ───────────────────────────────── page ─────────────────────────────────

export default function InterviewPage() {
  const [kind, setKind] = useState<"pick" | "tech" | "english">("pick");
  const [topic, setTopic] = useState(TOPICS[0].id);

  // session state
  const [stage, setStage] = useState<"loading" | "asking" | "listening" | "grading" | "done">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [transcript, setTranscript] = useState(""); // live interim words
  const [previewFinal, setPreviewFinal] = useState(""); // browser preview of the current take
  const [finalAnswer, setFinalAnswer] = useState(""); // committed answer (typed + Whisper)
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [previewUnavailable, setPreviewUnavailable] = useState(false);
  const [muted, setMuted] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);

  // speech / recording refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const previewActiveRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortSpeechRef = useRef<AbortController | null>(null);
  const finishSpeechRef = useRef<(() => void) | null>(null);
  const speechEpochRef = useRef(0);
  const speakRef = useRef<((text: string, rate?: number) => Promise<void>) | null>(null);

  // recorder refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const captureEpochRef = useRef(0);
  const startingRef = useRef(false);

  // answer / question tracking
  const finalAnswerRef = useRef("");
  const previewFinalRef = useRef("");
  const mutedRef = useRef(false);
  const spokenIdxRef = useRef<number | null>(null);
  const introRef = useRef<string | null>(null);

  const current = questions[idx];
  const answered = questions.filter((q) => q.eval).length;
  const displayAnswer = joinText(finalAnswer, previewFinal);

  const commitAnswer = useCallback((value: string) => {
    finalAnswerRef.current = value;
    setFinalAnswer(value);
  }, []);

  /** Hard-stop any queued, playing or still-downloading speech. */
  const cancelSpeech = useCallback(() => {
    speechEpochRef.current += 1;
    abortSpeechRef.current?.abort();
    abortSpeechRef.current = null;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {
        /* already detached */
      }
    }

    const finish = finishSpeechRef.current;
    finishSpeechRef.current = null;
    finish?.();
  }, []);

  /**
   * IRIS speaks through /api/tts (Fish Audio → keyless female fallback).
   * The promise resolves when audio finishes OR when cancelSpeech() invalidates
   * this turn, so a late TTS response can never talk over the next question.
   */
  speakRef.current = (text: string, rate = 1) =>
    new Promise<void>((resolve) => {
      const token = speechEpochRef.current;
      const cancelled = () => token !== speechEpochRef.current;
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        if (finishSpeechRef.current === finish) finishSpeechRef.current = null;
        resolve();
      };
      finishSpeechRef.current = finish;

      const browserFallback = () => {
        if (cancelled()) return finish();
        void speakBrowser(text, rate, cancelled).then(finish);
      };

      const play = (url: string) => {
        if (cancelled()) return finish();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = rate;
        audio.onended = finish;
        audio.onerror = () => {
          if (audioRef.current === audio) audioRef.current = null;
          browserFallback();
        };
        audio.play().catch(() => {
          if (audioRef.current === audio) audioRef.current = null;
          browserFallback();
        });
      };

      const cached = ttsCache.get(text);
      if (cached) return play(cached);

      const controller = new AbortController();
      abortSpeechRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 20_000);

      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
        .then(async (res) => {
          window.clearTimeout(timeout);
          if (cancelled()) return finish();
          if (!res.ok) return browserFallback();

          const blob = await res.blob();
          if (cancelled()) return finish();
          if (!blob.size) return browserFallback();

          const url = URL.createObjectURL(blob);
          cacheTts(text, url);
          play(url);
        })
        .catch(() => {
          window.clearTimeout(timeout);
          if (cancelled()) finish();
          else browserFallback();
        });
    });

  // ── browser preview (interim words only; Whisper is authoritative) ──
  const stopPreview = useCallback(() => {
    previewActiveRef.current = false;
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      try {
        rec.stop();
      } catch {
        /* not started */
      }
    }
    setTranscript("");
  }, []);

  const startPreview = useCallback((epoch: number) => {
    if (!getRecognition()) {
      setPreviewUnavailable(true);
      return;
    }

    previewActiveRef.current = true;

    const open = () => {
      if (!previewActiveRef.current || captureEpochRef.current !== epoch) return;
      const rec = getRecognition();
      if (!rec) return;

      recognitionRef.current = rec;
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const text = fixupTranscript(result[0].transcript);
            if (text) {
              previewFinalRef.current = joinText(previewFinalRef.current, text);
              setPreviewFinal(previewFinalRef.current);
            }
          } else {
            interim += result[0].transcript;
          }
        }
        setTranscript(interim.trim());
      };

      rec.onerror = (event) => {
        const err = event.error;
        // A dead preview must not stop the MediaRecorder; Whisper still has the audio.
        if (err === "no-speech" || err === "aborted") return;
        previewActiveRef.current = false;
        setPreviewUnavailable(true);
      };

      rec.onend = () => {
        recognitionRef.current = null;
        // Chrome ends continuous recognition after a pause. Keep the preview
        // alive for as long as the user is still recording.
        if (previewActiveRef.current && captureEpochRef.current === epoch) {
          window.setTimeout(() => {
            if (previewActiveRef.current && captureEpochRef.current === epoch) open();
          }, 280);
        }
      };

      try {
        rec.start();
      } catch {
        /* Chrome can throw if two starts race; the next onend retry handles it */
      }
    };

    open();
  }, []);

  // ── recording ──
  const startRecorder = useCallback((stream: MediaStream) => {
    if (typeof MediaRecorder === "undefined") return false;

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        return false;
      }
    }

    const chunks: Blob[] = [];
    chunksRef.current = chunks;
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };

    try {
      recorder.start(250);
    } catch {
      recorderRef.current = null;
      return false;
    }

    recorderRef.current = recorder;
    return true;
  }, []);

  const stopCapture = useCallback(async (): Promise<Blob | null> => {
    stopPreview();

    const recorder = recorderRef.current;
    recorderRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    const chunks = chunksRef.current;
    chunksRef.current = [];
    setListening(false);

    if (!recorder || recorder.state === "inactive") {
      stream?.getTracks().forEach((track) => track.stop());
      return null;
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || chunks[0]?.type || "audio/webm";
        const out = new Blob(chunks, { type });
        resolve(out.size ? out : null);
      };
      try {
        recorder.stop();
      } catch {
        resolve(null);
      }
    });

    stream?.getTracks().forEach((track) => track.stop());
    return blob;
  }, [stopPreview]);

  const startListening = useCallback(async () => {
    if (listening || recorderRef.current || transcribing || startingRef.current) return;
    startingRef.current = true;

    cancelSpeech();
    previewFinalRef.current = "";
    setPreviewFinal("");
    setTranscript("");
    setPreviewUnavailable(false);

    const epoch = ++captureEpochRef.current;
    const canRecord =
      typeof MediaRecorder !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;

    if (!canRecord) {
      startingRef.current = false;
      if (!getRecognition()) {
        setSttSupported(false);
        toast(
          "This browser can't record audio — use Chrome or Edge, or type your answer.",
          { variant: "error" }
        );
        return;
      }
      // Last-resort browsers: live recognition becomes the answer text.
      startPreview(epoch);
      setListening(true);
      setStage("listening");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      startingRef.current = false;

      if (captureEpochRef.current !== epoch) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      startRecorder(stream);
      startPreview(epoch);
      setListening(true);
      setStage("listening");
    } catch (err) {
      startingRef.current = false;
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "SecurityError") {
        toast(
          "Microphone blocked — click the camera/mic icon in the address bar and allow the mic for this site.",
          { variant: "error" }
        );
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        toast("No microphone found — plug one in or select it in your system sound settings.", {
          variant: "error",
        });
      } else if (e.name === "NotReadableError") {
        toast("Your microphone is busy in another app — close it and press Answer again.", {
          variant: "error",
        });
      } else {
        toast("Couldn't open the microphone — you can still type your answer.", {
          variant: "error",
        });
      }
      setListening(false);
      setStage("listening");
    }
  }, [cancelSpeech, listening, startPreview, startRecorder, transcribing]);

  /** Turn the take into text: Whisper first, browser preview only as fallback. */
  const resolveCapture = useCallback(async (blob: Blob | null, epoch: number) => {
    let whispered: string | null = null;
    if (blob) whispered = await transcribeAudio(blob);

    // A reset/new question happened while Whisper was working — discard.
    if (captureEpochRef.current !== epoch) return finalAnswerRef.current;

    const heard = whispered || previewFinalRef.current;
    const merged = joinText(finalAnswerRef.current, heard);
    commitAnswer(merged);
    previewFinalRef.current = "";
    setPreviewFinal("");
    setTranscript("");
    return merged;
  }, [commitAnswer]);

  const closeMic = useCallback(async () => {
    if (transcribing) return;

    const epoch = captureEpochRef.current;
    setTranscribing(true);
    const blob = await stopCapture();
    const merged = await resolveCapture(blob, epoch);
    setTranscribing(false);

    if (captureEpochRef.current !== epoch) return;

    if (!merged.trim()) {
      toast("I didn't catch that — press Answer and speak again, or type your answer.", {
        variant: "error",
      });
    }
  }, [resolveCapture, stopCapture, transcribing]);

  const askQuestion = useCallback(
    async (text: string) => {
      cancelSpeech();
      const epoch = speechEpochRef.current;

      if (mutedRef.current) {
        setStage("listening");
        return;
      }

      setStage("asking");
      await speakRef.current?.(text);

      // Only this turn may move the session out of "Speaking…".
      if (speechEpochRef.current === epoch) setStage("listening");
    },
    [cancelSpeech]
  );

  // Speak once per question. Deliberately keyed to the index, not the object,
  // so grading metadata updates don't replay the last question after Submit.
  useEffect(() => {
    if (!current || stage === "done") return;
    if (spokenIdxRef.current === idx) return;

    spokenIdxRef.current = idx;
    const intro = introRef.current;
    introRef.current = null;

    void askQuestion(intro ? `${intro} ${current.q}` : current.q);
  }, [current, idx, stage, askQuestion]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // mic availability check
  useEffect(() => {
    const canRecord =
      typeof MediaRecorder !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    setSttSupported(canRecord || !!getRecognition());
  }, []);

  // hard cleanup on unmount — no mic left open, no audio after navigation
  useEffect(() => {
    return () => {
      speechEpochRef.current += 1;
      abortSpeechRef.current?.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      previewActiveRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* not started */
      }
      try {
        recorderRef.current?.stop();
      } catch {
        /* not started */
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const submitAnswer = async () => {
    if (!current || stage === "grading" || transcribing) return;

    const epoch = captureEpochRef.current;
    let answer = finalAnswerRef.current.trim();

    // If the mic is still open, stop it and transcribe before grading.
    if (listening || recorderRef.current) {
      setTranscribing(true);
      const blob = await stopCapture();
      answer = (await resolveCapture(blob, epoch)).trim();
      setTranscribing(false);
      if (captureEpochRef.current !== epoch) return;
    }

    cancelSpeech();

    if (!answer) {
      toast("Say something first — I can't grade silence.", { variant: "error" });
      setStage("listening");
      return;
    }

    setStage("grading");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: current.q,
          answer,
          kind,
          keywords: current.keywords,
        }),
      });
      if (!res.ok) throw new Error("grade failed");
      const data = await res.json();
      const clamped = Math.max(0, Math.min(10, Number(data.score ?? 0)));
      const evalr = { score: clamped, feedback: String(data.feedback ?? ""), simulated: !!data.simulated };

      const updated = questions.map((q, i) =>
        i === idx ? { ...q, a: answer, eval: evalr } : q
      );
      setQuestions(updated);
      commitAnswer("");
      previewFinalRef.current = "";
      setPreviewFinal("");
      setTranscript("");

      if (idx < questions.length - 1) {
        // The effect above speaks the next question exactly once.
        setIdx(idx + 1);
      } else {
        await finishSession(updated);
      }
    } catch {
      toast("Grading failed — check your connection.", { variant: "error" });
      setStage("listening");
    }
  };

  const finishSession = async (finalQs: Question[]) => {
    cancelSpeech();
    try {
      const res = await fetch("/api/interview", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          topic: kind === "english" ? "english" : topic,
          questions: finalQs.map(({ q, a, eval: e }) => ({ q, a, eval: e })),
        }),
      });
      const data = await res.json();
      if (data.session?.id) toast("Session saved to your profile 🎉", { variant: "success" });
    } catch {
      /* best effort */
    }
    setStage("done");
  };

  // ── start a round ──
  const begin = async (k: "tech" | "english") => {
    cancelSpeech();
    void stopCapture();
    captureEpochRef.current += 1;

    setKind(k);
    setStage("loading");
    setQuestions([]);
    setIdx(0);
    commitAnswer("");
    previewFinalRef.current = "";
    setPreviewFinal("");
    setTranscript("");
    spokenIdxRef.current = null;
    introRef.current =
      k === "english"
        ? "Hi, I'm IRIS. This is a mock English-speaking interview, so just speak naturally. Here's the first question."
        : "Hi, I'm IRIS, your technical interviewer. Let's begin with the first question.";

    try {
      const res = await fetch(`/api/interview?topic=${k === "english" ? "english" : topic}`);
      if (!res.ok) throw new Error("question fetch failed");
      const data = await res.json();
      const next = (data.questions ?? []) as Question[];
      if (!next.length) throw new Error("empty question bank");

      setQuestions(next);
      setIdx(0);
    } catch {
      introRef.current = null;
      toast("Couldn't load the interview questions — try again in a moment.", {
        variant: "error",
      });
      setKind("pick");
      setStage("loading");
    }
  };

  const reset = () => {
    cancelSpeech();
    void stopCapture();
    captureEpochRef.current += 1;
    setTranscribing(false);
    setKind("pick");
    setQuestions([]);
    setIdx(0);
    setStage("loading");
    commitAnswer("");
    previewFinalRef.current = "";
    setPreviewFinal("");
    setTranscript("");
    spokenIdxRef.current = null;
    introRef.current = null;
  };

  const toggleMute = () => {
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      cancelSpeech();
      if (stage === "asking") setStage("listening");
    }
  };

  const clearAnswer = () => {
    if (listening || recorderRef.current) {
      captureEpochRef.current += 1;
      void stopCapture();
    }
    commitAnswer("");
    previewFinalRef.current = "";
    setPreviewFinal("");
    setTranscript("");
  };

  const iriStatus =
    stage === "asking"
      ? "Speaking…"
      : stage === "grading"
        ? "Grading…"
        : transcribing
          ? "Transcribing…"
          : listening
            ? "Listening…"
            : "Ready";

  // ───────────────────────────── render ─────────────────────────────

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <AnimatePresence mode="wait">
          {kind === "pick" ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <header className="reveal border-b border-border pb-8">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div className="min-w-0">
                    <p className="mono-label">IRIS · voice-first mock interviews</p>
                    <h1 className="display mt-3 text-[clamp(44px,8vw,92px)]">Practice out loud.</h1>
                    <p className="mt-4 max-w-[62ch] text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
                      A voice-first interviewer. IRIS speaks her questions, listens through your
                      microphone, and scores every answer with feedback. Type instead if you would
                      rather not use the mic.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="chip">
                      <Sparkles className="size-3" /> AI scored
                    </span>
                    <span className="chip">/10 feedback</span>
                  </div>
                </div>
              </header>

              <div className="mt-7 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
                {/* technical */}
                <section className="card-surface flex flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="size-5" />
                      </span>
                      <div>
                        <p className="mono-label !text-[8.5px]">Mode 01</p>
                        <p className="text-[14px] font-semibold">Technical interview</p>
                      </div>
                    </div>
                    <span className="mono-label !text-[8.5px]">{TOPICS.length} topics</span>
                  </div>

                  <h2 className="display mt-6 text-[32px] leading-[1.05]">
                    One topic.
                    <br />
                    Sharp questions.
                  </h2>
                  <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
                    Rapid-fire questions on a single topic, graded for correctness and depth. Pick
                    the subject you want to be questioned on.
                  </p>

                  <p className="mono-label mt-6">Choose a topic</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {TOPICS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTopic(t.id)}
                        className={cn("chip", topic === t.id && "chip-active")}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 mt-7">
                    <span className="mono-label !text-[8.5px]">speaks · listens · scores</span>
                    <Button onClick={() => begin("tech")} className="gap-1.5">
                      Start technical <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </section>

                {/* english */}
                <section className="flex flex-col rounded-3xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-white/10">
                        <Languages className="size-5" />
                      </span>
                      <div>
                        <p className="mono-label !text-[8.5px] !text-[var(--paper)]/45">Mode 02</p>
                        <p className="text-[14px] font-semibold">English interview</p>
                      </div>
                    </div>
                    <span className="mono-label !text-[8.5px] !text-[var(--paper)]/40">behavioral</span>
                  </div>

                  <h2 className="display mt-6 text-[32px] leading-[1.05]">
                    Tell me about
                    <br />
                    yourself.
                  </h2>
                  <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-[var(--paper)]/60">
                    An open-ended warm-up for real conversations — the kind where there is no
                    single right answer.
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {[
                      "Introduction and background",
                      "Expectations and motivation",
                      "Your questions for the interviewer",
                    ].map((line, i) => (
                      <li key={line} className="flex gap-2.5">
                        <span className="mono-label shrink-0 !text-[8.5px] !text-[var(--paper)]/35">
                          0{i + 1}
                        </span>
                        <span className="text-[12.5px] leading-relaxed text-[var(--paper)]/65">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 mt-7">
                    <span className="mono-label !text-[8.5px] !text-[var(--paper)]/40">no right answer</span>
                    <button
                      type="button"
                      onClick={() => begin("english")}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--paper)] px-4 text-[12.5px] font-semibold text-[var(--ink)] transition-transform hover:-translate-y-0.5"
                    >
                      Start English <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </section>
              </div>

              <div className="mt-5 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {[
                  [`${TOPICS.length}`, "topics"],
                  ["6", "questions"],
                  ["/10", "feedback"],
                ].map(([v, l]) => (
                  <div key={l} className="px-5 py-4">
                    <p className="kpi-num text-[26px]">{v}</p>
                    <p className="mono-label mt-1 !text-[8.5px]">{l}</p>
                  </div>
                ))}
              </div>

              {!sttSupported && (
                <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-[12px] leading-relaxed text-amber-700 dark:text-amber-400">
                  This browser does not expose the microphone APIs. Use Chrome or Edge for voice —
                  typed answers still work here.
                </p>
              )}
            </motion.div>
          ) : stage === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                  <p className="mono-label">Session complete · {kind === "tech" ? "technical" : "english"}</p>
                  <h1 className="display mt-3 text-[clamp(38px,6vw,64px)]">Not bad out loud.</h1>
                  <p className="mt-3 max-w-[56ch] text-[13.5px] leading-relaxed text-muted-foreground">
                    IRIS saved this session. Read the feedback, then run another round — the score
                    climbs with repetition.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={reset} className="gap-1.5">
                    <RotateCcw className="size-4" /> New session
                  </Button>
                  <Button asChild>
                    <Link href="/dashboard">See your dashboard</Link>
                  </Button>
                </div>
              </header>

              <div className="mt-6 grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="card-surface p-6 text-center">
                  <ScoreRing
                    score={Math.round(
                      questions.reduce((s, q) => s + (q.eval?.score ?? 0), 0) /
                        Math.max(1, questions.filter((q) => q.eval).length)
                    )}
                  />
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-left">
                    <div>
                      <p className="kpi-num text-[22px]">{questions.filter((q) => q.eval).length}</p>
                      <p className="mono-label mt-1 !text-[8px]">answered</p>
                    </div>
                    <div>
                      <p className="kpi-num text-[22px]">{questions.length}</p>
                      <p className="mono-label mt-1 !text-[8px]">questions</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                    A score below 7 means there is room to sharpen the answer, not that the interview
                    went badly.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-baseline justify-between border-b border-border pb-2">
                    <h2 className="text-[18px] font-semibold tracking-[-0.02em]">The answers</h2>
                    <span className="mono-label !text-[9px]">{questions.length} questions</span>
                  </div>
                  {questions.map((q, i) => (
                    <motion.article
                      key={i}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="card-surface p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="mono-label !text-[8.5px]">Question {String(i + 1).padStart(2, "0")}</p>
                        <span
                          className={cn(
                            "mono-label !text-[9px]",
                            (q.eval?.score ?? 0) >= 7
                              ? "text-emerald-600 dark:text-emerald-400"
                              : (q.eval?.score ?? 0) >= 4
                                ? "text-primary"
                                : "text-destructive"
                          )}
                        >
                          {q.eval?.score}/10
                        </span>
                      </div>
                      <p className="mt-2 text-[14.5px] font-medium leading-snug">{q.q}</p>
                      <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-muted-foreground">
                        {q.a || "— no answer recorded —"}
                      </p>
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="mono-label !text-[8px]">IRIS feedback</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-foreground/80">
                          {q.eval?.feedback || "No feedback recorded."}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="grid items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
                {/* presence rail */}
                <aside className="card-surface p-5 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between">
                    <p className="mono-label">Live session</p>
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="mono-label !text-[8px]">on air</span>
                    </span>
                  </div>

                  <div className="relative mx-auto mt-6 grid size-24 place-items-center rounded-full bg-primary/10 text-3xl ring-1 ring-primary/20">
                    <AvatarHalo active={stage === "asking" || listening || transcribing} />
                    🎙️
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-[15px] font-semibold">IRIS</p>
                    <p className="mono-label mt-1 !text-[8.5px]">
                      {kind === "tech"
                        ? `technical · ${TOPICS.find((t) => t.id === topic)?.label}`
                        : "english · behavioral"}
                    </p>
                    <div className="mt-2.5 flex justify-center">
                      <SoundBars active={stage === "asking" || listening || transcribing} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{iriStatus}</p>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <span className="mono-label !text-[8.5px]">progress</span>
                      <span className="mono-label !text-[8.5px]">
                        {answered}/{questions.length}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        animate={{ width: `${(answered / Math.max(1, questions.length)) * 100}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleMute}
                      className="gap-1.5"
                    >
                      {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                      {muted ? "Unmute" : "Mute"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={reset}>
                      End
                    </Button>
                  </div>

                  <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                    Speak naturally and pause as long as you like — IRIS keeps recording until you
                    stop the mic.
                  </p>
                </aside>

                {/* question + transcript */}
                <section className="card-surface overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <span className="mono-label !text-[8.5px]">
                      Question {idx + 1} / {questions.length}
                    </span>
                    <span className="mono-label !text-[8.5px]">graded /10</span>
                  </div>

                  <div className="p-5 sm:p-7">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                      >
                        <p className="mono-label flex items-center gap-1.5 !text-[8.5px] text-primary">
                          <Sparkles className="size-3" /> IRIS asks
                        </p>
                        <h2 className="display mt-3 text-[clamp(26px,3.8vw,40px)] leading-[1.08]">
                          {current?.q}
                        </h2>
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-5 min-h-[140px] rounded-2xl bg-[var(--ink)] p-4 text-[var(--paper)]">
                      <div className="flex items-center justify-between">
                        <span className="mono-label !text-[8px] !text-[var(--paper)]/35">
                          live transcript
                        </span>
                        {(listening || transcribing) && <SoundBars active />}
                      </div>
                      <div className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--paper)]/80">
                        {displayAnswer || (
                          <span className="text-[var(--paper)]/30">
                            Press “Answer” and speak — IRIS records, then transcribes accurately.
                          </span>
                        )}
                        {transcript && <span className="text-[var(--paper)]/45"> {transcript}</span>}
                        {listening && (
                          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse rounded-full bg-primary align-text-bottom" />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <AnimatePresence mode="wait" initial={false}>
                        {listening ? (
                          <motion.div
                            key="stop"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                          >
                            <Button
                              variant="destructive"
                              onClick={closeMic}
                              disabled={transcribing}
                              className="gap-1.5"
                            >
                              {transcribing ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MicOff className="size-4" />
                              )}
                              {transcribing ? "Transcribing…" : "Stop & transcribe"}
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="start"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                          >
                            <Button
                              onClick={startListening}
                              disabled={transcribing || stage === "grading"}
                              className="gap-1.5"
                            >
                              <Mic className="size-4" />
                              {sttSupported
                                ? finalAnswer
                                  ? "Continue answer"
                                  : `Answer ${idx + 1}`
                                : "Open mic"}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        variant="ghost"
                        onClick={clearAnswer}
                        disabled={transcribing}
                      >
                        Clear
                      </Button>

                      <Button
                        className="ml-auto gap-1.5"
                        onClick={submitAnswer}
                        disabled={
                          stage === "grading" ||
                          transcribing ||
                          (!finalAnswer.trim() && !previewFinal.trim() && !listening)
                        }
                      >
                        {stage === "grading" ? (
                          <>
                            <Loader2 className="size-4 animate-spin" /> IRIS is thinking…
                          </>
                        ) : transcribing ? (
                          <>
                            <Loader2 className="size-4 animate-spin" /> Transcribing…
                          </>
                        ) : (
                          <>
                            Submit answer <ArrowRight className="size-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    <Textarea
                      className="mt-3 min-h-[92px]"
                      placeholder={
                        sttSupported
                          ? "…or type / correct your answer here"
                          : "Type your answer instead…"
                      }
                      value={finalAnswer}
                      onChange={(e) => commitAnswer(e.target.value)}
                      disabled={transcribing}
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      Live words above are a preview. When you stop the mic, IRIS transcribes the
                      recording accurately — type here to fix anything before submitting.
                    </p>

                    {listening && (
                      <motion.p
                        className="mt-3 flex items-center gap-2 text-[11.5px] text-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                        </span>
                        Listening… IRIS will transcribe when you stop.
                      </motion.p>
                    )}

                    {listening && previewUnavailable && (
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        Live preview isn&apos;t available in this browser, but the recording is
                        still running — stop the mic and IRIS will transcribe it accurately.
                      </p>
                    )}

                    {transcribing && (
                      <motion.p
                        className="mt-3 flex items-center gap-2 text-[11.5px] text-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="size-3.5 animate-spin" />
                        Transcribing your answer…
                      </motion.p>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
