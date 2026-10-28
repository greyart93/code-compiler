import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/snippets?user=username  → public profile showcase
// GET /api/snippets?mine=1         → current user's snippets (incl. private)
// GET /api/snippets?id=<id>        → single snippet with code (public or own)
// GET /api/snippets?explore=1      → public snippets w/ like+comment counts, likedByMe, filters
// GET /api/snippets                → latest public snippets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("user");
    const mine = searchParams.get("mine");
    const id = searchParams.get("id");

    if (id) {
      const snippet = await prisma.snippet.findUnique({
        where: { id },
        include: { user: { select: { username: true, name: true } } },
      });
      if (!snippet) {
        return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
      }
      const viewer = await getCurrentUser();
      if (!snippet.isPublic && viewer?.id !== snippet.userId) {
        // Don't leak private snippets to non-owners
        return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
      }
      return NextResponse.json({ snippet });
    }

    if (username) {
      const target = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (!target) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const viewer = await getCurrentUser();
      const isOwner = viewer?.username === username;
      const snippets = await prisma.snippet.findMany({
        where: { userId: target.id, ...(isOwner ? {} : { isPublic: true }) },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          language: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { username: true, name: true } },
        },
      });
      return NextResponse.json({ snippets, isOwner });
    }

    if (mine) {
      const user = await getCurrentUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const snippets = await prisma.snippet.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: { user: { select: { username: true, name: true } } },
      });
      return NextResponse.json({ snippets });
    }

    if (searchParams.get("explore")) {
      const viewer = await getCurrentUser();
      const lang = searchParams.get("lang");
      const sort = searchParams.get("sort");

      // Fetch ids+counts first, then map likedByMe — keeps the query simple
      const base = await prisma.snippet.findMany({
        where: {
          isPublic: true,
          ...(lang ? { language: lang } : {}),
        },
        orderBy:
          sort === "top"
            ? [{ likes: { _count: "desc" as const } }]
            : [{ createdAt: "desc" as const }],
        take: 50,
        select: {
          id: true,
          title: true,
          language: true,
          code: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { username: true, name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
      const likedIds = viewer
        ? new Set(
            (
              await prisma.like.findMany({
                where: { userId: viewer.id, snippetId: { in: base.map((s) => s.id) } },
                select: { snippetId: true },
              })
            ).map((l) => l.snippetId)
          )
        : new Set<string>();
      const snippets = base.map((s) => ({ ...s, likedByMe: likedIds.has(s.id) }));
      return NextResponse.json({ snippets });
    }

    const snippets = await prisma.snippet.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { username: true, name: true } },
      },
    });
    return NextResponse.json({ snippets });
  } catch (error) {
    console.error("snippets GET error:", error);
    return NextResponse.json({ error: "Failed to fetch snippets" }, { status: 500 });
  }
}

// POST /api/snippets → create; PUT ?id= → update (owner only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to save snippets" }, { status: 401 });

    const { title, language, code, input, isPublic } = await request.json();
    if (!title || !language || !code) {
      return NextResponse.json(
        { error: "title, language and code are required" },
        { status: 400 }
      );
    }

    const snippet = await prisma.snippet.create({
      data: {
        title: String(title).slice(0, 120),
        language: String(language),
        code: String(code),
        input: input ? String(input) : null,
        isPublic: isPublic !== false,
        userId: user.id,
      },
    });
    return NextResponse.json({ snippet }, { status: 201 });
  } catch (error) {
    console.error("snippets POST error:", error);
    return NextResponse.json({ error: "Failed to save snippet" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.snippet.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, language, code, input, isPublic } = await request.json();
    const snippet = await prisma.snippet.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).slice(0, 120) } : {}),
        ...(language !== undefined ? { language: String(language) } : {}),
        ...(code !== undefined ? { code: String(code) } : {}),
        ...(input !== undefined ? { input: input ? String(input) : null } : {}),
        ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {}),
      },
    });
    return NextResponse.json({ snippet });
  } catch (error) {
    console.error("snippets PUT error:", error);
    return NextResponse.json({ error: "Failed to update snippet" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.snippet.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.snippet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("snippets DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete snippet" }, { status: 500 });
  }
}
