import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// POST /api/auth/reset-password  { token, password }
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: "token and password are required" }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const reset = await prisma.passwordResetToken.findUnique({
      where: { token: String(token) },
      select: { id: true, userId: true, expiresAt: true },
    });
    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: await hashPassword(String(password)) },
    });
    await prisma.passwordResetToken.delete({ where: { id: reset.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
