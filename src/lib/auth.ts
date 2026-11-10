import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me"
);
const COOKIE = "codevit_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  name: string | null;
  image?: string | null;
  createdAt?: Date;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: user.id,
    username: user.username,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

/**
 * Session lookups used to hit the database on every single request, and each
 * query costs ~330ms because the database is in another region. The signed JWT
 * already proves who the user is, so the row is cached briefly and refreshed
 * lazily; `forgetSessionUser` clears it when a profile changes.
 */
const SESSION_TTL = 60_000;

const globalAuth = globalThis as unknown as {
  __codevitSessions?: Map<string, { user: SessionUser; at: number }>;
};
const sessionCache =
  globalAuth.__codevitSessions ?? (globalAuth.__codevitSessions = new Map());

export function forgetSessionUser(id?: string) {
  if (id) sessionCache.delete(id);
  else sessionCache.clear();
}

/**
 * Who is asking, from the signed cookie alone.
 *
 * The JWT already carries id/username/email, so endpoints that only scope
 * queries by id do not need a database round trip (~330ms) just to read the
 * session. Use `getCurrentUser` when the row itself (name, avatar) is needed.
 */
export async function getSessionClaims(): Promise<Pick<SessionUser, "id" | "username" | "email"> | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      username: String(payload.username ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = payload.sub;
    if (!id) return null;

    const hit = sessionCache.get(id);
    if (hit && Date.now() - hit.at < SESSION_TTL) return hit.user;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, name: true, image: true, createdAt: true },
    });
    if (!user) {
      sessionCache.delete(id);
      return null;
    }
    sessionCache.set(id, { user, at: Date.now() });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
