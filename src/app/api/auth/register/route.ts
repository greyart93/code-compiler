import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, username, name, password } = await request.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "email, username and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "username must be 3-20 chars: letters, numbers, - or _" },
        { status: 400 }
      );
    }

    const emailNorm = String(email).toLowerCase().trim();
    const usernameNorm = String(username).toLowerCase().trim();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: emailNorm }, { username: usernameNorm }] },
      select: { email: true, username: true },
    });
    if (existing) {
      const field = existing.email === emailNorm ? "email" : "username";
      return NextResponse.json(
        { error: `That ${field} is already taken` },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        username: usernameNorm,
        name: name ? String(name).trim() : null,
        password: await hashPassword(String(password)),
      },
      select: { id: true, username: true, email: true, name: true },
    });

    await createSession(user);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
