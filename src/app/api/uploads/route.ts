import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionClaims } from "@/lib/auth";

const MAX_DATA_URL = 620_000; // ~465KB of base64 payload

const IMAGE_DATA_URL =
  /^data:image\/(png|jpe?g|webp|gif);base64,([a-z0-9+/=\s]+)$/i;

// POST /api/uploads  { dataUrl } → { url, id }
// The browser resizes the attachment before sending it; only raster formats are
// accepted (SVG is deliberately excluded because it can carry scripts).
export async function POST(request: Request) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Login to upload an image" }, { status: 401 });
    }

    const { dataUrl } = await request.json();
    if (typeof dataUrl !== "string" || dataUrl.length > MAX_DATA_URL) {
      return NextResponse.json({ error: "Image is too large (max ~450KB)" }, { status: 413 });
    }

    const match = IMAGE_DATA_URL.exec(dataUrl.trim());
    if (!match) {
      return NextResponse.json(
        { error: "Use a PNG, JPEG, WebP or GIF image" },
        { status: 400 }
      );
    }

    const mimeType = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
    const data = match[2].replace(/\s+/g, "");
    if (!data || data.length < 16) {
      return NextResponse.json({ error: "Empty image" }, { status: 400 });
    }

    const media = await prisma.media.create({
      data: { userId: user.id, mimeType: `image/${mimeType}`, data },
      select: { id: true },
    });

    return NextResponse.json({ id: media.id, url: `/api/uploads/${media.id}` }, { status: 201 });
  } catch (error) {
    console.error("uploads POST error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
