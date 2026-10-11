import { connectDB } from "@/lib/mongodb";
import { RestockRequest } from "@/models/RestockRequest";
import { Product } from "@/models/Product";
import { jsonOk, jsonError, handleApiError, requireMongo } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireMongo();
    await connectDB();

    const { email, size, color } = await request.json();
    if (!email || !email.includes("@")) {
      return jsonError("Valid email is required", 400);
    }

    const productId = (await params).id;
    const product = await Product.findById(productId);
    if (!product) return jsonError("Product not found", 404);

    const sizeKey = String(size || "").trim();
    const colorKey = String(color || "").trim();

    // Prevent duplicate pending requests for the same email/product/size/color
    const existing = await RestockRequest.findOne({
      email: email.toLowerCase().trim(),
      productId,
      size: sizeKey,
      color: colorKey,
      status: "pending",
    });

    if (existing) {
      return jsonOk({ message: "You are already on the notification list!" });
    }

    await RestockRequest.create({
      email: email.toLowerCase().trim(),
      productId,
      productName: product.name,
      size: sizeKey,
      color: colorKey,
      status: "pending",
    });

    return jsonOk({ message: "We will notify you when it's back in stock!" });
  } catch (err) {
    return handleApiError(err);
  }
}
