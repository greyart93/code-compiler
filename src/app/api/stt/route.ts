import { NextResponse, after } from "next/server";
import { getSessionClaims } from "@/lib/auth";
import { recordTranscription, type TranscriptionRecord } from "@/lib/transcription-log";

/**
 * POST /api/stt  (multipart: audio=<blob>, language=en,
 *                 durationMs, silenceRatio, retryCount) → { text }
 *
 * Whisper is the only source of the answer that gets graded. Every request is
 * also summarised into `TranscriptionLog` — provider, model, duration,
 * silence/confidence signals, retry count — so a misheard answer can be
 * diagnosed later. No audio and no transcript text is ever stored.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 20 * 1024 * 1024; // Whisper's own limit is 25 MB

const PROMPT = [
  "Technical mock-interview answer.",
  "Expect terms such as JavaScript, TypeScript, React, Next.js, hooks, useState,",
  "useEffect, component, props, state, closure, hoisting, event loop, microtask,",
  "promise, async await, callback, API, REST, JSON, SQL, Postgres, MySQL, MongoDB,",
  "Prisma, schema, query, index, join, virtual DOM, SSR, hydration, Big O,",
  "debounce, throttle, deep clone, strict equality, event loop.",
].join(" ");

type Provider = {
  name: "groq" | "openai";
  url: string;
  key: string;
  model: string;
};

type Segment = {
  avg_logprob?: number;
  no_speech_prob?: number;
  compression_ratio?: number;
};

/** verbose_json payload — the confidence/silence numbers live in `segments`. */
type VerboseTranscript = {
  text?: string;
  duration?: number;
  segments?: Segment[];
};

const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Feed a client hint through safely: absent/garbage → null, else clamped. */
function hint(value: FormDataEntryValue | null, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form data" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "audio is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That recording is too long. Keep answers under about 10 minutes." },
      { status: 413 }
    );
  }
  if (file.type && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
    return NextResponse.json({ error: "unsupported audio type" }, { status: 415 });
  }

  const language = String(form.get("language") ?? "en")
    .slice(0, 8)
    .replace(/[^a-zA-Z-]/g, "") || "en";

  // Client-side context: how long the mic was open, how much of it was quiet,
  // and whether this take is already a retry. Metadata only — never the words.
  const audioMs = hint(form.get("durationMs"), 0, 600_000);
  const silenceRatio = hint(form.get("silenceRatio"), 0, 1);
  const retryCount = Math.round(hint(form.get("retryCount"), 0, 20) ?? 0);

  const claims = await getSessionClaims();

  const providers: Provider[] = [];
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      url: "https://api.groq.com/openai/v1/audio/transcriptions",
      key: process.env.GROQ_API_KEY,
      // Full large-v3 beats turbo on accents and technical jargon, which is
      // exactly where the interviewer kept mishearing answers.
      model: "whisper-large-v3",
    });
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      url: "https://api.openai.com/v1/audio/transcriptions",
      key: process.env.OPENAI_API_KEY,
      model: "whisper-1",
    });
  }

  if (!providers.length) {
    return NextResponse.json({ error: "STT_NOT_CONFIGURED" }, { status: 503 });
  }

  const filename =
    file.name && file.name !== "blob"
      ? file.name
      : file.type.includes("mp4")
        ? "answer.m4a"
        : file.type.includes("ogg")
          ? "answer.ogg"
          : "answer.webm";

  const base: Omit<TranscriptionRecord, "provider" | "model" | "status" | "latencyMs"> = {
    userId: claims?.id ?? null,
    audioBytes: file.size,
    audioMs,
    silenceRatio,
    retryCount,
  };

  let lastProvider = providers[providers.length - 1];

  for (const provider of providers) {
    lastProvider = provider;
    const startedAt = Date.now();

    try {
      const upstream = new FormData();
      upstream.append("file", file, filename);
      upstream.append("model", provider.model);
      upstream.append("language", language);
      // verbose_json carries duration + per-segment confidence, which plain
      // json drops. It is what makes "heard silence" diagnosable at all.
      upstream.append("response_format", "verbose_json");
      upstream.append("temperature", "0");
      upstream.append("prompt", PROMPT);

      const res = await fetch(provider.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${provider.key}` },
        body: upstream,
        cache: "no-store",
        signal: AbortSignal.timeout(45_000),
      });

      const latencyMs = Date.now() - startedAt;

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.warn(`stt ${provider.name} failed:`, res.status, detail.slice(0, 240));
        after(() =>
          recordTranscription({
            ...base,
            provider: provider.name,
            model: provider.model,
            status: "error",
            errorCode: `HTTP_${res.status}`,
            httpStatus: res.status,
            latencyMs,
          })
        );
        continue;
      }

      const data = (await res.json().catch(() => null)) as VerboseTranscript | null;
      const text = String(data?.text ?? "").trim();
      const segments = Array.isArray(data?.segments) ? data!.segments! : [];

      const logprobs = segments.map((s) => finite(s.avg_logprob)).filter((n): n is number => n !== null);
      const noSpeech = segments
        .map((s) => finite(s.no_speech_prob))
        .filter((n): n is number => n !== null);
      const compression = segments
        .map((s) => finite(s.compression_ratio))
        .filter((n): n is number => n !== null);

      const diagnostics = {
        durationMs: finite(data?.duration) !== null ? Math.round(data!.duration! * 1000) : null,
        noSpeechProb: noSpeech.length ? Math.max(...noSpeech) : null,
        avgLogprob: logprobs.length
          ? Math.round((logprobs.reduce((a, b) => a + b, 0) / logprobs.length) * 1000) / 1000
          : null,
        compressionRatio: compression.length ? Math.max(...compression) : null,
      };

      if (!text) {
        after(() =>
          recordTranscription({
            ...base,
            ...diagnostics,
            provider: provider.name,
            model: provider.model,
            status: "empty",
            latencyMs,
          })
        );
        continue;
      }

      after(() =>
        recordTranscription({
          ...base,
          ...diagnostics,
          provider: provider.name,
          model: provider.model,
          status: "ok",
          latencyMs,
          transcriptChars: text.length,
        })
      );

      return NextResponse.json({ text, provider: provider.name });
    } catch (err) {
      const message = (err as Error)?.name === "TimeoutError" ? "TIMEOUT" : "UPSTREAM";
      console.warn(`stt ${provider.name} error:`, err);
      after(() =>
        recordTranscription({
          ...base,
          provider: provider.name,
          model: provider.model,
          status: "error",
          errorCode: message,
          latencyMs: Date.now() - startedAt,
        })
      );
    }
  }

  return NextResponse.json(
    { error: "STT_UNAVAILABLE" },
    {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
