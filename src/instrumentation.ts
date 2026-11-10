/**
 * Server boot hook (Next calls this once per server process).
 *
 * The database is in another region and a fresh TLS connection costs seconds,
 * so the first page load after `next dev` used to stall while four connections
 * handshook in parallel. Opening the pool up front moves that cost to startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { prisma } = await import("@/lib/db");
  const connections = 3;

  try {
    await Promise.all(
      Array.from({ length: connections }, () => prisma.$queryRaw`SELECT 1`)
    );
  } catch (error) {
    console.error("database warm-up failed:", error);
  }
}
