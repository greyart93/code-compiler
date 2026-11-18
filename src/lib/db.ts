import "server-only";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// 👇 Prisma 7 driver-adapter client (Neon Postgres via pg)
// The database is a long way away: each extra connection costs a TLS handshake,
// so the pool is deliberately small and kept alive between requests.
//
// Both timeouts have to add up to less than the client-side abort in
// `src/lib/api-cache.ts` (10s), or a browser would give up on a request the
// server is still working on — and the pool slot stays held either way:
// 5s to get a connection from the pool + 4s for the statement = 9s worst case,
// so the route's 500 reaches the page before the client times out.
// Without a query timeout a stalled statement hangs forever, which the connect
// timeout does not cover.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 4,
  keepAlive: true,
  idleTimeoutMillis: 5 * 60_000,
  connectionTimeoutMillis: 5_000,
  query_timeout: 4_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
