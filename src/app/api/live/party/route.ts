import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/live/party  { code } → claim the candidate seat (first non-host wins)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const room = await prisma.liveInterviewRoom.findUnique({
    where: { code: String(code).toUpperCase() },
    select: { id: true, interviewerId: true, candidateId: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.interviewerId === user.id) {
    return NextResponse.json({ error: "You are the host of this room" }, { status: 400 });
  }
  if (room.candidateId && room.candidateId !== user.id) {
    return NextResponse.json({ error: "Seat already taken" }, { status: 409 });
  }

  await prisma.liveInterviewRoom.update({
    where: { id: room.id },
    data: { candidateId: user.id },
  });
  return NextResponse.json({ ok: true });
}
