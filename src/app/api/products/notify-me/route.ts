import { applyRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import { Product, StockNotify } from "@/models";
import { verifyIdToken } from "@/lib/auth";
import { sendEmail, isEmailConfigured, emailLayout } from "@/lib/email";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";
import mongoose from "mongoose";

/**
 * POST /api/products/notify-me
 * Save a back-in-stock request. Emails a confirmation only if Resend is configured.
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const size = String(body.size || "").trim() || "Free Size";
    let email = String(body.email || "").trim().toLowerCase();

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const user = await verifyIdToken(authHeader);
        if (user.email) email = user.email.toLowerCase();
      } catch {
        /* guest */
      }
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new ApiError("Invalid product", 400);
    }
    if (!email || !email.includes("@")) {
      throw new ApiError("Enter a valid email so we can write when this size is back.", 400);
    }

    await connectDB();
    const product = await Product.findById(productId).lean();
    if (!product || product.isActive === false) {
      throw new ApiError("Product not found", 404);
    }

    await StockNotify.updateOne(
      { productId, size, email },
      {
        $setOnInsert: {
          productId,
          productName: product.name,
          size,
          email,
        },
      },
      { upsert: true }
    );

    if (isEmailConfigured()) {
      const inner = `<p>We will email you at <strong>${email}</strong> when <strong>${product.name}</strong> (size ${size}) is back in stock.</p><p>This is not a WhatsApp alert — only email.</p>`;
      await sendEmail({
        to: email,
        subject: `We'll tell you when ${product.name} is back`,
        html: emailLayout("Back in stock request", inner),
        type: "marketing",
      });
    }

    return jsonOk({
      ok: true,
      message: "We've saved your request. We'll email you when this size is back.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
