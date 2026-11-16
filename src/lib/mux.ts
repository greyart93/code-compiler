import "server-only";
import Mux from "@mux/ts";

let client: Mux | null = null;

export function isMuxConfigured() {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

export function getMux() {
  if (!isMuxConfigured()) throw new Error("MUX_NOT_CONFIGURED");
  if (!client) {
    client = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
      webhookSecret: process.env.MUX_WEBHOOK_SECRET,
    });
  }
  return client;
}

export type MuxAsset = Awaited<ReturnType<Mux["video"]["assets"]["retrieve"]>>;
export type MuxUpload = Awaited<ReturnType<Mux["video"]["uploads"]["retrieve"]>>;

/** The first public playback id Mux gives an asset. */
export function playbackIdOf(asset: MuxAsset) {
  return asset.playback_ids?.[0]?.id ?? null;
}

export function playbackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function thumbnailUrl(playbackId: string, width = 960) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}`;
}

/** The database fields that always follow an asset state change. */
export function assetFields(asset: MuxAsset) {
  const playbackId = playbackIdOf(asset);
  return {
    muxAssetId: asset.id,
    ...(playbackId ? { playbackId } : {}),
    ...(asset.duration != null ? { duration: asset.duration } : {}),
    ...(asset.aspect_ratio ? { aspectRatio: asset.aspect_ratio } : {}),
    status:
      asset.status === "ready"
        ? ("READY" as const)
        : asset.status === "errored"
          ? ("ERRORED" as const)
          : ("PROCESSING" as const),
  };
}

export function appOrigin(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to the request origin if the configured value is malformed.
    }
  }
  return new URL(request.url).origin;
}
