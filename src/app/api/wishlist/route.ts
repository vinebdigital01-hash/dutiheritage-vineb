import { connectDB } from "@/lib/mongodb";
import { Wishlist, Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export async function GET(request: Request) {
  try {
    requireMongo();
    const auth = await requireAuth(request);
    await connectDB();
    const wishlists = await Wishlist.find({ firebaseUid: auth.uid }).lean();
    return jsonOk({ wishlists });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    const auth = await requireAuth(request);
    const body = await request.json();
    
    if (!body.productId) {
      return new Response("Missing productId", { status: 400 });
    }

    await connectDB();

    const existing = await Wishlist.findOne({ firebaseUid: auth.uid, productId: body.productId });
    
    if (existing) {
      await existing.deleteOne();
      return jsonOk({ added: false, productId: body.productId });
    } else {
      await Wishlist.create({
        firebaseUid: auth.uid,
        email: auth.email,
        productId: body.productId,
      });
      return jsonOk({ added: true, productId: body.productId });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
