import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/questions?tab=trending|recent|unanswered|mine&q=search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") ?? "trending";
    const q = searchParams.get("q");
    const viewer = await getCurrentUser();

    if (tab === "mine" && !viewer) {
      return NextResponse.json({ questions: [] });
    }

    const where = {
      ...(tab === "unanswered" ? { answers: { none: {} } } : {}),
      ...(tab === "mine" ? { userId: viewer!.id } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { body: { contains: q, mode: "insensitive" as const } },
              { tags: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const orderBy =
      tab === "trending"
        ? [{ votes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
        : { createdAt: "desc" as const };

    const questions = await prisma.question.findMany({
      where,
      orderBy,
      take: 50,
      select: {
        id: true,
        title: true,
        body: true,
        tags: true,
        createdAt: true,
        user: { select: { username: true, name: true } },
        _count: { select: { votes: true, answers: true } },
        ...(viewer
          ? { votes: { where: { userId: viewer.id }, select: { id: true } } }
          : {}),
      },
    });

    return NextResponse.json({
      questions: questions.map((x) => {
        const { votes, ...rest } = x;
        return { ...rest, votedByMe: viewer ? votes.length > 0 : false };
      }),
    });
  } catch (error) {
    console.error("questions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

// POST /api/questions  { title, body, tags }
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login to ask a question" }, { status: 401 });
    }

    const { title, body, tags } = await request.json();
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        title: String(title).trim().slice(0, 200),
        body: String(body).trim().slice(0, 10000),
        tags: tags ? String(tags).trim().slice(0, 200) : null,
        userId: user.id,
      },
      select: { id: true },
    });
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("questions POST error:", error);
    return NextResponse.json({ error: "Failed to post question" }, { status: 500 });
  }
}

// DELETE /api/questions?id=<id> → owner only
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    if (question.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("questions DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
