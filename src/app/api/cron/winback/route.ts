import { requireCronSecret } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { sendWinback } from "@/lib/automations";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Win-back for customers dormant 30d / 60d since last purchase or visit.
 */
async function run(request: Request) {
  requireCronSecret(request);
  requireMongo();
  await connectDB();

  const now = Date.now();
  const results: unknown[] = [];

  const stages: { stage: "30d" | "60d"; min: number; max: number }[] = [
    { stage: "30d", min: 30 * DAY, max: 60 * DAY },
    { stage: "60d", min: 60 * DAY, max: 90 * DAY },
  ];

  for (const { stage, min, max } of stages) {
    const customers = await Customer.find({
      $or: [{ email: { $exists: true, $ne: "" } }, { phone: { $exists: true, $ne: "" } }],
      $and: [
        {
          $or: [
            {
              lastPurchase: {
                $lte: new Date(now - min),
                $gt: new Date(now - max),
              },
            },
            {
              lastPurchase: { $exists: false },
              lastVisit: {
                $lte: new Date(now - min),
                $gt: new Date(now - max),
              },
            },
          ],
        },
      ],
    })
      .limit(40)
      .lean();

    for (const c of customers) {
      const result = await sendWinback({
        email: c.email,
        phone: c.phone,
        name: c.name,
        stage,
        customerId: c._id.toString(),
      });
      results.push({ customerId: c._id.toString(), stage, result });
    }
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
