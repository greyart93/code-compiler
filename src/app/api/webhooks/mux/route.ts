import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assetFields, getMux, isMuxConfigured } from "@/lib/mux";

type WebhookData = {
  id?: string;
  asset_id?: string;
  passthrough?: string;
  playback_ids?: Array<{ id?: string; policy?: string }>;
  duration?: number;
  aspect_ratio?: string;
  status?: string;
  error?: { message?: string };
  errors?: Array<{ message?: string }>;
};

/**
 * Mux webhook receiver. Signatures are checked with the raw request body, so
 * this route must not be wrapped in JSON parsing middleware.
 */
export async function POST(request: Request) {
  if (!isMuxConfigured() || !process.env.MUX_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Mux webhooks are not configured" }, { status: 503 });
  }

  const body = await request.text();
  let event: Awaited<ReturnType<ReturnType<typeof getMux>["webhooks"]["unwrap"]>>;
  try {
    event = await getMux().webhooks.unwrap(body, request.headers);
  } catch (error) {
    console.error("Mux webhook signature check failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const data = event.data as unknown as WebhookData;
  const errorMessage =
    data.error?.message ?? data.errors?.[0]?.message ?? "Mux could not process this video";

  try {
    if (event.type === "video.upload.asset_created") {
      if (data.id && data.asset_id) {
        await prisma.video.updateMany({
          where: { muxUploadId: data.id },
          data: { muxAssetId: data.asset_id, status: "PROCESSING" },
        });
      }
    } else if (event.type === "video.asset.created") {
      if (data.id) {
        const passthrough = data.passthrough;
        await prisma.video.updateMany({
          where: passthrough
            ? { OR: [{ id: passthrough }, { muxAssetId: data.id }] }
            : { muxAssetId: data.id },
          data: { muxAssetId: data.id, status: "PROCESSING" },
        });
      }
    } else if (event.type === "video.asset.ready") {
      const fields = assetFields({
        id: data.id ?? "",
        status: "ready",
        playback_ids: data.playback_ids,
        duration: data.duration,
        aspect_ratio: data.aspect_ratio,
      } as Parameters<typeof assetFields>[0]);

      await prisma.video.updateMany({
        where: data.passthrough
          ? { OR: [{ id: data.passthrough }, { muxAssetId: data.id }] }
          : { muxAssetId: data.id },
        data: { ...fields, error: null },
      });
    } else if (event.type === "video.asset.errored") {
      await prisma.video.updateMany({
        where: data.passthrough
          ? { OR: [{ id: data.passthrough }, { muxAssetId: data.id }] }
          : { muxAssetId: data.id },
        data: { status: "ERRORED", error: errorMessage.slice(0, 300) },
      });
    } else if (
      event.type === "video.upload.errored" ||
      event.type === "video.upload.cancelled"
    ) {
      if (data.id) {
        await prisma.video.updateMany({
          where: { muxUploadId: data.id },
          data: { status: "ERRORED", error: errorMessage.slice(0, 300) },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mux webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
