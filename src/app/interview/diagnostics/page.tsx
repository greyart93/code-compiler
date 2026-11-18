import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { canViewDiagnostics, diagnosticsSummary } from "@/lib/transcription-log";
import { cn } from "@/lib/utils";

/**
 * IRIS transcription health — metadata only.
 *
 * Explains a misheard answer without ever storing the answer: the columns are
 * timings, silence share, Whisper's own no-speech/confidence numbers, and how
 * many retries a take needed. Owner-gated by DIAGNOSTICS_ALLOWLIST.
 */
export const dynamic = "force-dynamic";

const pct = (value: number | null) =>
  value === null ? "—" : `${Math.round(value * 100)}%`;

const secs = (ms: number | null) =>
  ms === null ? "—" : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`;

const fixed = (value: number | null, digits = 2) =>
  value === null ? "—" : value.toFixed(digits);

const time = (date: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

export default async function TranscriptionDiagnosticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewDiagnostics(user)) notFound();

  const data = await diagnosticsSummary(7);

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-wrap pb-20 pt-6 sm:pt-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="mono-label">IRIS · transcription health · last {data.windowDays} days</p>
            <h1 className="display mt-3 text-[clamp(34px,5.5vw,56px)]">Did the mic fail, or the model?</h1>
            <p className="mt-3 max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">
              One row per transcription request. No audio, no transcript, no question text is
              stored here — only provider, model, timing, silence and confidence metadata.
            </p>
          </div>
          <Link
            href="/interview"
            className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[12.5px] font-semibold hover:bg-muted"
          >
            Back to interviews
          </Link>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Requests", String(data.total)],
            ["Transcribed", String(data.ok)],
            ["Empty takes", String(data.empty)],
            ["Provider errors", String(data.errors)],
            ["Retry rate", pct(data.retryRate)],
            ["Quiet takes", String(data.quietTakes)],
          ].map(([label, value]) => (
            <div key={label} className="card-surface px-4 py-3">
              <p className="kpi-num text-[24px]">{value}</p>
              <p className="mono-label mt-1 !text-[8px]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Avg latency", data.averages.latencyMs === null ? "—" : `${data.averages.latencyMs} ms`],
            ["Avg recorded", secs(data.averages.audioMs)],
            ["Avg decoded", secs(data.averages.durationMs)],
            ["Avg confidence", fixed(data.averages.avgLogprob)],
          ].map(([label, value]) => (
            <div key={label} className="card-surface px-4 py-3">
              <p className="text-[16px] font-semibold tabular-nums">{value}</p>
              <p className="mono-label mt-1 !text-[8px]">{label}</p>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Providers</h2>
          <div className="card-surface mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-border">
                  {["Provider", "Model", "Requests", "Errors", "Empty", "Latency", "Confidence", "Silence"].map(
                    (h) => (
                      <th key={h} className="mono-label whitespace-nowrap px-4 py-2.5 !text-[8px]">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.providers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-muted-foreground">
                      No transcription requests recorded yet.
                    </td>
                  </tr>
                )}
                {data.providers.map((p) => (
                  <tr key={`${p.provider}-${p.model}`} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{p.provider}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.model}</td>
                    <td className="px-4 py-2.5 tabular-nums">{p.count}</td>
                    <td className={cn("px-4 py-2.5 tabular-nums", p.errors > 0 && "text-destructive")}>
                      {p.errors}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{p.empty}</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {p.avgLatencyMs === null ? "—" : `${p.avgLatencyMs} ms`}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{fixed(p.avgConfidence)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{pct(p.avgSilence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Recent takes</h2>
            <span className="mono-label !text-[9px]">
              {data.recent.length} of {data.total}
            </span>
          </div>

          <div className="card-surface mt-2 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "When",
                    "Outcome",
                    "Provider",
                    "Recorded",
                    "Decoded",
                    "Silence",
                    "No-speech",
                    "Confidence",
                    "Retry",
                    "Chars",
                  ].map((h) => (
                    <th key={h} className="mono-label whitespace-nowrap px-4 py-2.5 !text-[8px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-muted-foreground">
                      Nothing recorded yet. Run an interview answer with the mic and refresh.
                    </td>
                  </tr>
                )}
                {data.recent.map((row) => {
                  const quiet =
                    (row.noSpeechProb ?? 0) >= 0.5 || (row.silenceRatio ?? 0) >= 0.5;
                  return (
                    <tr key={row.id} className="border-b border-border/60 last:border-0">
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                        {time(row.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "mono-label !text-[8.5px]",
                            row.status === "ok" && "text-emerald-600 dark:text-emerald-400",
                            row.status === "empty" && "text-amber-600 dark:text-amber-400",
                            row.status === "error" && "text-destructive"
                          )}
                        >
                          {row.status}
                          {row.errorCode ? ` · ${row.errorCode}` : ""}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                        {row.provider}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{secs(row.audioMs)}</td>
                      <td className="px-4 py-2.5 tabular-nums">{secs(row.durationMs)}</td>
                      <td
                        className={cn(
                          "px-4 py-2.5 tabular-nums",
                          (row.silenceRatio ?? 0) >= 0.5 && "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {pct(row.silenceRatio)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 tabular-nums",
                          (row.noSpeechProb ?? 0) >= 0.5 && "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {fixed(row.noSpeechProb)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{fixed(row.avgLogprob)}</td>
                      <td className="px-4 py-2.5 tabular-nums">{row.retryCount || "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                        {row.transcriptChars}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 max-w-[80ch] text-[11.5px] leading-relaxed text-muted-foreground">
            Read it like this: high <span className="font-medium">silence</span> or{" "}
            <span className="font-medium">no-speech</span> with a short decoded duration means the
            mic heard almost nothing (device, permission, or the user muted). A long decoded
            duration with weak <span className="font-medium">confidence</span> and a high retry rate
            means audio arrived but Whisper struggled — accent, jargon, or background noise. Provider
            errors point at the upstream API instead.
          </p>
        </section>
      </main>
    </div>
  );
}
