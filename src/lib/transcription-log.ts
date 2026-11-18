import "server-only";
import { prisma } from "@/lib/db";

/**
 * Interview transcription diagnostics.
 *
 * What we store: provider, model, outcome, latency, byte/duration counts,
 * silence and confidence signals, and how many retries a take needed.
 *
 * What we never store: the audio, the transcript, or the question. That keeps
 * these numbers safe to keep around while still answering the only question
 * that matters when an answer is misheard — did the mic fail, or the model?
 */

export type TranscriptionStatus = "ok" | "empty" | "error";

export type TranscriptionRecord = {
  userId?: string | null;
  provider: string;
  model: string;
  status: TranscriptionStatus;
  errorCode?: string | null;
  httpStatus?: number | null;
  latencyMs: number;
  audioBytes: number;
  audioMs?: number | null;
  durationMs?: number | null;
  silenceRatio?: number | null;
  noSpeechProb?: number | null;
  avgLogprob?: number | null;
  compressionRatio?: number | null;
  retryCount?: number;
  transcriptChars?: number;
};

/** Fire-and-forget: diagnostics must never be able to break transcription. */
export async function recordTranscription(entry: TranscriptionRecord): Promise<void> {
  try {
    await prisma.transcriptionLog.create({
      data: {
        userId: entry.userId ?? null,
        provider: entry.provider,
        model: entry.model,
        status: entry.status,
        errorCode: entry.errorCode ?? null,
        httpStatus: entry.httpStatus ?? null,
        latencyMs: Math.max(0, Math.round(entry.latencyMs)),
        audioBytes: Math.max(0, Math.round(entry.audioBytes)),
        audioMs: entry.audioMs ?? null,
        durationMs: entry.durationMs ?? null,
        silenceRatio: entry.silenceRatio ?? null,
        noSpeechProb: entry.noSpeechProb ?? null,
        avgLogprob: entry.avgLogprob ?? null,
        compressionRatio: entry.compressionRatio ?? null,
        retryCount: entry.retryCount ?? 0,
        transcriptChars: entry.transcriptChars ?? 0,
      },
    });
  } catch (err) {
    console.warn("transcription log failed:", (err as Error)?.message ?? err);
  }
}

/**
 * Who may read the diagnostics. `DIAGNOSTICS_ALLOWLIST` is a comma-separated
 * list of usernames/emails (same convention as MUX_UPLOAD_ALLOWLIST). With no
 * list configured, development allows any signed-in user and production
 * allows nobody.
 */
export function canViewDiagnostics(
  user: { username?: string | null; email?: string | null } | null
): boolean {
  if (!user) return false;

  const list = (process.env.DIAGNOSTICS_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!list.length) return process.env.NODE_ENV !== "production";

  const username = (user.username ?? "").toLowerCase();
  const email = (user.email ?? "").toLowerCase();
  return list.includes(username) || list.includes(email);
}

export type ProviderRollup = {
  provider: string;
  model: string;
  count: number;
  errors: number;
  empty: number;
  avgLatencyMs: number | null;
  avgConfidence: number | null;
  avgSilence: number | null;
};

export type DiagnosticsSummary = {
  windowDays: number;
  total: number;
  ok: number;
  empty: number;
  errors: number;
  retries: number;
  retryRate: number;
  /** takes where the mic or the model said "that was silence" */
  quietTakes: number;
  averages: {
    latencyMs: number | null;
    audioMs: number | null;
    durationMs: number | null;
    silenceRatio: number | null;
    noSpeechProb: number | null;
    avgLogprob: number | null;
  };
  providers: ProviderRollup[];
  recent: {
    id: string;
    createdAt: Date;
    provider: string;
    model: string;
    status: string;
    errorCode: string | null;
    latencyMs: number;
    audioMs: number | null;
    durationMs: number | null;
    silenceRatio: number | null;
    noSpeechProb: number | null;
    avgLogprob: number | null;
    retryCount: number;
    transcriptChars: number;
  }[];
};

const round = (n: number | null | undefined, digits = 2): number | null =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.round(n * 10 ** digits) / 10 ** digits
    : null;

export async function diagnosticsSummary(days = 7): Promise<DiagnosticsSummary> {
  const windowDays = Math.min(90, Math.max(1, Math.trunc(days) || 7));
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const where = { createdAt: { gte: since } };

  const [grouped, totals, recent] = await Promise.all([
    prisma.transcriptionLog.groupBy({
      by: ["provider", "model", "status"],
      where,
      _count: { _all: true },
      _avg: { latencyMs: true, avgLogprob: true, silenceRatio: true },
    }),
    prisma.transcriptionLog.aggregate({
      where,
      _count: { _all: true },
      _avg: {
        latencyMs: true,
        audioMs: true,
        durationMs: true,
        silenceRatio: true,
        noSpeechProb: true,
        avgLogprob: true,
      },
    }),
    prisma.transcriptionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        provider: true,
        model: true,
        status: true,
        errorCode: true,
        latencyMs: true,
        audioMs: true,
        durationMs: true,
        silenceRatio: true,
        noSpeechProb: true,
        avgLogprob: true,
        retryCount: true,
        transcriptChars: true,
      },
    }),
  ]);

  const [retries, quiet] = await Promise.all([
    prisma.transcriptionLog.count({ where: { ...where, retryCount: { gt: 0 } } }),
    prisma.transcriptionLog.count({
      where: {
        ...where,
        OR: [{ noSpeechProb: { gte: 0.5 } }, { silenceRatio: { gte: 0.5 } }],
      },
    }),
  ]);

  const providers = new Map<string, ProviderRollup>();
  let ok = 0;
  let empty = 0;
  let errors = 0;

  for (const row of grouped) {
    const count = row._count._all;
    if (row.status === "ok") ok += count;
    else if (row.status === "empty") empty += count;
    else errors += count;

    const key = `${row.provider}:${row.model}`;
    const current =
      providers.get(key) ??
      ({
        provider: row.provider,
        model: row.model,
        count: 0,
        errors: 0,
        empty: 0,
        avgLatencyMs: null,
        avgConfidence: null,
        avgSilence: null,
      } satisfies ProviderRollup);

    current.count += count;
    if (row.status === "error") current.errors += count;
    if (row.status === "empty") current.empty += count;
    current.avgLatencyMs = row._avg.latencyMs ?? current.avgLatencyMs;
    current.avgConfidence = row._avg.avgLogprob ?? current.avgConfidence;
    current.avgSilence = row._avg.silenceRatio ?? current.avgSilence;
    providers.set(key, current);
  }

  const total = totals._count._all;

  return {
    windowDays,
    total,
    ok,
    empty,
    errors,
    retries,
    retryRate: total ? round(retries / total, 3) ?? 0 : 0,
    quietTakes: quiet,
    averages: {
      latencyMs: round(totals._avg.latencyMs, 0),
      audioMs: round(totals._avg.audioMs, 0),
      durationMs: round(totals._avg.durationMs, 0),
      silenceRatio: round(totals._avg.silenceRatio, 3),
      noSpeechProb: round(totals._avg.noSpeechProb, 3),
      avgLogprob: round(totals._avg.avgLogprob, 3),
    },
    providers: [...providers.values()].map((p) => ({
      ...p,
      avgLatencyMs: round(p.avgLatencyMs, 0),
      avgConfidence: round(p.avgConfidence, 3),
      avgSilence: round(p.avgSilence, 3),
    })),
    recent,
  };
}
