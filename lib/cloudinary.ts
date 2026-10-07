// File upload helper (Cloudinary). Used for avatars, report photos, and
// provider ID documents (the latter uploaded to a private folder with
// signed, time-limited URLs per PRD Section 12).

import { v2 as cloudinary } from "cloudinary";

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const PRIVATE_FOLDER = process.env.CLOUDINARY_PRIVATE_FOLDER || "bokle-private";

export async function uploadImage(
  base64OrUrl: string,
  options: { folder?: string; isPrivate?: boolean } = {}
): Promise<{ url: string; publicId: string }> {
  if (!configured) {
    console.log("[CLOUDINARY:DEV] uploadImage (no-op, returning input as url)");
    return { url: base64OrUrl, publicId: `dev_${Date.now()}` };
  }

  const folder = options.isPrivate ? PRIVATE_FOLDER : options.folder || "bokle-public";
  const result = await cloudinary.uploader.upload(base64OrUrl, {
    folder,
    type: options.isPrivate ? "private" : "upload",
    moderation: "aws_rek", // content moderation on uploaded images
  });
  return { url: result.secure_url, publicId: result.public_id };
}

// Generates a signed URL valid for 1 hour, for private documents
// (provider ID + selfie) per PRD Section 12 ("File Upload Security").
export function getSignedPrivateUrl(publicId: string): string {
  if (!configured) return publicId;
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  return cloudinary.utils.private_download_url(publicId, "jpg", {
    type: "private",
    expires_at: expiresAt,
  });
}

export const cloudinaryMode = configured ? "live" : "dev-mock";
