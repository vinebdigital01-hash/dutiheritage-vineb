import { requireCronSecret } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Cart } from "@/models";
import { sendCartAbandoned } from "@/lib/automations";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

const HOUR = 60 * 60 * 1000;

type Stage = "1h" | "24h" | "72h";

const STAGES: { stage: Stage; minAge: number; maxAge?: number }[] = [
  { stage: "1h", minAge: 1 * HOUR, maxAge: 24 * HOUR },
  { stage: "24h", minAge: 24 * HOUR, maxAge: 72 * HOUR },
  { stage: "72h", minAge: 72 * HOUR },
];

/**
 * GET/POST /api/cron/abandoned-carts
 * Auth: Authorization: Bearer CRON_SECRET
 * Marks stale active carts abandoned and sends 1h / 24h / 72h reminders.
 */
async function run(request: Request) {
  requireCronSecret(request);
  requireMongo();
  await connectDB();

  const now = Date.now();
  const results: { cartId: string; stage: Stage; result: unknown }[] = [];

  // Mark carts inactive > 1h as abandoned (still eligible for emails)
  await Cart.updateMany(
    {
      status: "active",
      lastUpdated: { $lte: new Date(now - HOUR) },
      items: { $exists: true, $ne: [] },
    },
    { $set: { status: "abandoned" } }
  );

  for (const { stage, minAge, maxAge } of STAGES) {
    const filter: Record<string, unknown> = {
      status: { $in: ["abandoned", "emailed", "active"] },
      items: { $exists: true, $ne: [] },
      $or: [{ email: { $exists: true, $ne: "" } }, { phone: { $exists: true, $ne: "" } }],
      lastUpdated: {
        $lte: new Date(now - minAge),
        ...(maxAge ? { $gt: new Date(now - maxAge) } : {}),
      },
    };

    const carts = await Cart.find(filter).limit(50).lean();

    for (const cart of carts) {
      if (!cart.email && !cart.phone) continue;
      const itemSummary = (cart.items || [])
        .slice(0, 3)
        .map((i) => i.name || i.productId)
        .join(", ");

      const result = await sendCartAbandoned({
        email: cart.email,
        phone: cart.phone,
        stage,
        cartId: cart._id.toString(),
        customerId: cart.customerId?.toString(),
        itemSummary,
      });

      if (result.sent) {
        await Cart.updateOne(
          { _id: cart._id },
          { $set: { status: "emailed" } }
        );
      }

      results.push({
        cartId: cart._id.toString(),
        stage,
        result,
      });
    }
  }

  return jsonOk({
    processed: results.length,
    results,
    at: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  try {
    return await run(request);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    return await run(request);
  } catch (error) {
    return handleApiError(error);
  }
}
