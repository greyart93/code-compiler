import { NextResponse } from "next/server";

/**
 * POST /api/tts  { text } → audio/mpeg (IRIS's voice)
 *
 * Two providers, in order:
 *   1. Fish Audio (when FISH_AUDIO has credit). IRIS's chosen model is the
 *      public "Shorekeeper" voice — young, female, warm.
 *   2. Google Translate TTS as a keyless female fallback. Fish returns 402
 *      when the account runs out of credit; without this fallback the browser
 *      would drop to the OS default voice, which is often male.
 *
 * If both providers are unavailable the client falls back to speechSynthesis
 * and picks a female system voice. The route never leaks provider errors to
 * the page.
 */

const FISH_URL = "https://api.fish.audio/v1/tts";
const GOOGLE_URL = "https://translate.google.com/translate_tts";
const DEFAULT_VOICE_ID = "c3745ad70c2a48bc9c7f6123c69d62c0";
const MAX_TEXT = 1500;

type Audio = { bytes: Uint8Array; voice: "fish" | "google" };

// Small in-memory cache: interviews repeat the same question across sessions.
const cache = new Map<string, Audio>();
const CACHE_LIMIT = 40;

// A 402 from Fish means "no credit" and will not fix itself within a request.
// Skip Fish for a while instead of paying that latency on every sentence.
let fishDisabledUntil = 0;

function remember(key: string, audio: Audio) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, audio);
}

/** Split text on sentence/word boundaries so Google's ~200-char limit is safe. */
function splitText(text: string, max = 180): string[] {
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

async function fishAudio(text: string, key: string): Promise<Uint8Array | null> {
  if (Date.now() < fishDisabledUntil) return null;

  try {
    const res = await fetch(FISH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        model: "s2.1-pro",
      },
      body: JSON.stringify({
        text,
        reference_id: process.env.FISH_VOICE_ID || DEFAULT_VOICE_ID,
        format: "mp3",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      // 402 = out of credit, 401/403 = bad key, 429 = rate limited.
      if (res.status === 402 || res.status === 401 || res.status === 403) {
        fishDisabledUntil = Date.now() + 10 * 60_000;
      } else if (res.status === 429) {
        fishDisabledUntil = Date.now() + 60_000;
      }
      console.warn("fish audio tts unavailable:", res.status);
      return null;
    }

    const buffer = await res.arrayBuffer();
    if (!buffer.byteLength) return null;
    return new Uint8Array(buffer);
  } catch (err) {
    console.warn("fish audio tts error:", err);
    return null;
  }
}

async function googleAudio(text: string): Promise<Uint8Array | null> {
  const chunks = splitText(text);
  const buffers: Uint8Array[] = [];

  for (const chunk of chunks) {
    const url =
      `${GOOGLE_URL}?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk)}`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          Referer: "https://translate.google.com/",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.warn("google tts unavailable:", res.status);
        return null;
      }
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("audio")) {
        console.warn("google tts returned non-audio:", type);
        return null;
      }
      const buffer = await res.arrayBuffer();
      if (!buffer.byteLength) return null;
      buffers.push(new Uint8Array(buffer));
    } catch (err) {
      console.warn("google tts error:", err);
      return null;
    }
  }

  if (!buffers.length) return null;
  const total = buffers.reduce((n, b) => n + b.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    merged.set(b, offset);
    offset += b.byteLength;
  }
  return merged;
}

export async function POST(request: Request) {
  let text: string | undefined = "";
  try {
    ({ text } = (await request.json()) as { text?: string });
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  text = (text ?? "").trim();
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT);

  const cached = cache.get(text);
  if (cached) return audioResponse(cached);

  const key = process.env.FISH_AUDIO;
  let audio: Audio | null = null;

  if (key) {
    const bytes = await fishAudio(text, key);
    if (bytes) audio = { bytes, voice: "fish" };
  }

  if (!audio) {
    const bytes = await googleAudio(text);
    if (bytes) audio = { bytes, voice: "google" };
  }

  if (!audio) {
    return NextResponse.json(
      { error: "TTS_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  remember(text, audio);
  return audioResponse(audio);
}

function audioResponse(audio: Audio) {
  // Blob keeps TypeScript happy across the DOM's ArrayBuffer/SharedArrayBuffer split.
  const body = new Blob([audio.bytes as unknown as BlobPart], { type: "audio/mpeg" });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.bytes.byteLength),
      "Cache-Control": "private, max-age=3600",
      "X-IRIS-Voice": audio.voice,
    },
  });
}
