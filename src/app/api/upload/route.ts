import { requireAuth } from "@/lib/auth";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  ApiError,
} from "@/lib/api";

export const runtime = "nodejs";

/**
 * POST /api/upload
 * multipart field "file" — already compressed on the client (high quality).
 * Admin only.
 */
export async function POST(request: Request) {
  try {
    await requireAuth(request, { admin: true });

    if (!isCloudinaryConfigured()) {
      throw new ApiError(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local.",
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
    const folder =
      (form.get("folder") as string | null)?.trim() || "dutiheritage/products";

    const result = await uploadToCloudinary({
      buffer,
      mimeType: file.type,
      folder,
    });

    return jsonCreated(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    return jsonOk({
      configured: isCloudinaryConfigured(),
      compressOnClient: true,
      maxEdge: 2000,
      quality: 0.92,
      note: "Browser compresses first at high quality; Cloudinary stores the result.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
