import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type RoomQuestion = {
  kind: "intro" | "theory" | "code" | "open";
  q: string;
  snippetId?: string;
};

export const PHASES = ["lobby", "intro", "theory", "coding", "open", "done"] as const;
export type RoomPhase = (typeof PHASES)[number];

function joinCode(): string {
  // unambiguous alphabet, 5 chars — plenty for a session
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 5; i++) c += alpha[Math.floor(Math.random() * alpha.length)];
  return c;
}

export function makeRoomCode(): string {
  return joinCode();
}

export function isPhase(v: string): v is RoomPhase {
  return (PHASES as readonly string[]).includes(v);
}

export type LiveRoom = Awaited<ReturnType<typeof getRoomByCode>>;

export async function getRoomByCode(code: string) {
  return prisma.liveInterviewRoom.findUnique({
    where: { code },
    include: {
      interviewer: { select: { username: true, name: true } },
      candidate: { select: { username: true, name: true } },
    },
  });
}

export { NextResponse, prisma, getCurrentUser };
