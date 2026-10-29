import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordActivity } from "@/lib/streak";
import { makeRoomCode, isPhase, type RoomQuestion } from "@/lib/live-interview";

// POST /api/live  { questions } → creates a room, returns { code, room }
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to host an interview" }, { status: 401 });

  const { questions, lang } = await request.json().catch(() => ({}));
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "questions are required" }, { status: 400 });
  }

  // one active room per host (reuse) — simple and avoids orphan rooms
  const existing = await prisma.liveInterviewRoom.findFirst({
    where: { interviewerId: user.id, phase: { not: "done" } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    await prisma.liveInterviewRoom.update({
      where: { id: existing.id },
      data: { questions, ...(lang ? { codeLang: String(lang) } : {}) },
    });
    return NextResponse.json({ room: existing });
  }

  const room = await prisma.liveInterviewRoom.create({
    data: {
      code: makeRoomCode(),
      interviewerId: user.id,
      questions,
      ...(lang ? { codeLang: String(lang) } : {}),
    },
  });
  return NextResponse.json({ room }, { status: 201 });
}

// GET /api/live?code=XXXXX → room snapshot (join view)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const room = await prisma.liveInterviewRoom.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      interviewer: { select: { username: true, name: true } },
      candidate: { select: { username: true, name: true } },
    },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ room });
}

// PATCH /api/live?code=  { phase?, cursor?, questions?, codeState?, codeLang? }
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const room = await prisma.liveInterviewRoom.findUnique({ where: { code: code.toUpperCase() } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const isHost = room.interviewerId === user.id;
  const isCandidate = room.candidateId === user.id;
  if (!isHost && !isCandidate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    phase?: string; cursor?: number; questions?: RoomQuestion[]; codeState?: string | null; codeLang?: string | null;
  };

  // candidate can push their current code buffer (auto-save), not control the phase
  if (!isHost) {
    if (body.codeState !== undefined) {
      await prisma.liveInterviewRoom.update({
        where: { id: room.id },
        data: { codeState: String(body.codeState).slice(0, 20_000) },
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (body.phase !== undefined) {
    if (!isPhase(body.phase)) return NextResponse.json({ error: "bad phase" }, { status: 400 });
    data.phase = body.phase;
    data.cursor = 0;
    if (body.phase === "done") await recordActivity(user.id, "interview");
  }
  if (body.cursor !== undefined) data.cursor = Math.max(0, Math.floor(body.cursor));
  if (body.questions !== undefined) data.questions = body.questions;
  if (body.codeLang !== undefined) data.codeLang = body.codeLang;
  // host may push code too (either side can type)
  if (body.codeState !== undefined) data.codeState = String(body.codeState).slice(0, 20_000);

  const updated = await prisma.liveInterviewRoom.update({ where: { id: room.id }, data });
  return NextResponse.json({ room: updated });
}

// DELETE /api/live?code= → host ends/discards the room
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const room = await prisma.liveInterviewRoom.findUnique({ where: { code: code.toUpperCase() } });
  if (!room || room.interviewerId !== user.id) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  await prisma.liveInterviewRoom.delete({ where: { id: room.id } });
  return NextResponse.json({ ok: true });
}
