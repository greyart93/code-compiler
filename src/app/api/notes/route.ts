import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordActivity } from "@/lib/streak";

// GET /api/notes → all of the signed-in user's notes (newest first)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ notes });
}

// POST /api/notes { title, body, courseSlug?, lessonId? } → create a note
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, courseSlug, lessonId } = await request.json();
  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      title: typeof title === "string" ? title.trim().slice(0, 120) || "Untitled note" : "Untitled note",
      body: body.slice(0, 10_000),
      courseSlug: typeof courseSlug === "string" ? courseSlug : null,
      lessonId: typeof lessonId === "string" ? lessonId : null,
    },
  });

  // saving a note counts toward the streak
  await recordActivity(user.id, "note");

  return NextResponse.json({ note });
}

// PUT /api/notes?id= { title?, body? } → update
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { title, body } = await request.json();
  const data: { title?: string; body?: string } = {};
  if (title !== undefined) data.title = String(title).trim().slice(0, 120) || "Untitled note";
  if (body !== undefined) data.body = String(body).slice(0, 10_000);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  try {
    const note = await prisma.note.update({
      where: { id, userId: user.id }, // ownership-guarded composite where
      data,
    });
    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
}

// DELETE /api/notes?id=
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.note.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
