import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// POST /api/auth/forgot-password  { email }
// Creates a one-time reset token valid for 1 hour.
// No mail sender is configured yet, so the reset URL is returned in the
// response (and logged server-side) — swap this for an email later.
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      select: { id: true },
    });

    // Always answer the same way — don't leak which emails exist
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `/reset-password?token=${token}`;
    console.log(`[forgot-password] reset link for ${email}: ${resetUrl}`);

    return NextResponse.json({ ok: true, resetUrl });
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
