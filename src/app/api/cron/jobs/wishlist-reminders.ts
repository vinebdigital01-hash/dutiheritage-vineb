import { requireCronSecret } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Wishlist, Product, Order } from "@/models";
import { sendWishlistReminder } from "@/lib/automations";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

const DAY = 24 * 60 * 60 * 1000;

const STAGES: { stage: "3d" | "7d"; minAge: number; maxAge: number }[] = [
  { stage: "3d", minAge: 3 * DAY, maxAge: 7 * DAY },
  { stage: "7d", minAge: 7 * DAY, maxAge: 14 * DAY },
];

export async function runWishlistReminders() {
  
  requireMongo();
  await connectDB();

  const now = Date.now();
  const results: any[] = [];

  for (const { stage, minAge, maxAge } of STAGES) {
    const filter = {
      createdAt: {
        $lte: new Date(now - minAge),
        $gt: new Date(now - maxAge),
      },
      email: { $exists: true, $ne: "" },
    };

    const wishlists = await Wishlist.find(filter).limit(50).lean();

    for (const w of wishlists) {
      if (!w.email) continue;
      
      // Check if they purchased it already
      const hasPurchased = await Order.exists({
        email: w.email,
        "items.productId": w.productId,
        createdAt: { $gt: w.createdAt }
      });
      if (hasPurchased) continue;

      const product = await Product.findById(w.productId).lean();
      if (!product) continue;

      const result = await sendWishlistReminder({
        email: w.email,
        stage,
        productId: product._id.toString(),
        productName: product.name,
        productSlug: product.slug,
        customerId: w.customerId?.toString(),
      });

      results.push({
        wishlistId: w._id.toString(),
        stage,
        result,
      });
    }
  }

  return {
    processed: results.length,
    results,
    at: new Date().toISOString(),
  };
}




