import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/uploads/:id → the stored image bytes
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
      select: { mimeType: true, data: true },
    });
    if (!media) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // atob works in both Node and the Workers runtime; avoid Buffer here.
    const binary = atob(media.data);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("uploads GET error:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
