import { requireCronSecret } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order, WhatsAppAbandonedCheckout } from "@/models";
import { notifyBot } from "@/lib/bot-notify";
import { phoneMatchOr } from "@/lib/bot-phone";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

const THIRTY_MIN = 30 * 60 * 1000;

/**
 * GET/POST /api/cron/whatsapp-abandoned
 * Auth: Authorization: Bearer CRON_SECRET
 * If 30+ minutes since WhatsApp checkout start and no order → nudge once.
 */
async function run(request: Request) {
  requireCronSecret(request);
  requireMongo();
  await connectDB();

  const cutoff = new Date(Date.now() - THIRTY_MIN);
  const rows = await WhatsAppAbandonedCheckout.find({
    notifiedAt: null,
    convertedAt: null,
    createdAt: { $lte: cutoff },
  })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  const results: { id: string; phone: string; status: string }[] = [];

  for (const row of rows) {
    const recentOrder = await Order.findOne({
      $or: phoneMatchOr("customer.phone", row.phone),
      createdAt: { $gte: row.createdAt },
    })
      .select("_id orderId")
      .lean();

    if (recentOrder) {
      await WhatsAppAbandonedCheckout.updateOne(
        { _id: row._id },
        { $set: { convertedAt: new Date() } }
      );
      results.push({
        id: row._id.toString(),
        phone: row.phone,
        status: "converted",
      });
      continue;
    }

    const message =
      "Hey! Just checking in. Were you able to complete the payment for your order? ⏳";
    const sent = await notifyBot({ phone: row.phone, message });
    await WhatsAppAbandonedCheckout.updateOne(
      { _id: row._id },
      { $set: { notifiedAt: new Date() } }
    );
    results.push({
      id: row._id.toString(),
      phone: row.phone,
      status: sent.sent ? "notified" : `skipped:${sent.reason || "fail"}`,
    });
  }

  return jsonOk({ processed: results.length, results });
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
