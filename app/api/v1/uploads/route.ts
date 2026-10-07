import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";

const MAX_BASE64_BYTES = 5 * 1024 * 1024 * 1.4; // ~5MB image, base64 inflates ~33%

const schema = z.object({
  dataUrl: z.string().startsWith("data:image/", "Only image uploads are supported"),
  isPrivate: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { dataUrl, isPrivate } = schema.parse(body);

    if (dataUrl.length > MAX_BASE64_BYTES) {
      return apiError("Image is too large (max 5MB)", 413);
    }

    const result = await uploadImage(dataUrl, { isPrivate });
    return apiSuccess({ url: result.url, publicId: result.publicId });
  } catch (err) {
    return handleApiError(err);
  }
}
