import { NextResponse } from "next/server";

/**
 * POST /api/stt  (multipart: audio=<blob>, language=en) → { text }
 *
 * Browser SpeechRecognition is only used for the live preview; it is fast but
 * weak on accents and developer jargon. The answer that actually gets graded
 * comes from Whisper, which is far more accurate. Groq is the primary provider
 * (fast + cheap); OpenAI is a secondary if a key is present.
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

  const providers: Provider[] = [];
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      url: "https://api.groq.com/openai/v1/audio/transcriptions",
      key: process.env.GROQ_API_KEY,
      model: "whisper-large-v3-turbo",
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

  for (const provider of providers) {
    try {
      const upstream = new FormData();
      upstream.append("file", file, filename);
      upstream.append("model", provider.model);
      upstream.append("language", language);
      upstream.append("response_format", "json");
      upstream.append("temperature", "0");
      upstream.append("prompt", PROMPT);

      const res = await fetch(provider.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${provider.key}` },
        body: upstream,
        cache: "no-store",
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.warn(
          `stt ${provider.name} failed:`,
          res.status,
          detail.slice(0, 240)
        );
        continue;
      }

      const data = (await res.json()) as { text?: string };
      const text = String(data.text ?? "").trim();
      if (!text) continue;

      return NextResponse.json({ text, provider: provider.name });
    } catch (err) {
      console.warn(`stt ${provider.name} error:`, err);
    }
  }

  return NextResponse.json(
    { error: "STT_UNAVAILABLE" },
    { status: 502, headers: { "Cache-Control": "no-store" } }
  );
}
