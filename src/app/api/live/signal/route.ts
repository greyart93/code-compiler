import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Transport for room events. The client long-polls GET with after=<lastId>
 * (silently re-issuing immediately) — near-instant on a serverless DB without
 * needing a WebSocket server, which Next.js on Node can't serve here.
 *
 * POST /api/live/signal  { code, type, payload }  → 1 row
 * GET  /api/live/signal?code=&after=&wait=1        → { signals, room }
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, type, payload } = await request.json();
  if (!code || !type) return NextResponse.json({ error: "code and type are required" }, { status: 400 });

  const room = await prisma.liveInterviewRoom.findUnique({
    where: { code: String(code).toUpperCase() },
    select: { id: true, interviewerId: true, candidateId: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.interviewerId !== user.id && room.candidateId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signal = await prisma.signal.create({
    data: {
      roomId: room.id,
      sender: user.id,
      type: String(type).slice(0, 24),
      payload: JSON.stringify(payload ?? {}).slice(0, 8_000),
    },
  });
  return NextResponse.json({ id: signal.id.toString() });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const after = Number(searchParams.get("after") ?? "0");
  const wait = searchParams.get("wait") === "1";

  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const room = await prisma.liveInterviewRoom.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, interviewerId: true, candidateId: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.interviewerId !== user.id && room.candidateId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // long-poll: if no new signals yet, poll briefly server-side (keeps the
  // client loop tight without hot-spinning on the database)
  if (wait) {
    for (let i = 0; i < 20; i++) {
      const count = await prisma.signal.count({ where: { roomId: room.id, id: { gt: BigInt(after) } } });
      if (count > 0) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const signals = await prisma.signal.findMany({
    where: { roomId: room.id, id: { gt: BigInt(after) } },
    orderBy: { id: "asc" },
    take: 200,
  });

  // room row also carries higher-frequency sync state (code buffer, cursor)
  const fresh = await prisma.liveInterviewRoom.findUnique({
    where: { code: code.toUpperCase() },
    select: { phase: true, cursor: true, codeState: true, codeLang: true, candidateId: true, questions: true },
  });

  return NextResponse.json({
    signals: signals.map((s) => ({
      id: s.id.toString(),
      sender: s.sender,
      type: s.type,
      payload: JSON.parse(s.payload),
    })),
    room: fresh,
  });
}
