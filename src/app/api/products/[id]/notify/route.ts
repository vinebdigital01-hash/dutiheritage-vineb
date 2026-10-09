import { connectDB } from "@/lib/mongodb";
import { RestockRequest } from "@/models/RestockRequest";
import { Product } from "@/models/Product";
import { jsonOk, jsonError, handleApiError, requireMongo } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    requireMongo();
    await connectDB();

    const { email, size } = await request.json();
    if (!email || !email.includes("@")) {
      return jsonError("Valid email is required", 400);
    }

    const product = await Product.findById(params.id);
    if (!product) return jsonError("Product not found", 404);

    // Prevent duplicate pending requests for the same email/product/size
    const existing = await RestockRequest.findOne({
      email: email.toLowerCase().trim(),
      productId: params.id,
      size: size || "",
      status: "pending",
    });

    if (existing) {
      return jsonOk({ message: "You are already on the notification list!" });
    }

    await RestockRequest.create({
      email: email.toLowerCase().trim(),
      productId: params.id,
      productName: product.name,
      size: size || "",
      status: "pending",
    });

    return jsonOk({ message: "We will notify you when it's back in stock!" });
  } catch (err) {
    return handleApiError(err);
  }
}
