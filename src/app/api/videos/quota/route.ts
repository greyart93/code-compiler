import { NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/auth";
import { canUploadVideo } from "@/lib/video-access";
import { getVideoUsage } from "@/lib/video-usage";

// GET /api/videos/quota → current video usage and limits for the dashboard
export async function GET() {
  try {
    const user = await getSessionClaims();
    if (!user) {
      return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    }

    const usage = await getVideoUsage(user.id);
    return NextResponse.json({
      enabled: canUploadVideo(user.username),
      ...usage,
    });
  } catch (error) {
    console.error("videos quota GET error:", error);
    return NextResponse.json({ error: "Failed to load video quota" }, { status: 500 });
  }
}
