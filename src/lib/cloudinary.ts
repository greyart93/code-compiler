import "server-only";
import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

const CLOUDINARY_URL = /https:\/\/res\.cloudinary\.com\/[^\s"'<>]+/g;

/** Extract a public id only for images this app uploaded to codevit/blog. */
export function cloudinaryPublicIdFromUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (url.hostname !== "res.cloudinary.com" || !cloudName) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== "image") return null;

    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    const assetPath = parts.slice(uploadIndex + 1);
    // Find the folder itself so transformed URLs with extra segments before
    // the version still resolve to the same Cloudinary public id.
    const folderIndex = assetPath.findIndex(
      (part, index) => part === "codevit" && assetPath[index + 1] === "blog"
    );
    if (folderIndex === -1) return null;

    const ownedPath = assetPath.slice(folderIndex);
    // Cloudinary returns the delivery URL with the original extension; the
    // destroy API expects the public id without it.
    ownedPath[ownedPath.length - 1] = ownedPath[ownedPath.length - 1].replace(
      /\.[a-z0-9]+$/i,
      ""
    );
    const publicId = decodeURIComponent(ownedPath.join("/"));
    return publicId.startsWith("codevit/blog/") ? publicId : null;
  } catch {
    return null;
  }
}

export function cloudinaryPublicIdsInHtml(html: string | null | undefined) {
  if (!html) return [];
  return (html.match(CLOUDINARY_URL) ?? [])
    .map((url) => cloudinaryPublicIdFromUrl(url))
    .filter((id): id is string => Boolean(id));
}

export async function deleteCloudinaryAssets(publicIds: string[]) {
  if (!isCloudinaryConfigured() || publicIds.length === 0) return;

  const unique = [...new Set(publicIds)];
  await Promise.all(
    unique.map(async (publicId) => {
      try {
        await getCloudinary().uploader.destroy(publicId, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (error) {
        // A failed cleanup must not fail the blog save or delete.
        console.error(`Could not delete Cloudinary asset ${publicId}:`, error);
      }
    })
  );
}

export function canUploadCloudinaryImage(username: string) {
  const allowlist = (process.env.CLOUDINARY_UPLOAD_ALLOWLIST ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(username.trim().toLowerCase());
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) throw new Error("CLOUDINARY_NOT_CONFIGURED");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}
