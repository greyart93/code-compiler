import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_IMAGE_BYTES = 300 * 1024; // ~300KB data URL ceiling

// PATCH /api/me  { name?, bio?, image? } → update own profile
// `image` accepts a data URL (client resizes to 256px before sending)
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, bio, image } = await request.json();

    if (image !== undefined && image !== null) {
      if (typeof image !== "string" || !image.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "image must be a data URL (data:image/…)" },
          { status: 400 }
        );
      }
      if (image.length > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Image too large (max ~300KB after resize)" },
          { status: 413 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim().slice(0, 60) || null } : {}),
        ...(bio !== undefined ? { bio: String(bio).trim().slice(0, 280) || null } : {}),
        ...(image !== undefined ? { image: image === null ? null : String(image) } : {}),
      },
      select: { id: true, username: true, email: true, name: true, image: true, bio: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("me PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
