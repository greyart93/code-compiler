"use client";

const MAX_SIDE = 1600;
const MAX_BYTES = 440_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not encode that image"));
    reader.readAsDataURL(blob);
  });
}

/** Resize and compress in the browser, then return a WebP data URL. */
async function prepareImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("Use a PNG, JPEG, WebP or GIF image");
  }

  const image = await loadImage(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 3 && (!blob || blob.size > MAX_BYTES); attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (let quality = 0.84; quality >= 0.46; quality -= 0.12) {
      blob = await toBlob(canvas, quality);
      if (blob && blob.size <= MAX_BYTES) break;
    }
    if (blob && blob.size > MAX_BYTES) scale *= 0.75;
  }

  if (!blob || blob.size > MAX_BYTES) {
    throw new Error("That image is too large — try a smaller screenshot");
  }

  return toDataUrl(blob);
}

async function postImage(endpoint: string, dataUrl: string, fallback: string) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Sign in to attach an image");
  if (!res.ok || !data.url) throw new Error(data.error ?? fallback);
  return String(data.url);
}

/** Resize/compress in the browser, then store the bytes on the server. */
export async function uploadImageFile(file: File): Promise<string> {
  const dataUrl = await prepareImageDataUrl(file);
  return postImage("/api/uploads", dataUrl, "Upload failed");
}

/** Resize/compress in the browser, then upload to Cloudinary for blog images. */
export async function uploadCloudinaryImage(file: File): Promise<string> {
  const dataUrl = await prepareImageDataUrl(file);
  return postImage("/api/uploads/cloudinary", dataUrl, "Image upload failed");
}
