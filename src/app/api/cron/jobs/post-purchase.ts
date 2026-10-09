import { requireCronSecret } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { sendReviewReminder } from "@/lib/automations";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Review reminder ~3 days after delivery.
 */
export async function runPostPurchase() {
  
  requireMongo();
  await connectDB();

  const oldest = new Date(Date.now() - 7 * DAY);
  const newest = new Date(Date.now() - 3 * DAY);

  const orders = await Order.find({
    status: "Delivered",
    updatedAt: { $gte: oldest, $lte: newest },
  })
    .limit(50)
    .lean();

  const results = [];
  for (const order of orders) {
    const result = await sendReviewReminder({
      email: order.customer?.email,
      phone: order.customer?.phone,
      orderId: order.orderId,
      customerId: order.customerId?.toString(),
    });
    results.push({ orderId: order.orderId, result });
  }

  return { processed: results.length, results };
}




