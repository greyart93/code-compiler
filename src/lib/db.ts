import "server-only";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// 👇 Prisma 7 driver-adapter client (Neon Postgres via pg)
// The database is a long way away: each extra connection costs a TLS handshake,
// so the pool is deliberately small and kept alive between requests.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 4,
  keepAlive: true,
  idleTimeoutMillis: 5 * 60_000,
  connectionTimeoutMillis: 15_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
