import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/auth";
import {
  canUploadCloudinaryImage,
  getCloudinary,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

// The browser compresses images before sending them; this leaves room for the
// base64 expansion of a ~450KB WebP and rejects obviously oversized payloads.
const MAX_DATA_URL = 700_000;
const MAX_IMAGE_BYTES = 480_000;

const IMAGE_DATA_URL =
  /^data:image\/(png|jpe?g|webp|gif);base64,([a-z0-9+/=\s]+)$/i;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function imageFormat(bytes: Buffer) {
  if (bytes.length < 12) return null;
  if (bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  if (bytes.toString("ascii", 0, 6) === "GIF87a" || bytes.toString("ascii", 0, 6) === "GIF89a") {
    return "gif";
  }
  return null;
}

// POST /api/uploads/cloudinary { dataUrl } → { url }
export async function POST(request: Request) {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in to upload an image" }, { status: 401 });
    }
    if (!canUploadCloudinaryImage(user.username)) {
      return NextResponse.json(
        { error: "Image uploads are not enabled for this account" },
        { status: 403 }
      );
    }
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Image hosting is not configured yet" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const dataUrl = (body as { dataUrl?: unknown } | null)?.dataUrl;
    if (typeof dataUrl !== "string") {
      return NextResponse.json({ error: "dataUrl is required" }, { status: 400 });
    }
    if (dataUrl.length > MAX_DATA_URL) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }

    const match = IMAGE_DATA_URL.exec(dataUrl.trim());
    if (!match) {
      return NextResponse.json(
        { error: "Use a PNG, JPEG, WebP or GIF image" },
        { status: 400 }
      );
    }

    const claimedFormat = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
    const bytes = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
    if (bytes.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }
    if (imageFormat(bytes) !== claimedFormat) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    const result = await getCloudinary().uploader.upload(dataUrl.trim(), {
      folder: "codevit/blog",
    });

    return NextResponse.json({ url: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
