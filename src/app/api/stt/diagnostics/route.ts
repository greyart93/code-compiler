import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/auth";
import { canViewDiagnostics, diagnosticsSummary } from "@/lib/transcription-log";

/**
 * GET /api/stt/diagnostics?days=7 → aggregate transcription health.
 *
 * Metadata only: counts, retry rate, latency, silence and confidence signals.
 * Owner-gated by DIAGNOSTICS_ALLOWLIST and never cached.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const claims = await getSessionClaims();
  if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canViewDiagnostics(claims)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = Number(new URL(request.url).searchParams.get("days") ?? 7);

  try {
    const summary = await diagnosticsSummary(days);
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.warn("diagnostics query failed:", err);
    return NextResponse.json({ error: "diagnostics unavailable" }, { status: 503 });
  }
}
