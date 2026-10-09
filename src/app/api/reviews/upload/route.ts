import { requireAuth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import {
  handleApiError,
  jsonCreated,
  ApiError,
} from "@/lib/api";

export const runtime = "nodejs";

/**
 * POST /api/reviews/upload
 * Authenticated customers (or staff) may upload review photos.
 * multipart field "file" — compress on the client first.
 */
export async function POST(request: Request) {
  const rateLimitRes = applyRateLimit(request, { limit: 10, windowMs: 60000 });
  if (rateLimitRes) return rateLimitRes;

  try {
    await requireAuth(request);

    if (!isCloudinaryConfigured()) {
      throw new ApiError(
        "Image upload is not configured. Please try again later.",
        503
      );
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      throw new ApiError("file is required (multipart field name: file)");
    }

    if (!file.type.startsWith("image/")) {
      throw new ApiError("Only image uploads are allowed");
    }

    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      throw new ApiError("Image too large after compression (max 5MB)");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary({
      buffer,
      mimeType: file.type,
      folder: "dutiheritage/reviews",
    });

    return jsonCreated(result);
  } catch (error) {
    return handleApiError(error);
  }
}
