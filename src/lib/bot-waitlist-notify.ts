import { BotWaitlist, Product } from "@/models";
import { notifyBot } from "@/lib/bot-notify";

/**
 * When stock for a size goes from 0 → >0, WhatsApp waitlist subscribers.
 */
export async function notifyBotWaitlistOnRestock(input: {
  productId: string;
  productName?: string;
  size?: string;
  prevStock: number;
  nextStock: number;
}) {
  if (!(input.prevStock <= 0 && input.nextStock > 0)) return { notified: 0 };

  const productId = String(input.productId);
  const size = String(input.size || "");
  const name =
    input.productName ||
    (await Product.findById(productId).lean())?.name ||
    "Your item";

  const filter: Record<string, unknown> = {
    productId,
    notifiedAt: null,
  };
  if (size) filter.size = size;

  const rows = await BotWaitlist.find(filter).limit(200).lean();
  let notified = 0;
  for (const row of rows) {
    const result = await notifyBot({
      phone: row.phone,
      message: `Good news! ${name}${size ? ` (Size ${size})` : ""} is back in stock!`,
    });
    if (result.sent) {
      await BotWaitlist.updateOne(
        { _id: row._id },
        { $set: { notifiedAt: new Date() } }
      );
      notified += 1;
    }
  }
  return { notified };
}
