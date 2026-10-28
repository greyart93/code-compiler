import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const emailNorm = String(email).toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailNorm }, { username: emailNorm }] },
    });

    // Same generic message for unknown email and wrong password
    if (!user || !user.password || !(await verifyPassword(String(password), user.password))) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    };
    await createSession(sessionUser);
    return NextResponse.json({ user: sessionUser });
  } catch (error) {
    console.error("login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
