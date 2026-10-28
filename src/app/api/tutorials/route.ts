import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/tutorials            → latest published tutorials
// GET /api/tutorials?id=<id>    → single tutorial (full content)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const tutorial = await prisma.tutorial.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, username: true, name: true } },
        },
      });
      if (!tutorial || !tutorial.published) {
        return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
      }
      return NextResponse.json({ tutorial });
    }

    const tutorials = await prisma.tutorial.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        language: true,
        createdAt: true,
        user: { select: { username: true, name: true } },
      },
    });
    return NextResponse.json({ tutorials });
  } catch (error) {
    console.error("tutorials GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tutorials" }, { status: 500 });
  }
}

// POST /api/tutorials → publish a tutorial (free, any signed-in user)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to publish a tutorial" },
        { status: 401 }
      );
    }

    const { title, content, language } = await request.json();
    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    const tutorial = await prisma.tutorial.create({
      data: {
        title: String(title).slice(0, 150),
        content: String(content),
        language: language ? String(language) : null,
        published: true,
        userId: user.id,
      },
      select: { id: true, title: true },
    });
    return NextResponse.json({ tutorial }, { status: 201 });
  } catch (error) {
    console.error("tutorials POST error:", error);
    return NextResponse.json({ error: "Failed to publish tutorial" }, { status: 500 });
  }
}

// PUT /api/tutorials?id=<id> → update (author only)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.tutorial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, language } = await request.json();
    const tutorial = await prisma.tutorial.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).slice(0, 150) } : {}),
        ...(content !== undefined ? { content: String(content) } : {}),
        ...(language !== undefined ? { language: language ? String(language) : null } : {}),
      },
      select: { id: true, title: true },
    });
    return NextResponse.json({ tutorial });
  } catch (error) {
    console.error("tutorials PUT error:", error);
    return NextResponse.json({ error: "Failed to update tutorial" }, { status: 500 });
  }
}

// DELETE /api/tutorials?id=<id> → remove (author only)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.tutorial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.tutorial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("tutorials DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete tutorial" }, { status: 500 });
  }
}
