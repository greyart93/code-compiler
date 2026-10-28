import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/progress { slug } → record course completion (upsert)
// DELETE /api/progress?slug=  → remove completion (progress dropped below 100%)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await request.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const progress = await prisma.courseProgress.upsert({
      where: { userId_slug: { userId: user.id, slug } },
      create: { userId: user.id, slug },
      update: {}, // keep the original completedAt
    });
    return NextResponse.json({ progress });
  } catch (error) {
    console.error("progress POST error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

    await prisma.courseProgress.deleteMany({
      where: { userId: user.id, slug },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("progress DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove progress" }, { status: 500 });
  }
}
