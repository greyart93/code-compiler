import "server-only";

/**
 * AI adapter for IRIS.
 *
 * Uses any OpenAI-compatible /chat/completions endpoint.
 *
 * Default provider: Groq (https://console.groq.com) — free tier, no card,
 * and it does not train on or retain inference data by default.
 *   OPENAI_API_KEY   → your Groq API key (starts with "gsk_...");
 *                      GROQ_API_KEY is accepted as an alias
 *   OPENAI_BASE_URL  (default https://api.groq.com/openai/v1)
 *   OPENAI_MODEL     (default openai/gpt-oss-120b — was llama-3.3-70b-versatile,
 *                     which Groq retired; check the Groq models page for current IDs)
 *
 * Other OpenAI-compatible providers work too — just point OPENAI_BASE_URL
 * elsewhere, e.g. Gemini: https://generativelanguage.googleapis.com/v1beta/openai/
 * or OpenAI: https://api.openai.com/v1
 *
 * With no key configured, every call falls back to a deterministic local
 * "simulated" reply so interviews still work end-to-end (clearly labelled).
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const BASE_URL = (process.env.OPENAI_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
const MODEL = process.env.OPENAI_MODEL ?? "openai/gpt-oss-120b";

export function aiConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY ?? process.env.GROQ_API_KEY);
}

export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<{ text: string; simulated: boolean }> {
  const key = process.env.OPENAI_API_KEY ?? process.env.GROQ_API_KEY;
  if (!key) {
    return { text: fallbackReply(messages), simulated: true };
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 500,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? "", simulated: false };
}

/** JSON-only completion (used for answer evaluation). Throws on malformed JSON after retries. */
export async function chatJSON<T>(
  messages: ChatMessage[],
  opts: { temperature?: number } = {}
): Promise<T> {
  const out = await chat(messages, { temperature: opts.temperature ?? 0.2, maxTokens: 400 });
  if (out.simulated) throw new Error("AI_NOT_CONFIGURED");
  // tolerate ```json fences
  const m = out.text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI_BAD_JSON");
  return JSON.parse(m[0]) as T;
}

/** Deterministic scripted reply when no provider key is set — keeps interviews usable. */
function fallbackReply(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  return `— IRIS runs in offline mode (no OPENAI_API_KEY configured), so I can't generate live speech or evaluate answers with a real model. Here's how I'd proceed: your last message was "${last.slice(0, 120)}". Once a Groq key is set, I ask interview questions, listen through your microphone, transcribe with the browser's speech API, and score each answer with feedback.`;
}
