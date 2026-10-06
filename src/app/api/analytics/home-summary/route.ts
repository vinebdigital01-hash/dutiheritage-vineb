import { connectDB } from "@/lib/mongodb";
import { Order, Product, Collection, Customer } from "@/models";
import { requireAuth } from "@/lib/auth";
import { ALL_STAFF } from "@/lib/rbac";
import { startOfIstDay, startOfIstDayDaysAgo } from "@/lib/india-time";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/home-summary?days=30
 * Full-period counts from Mongo (not a 100-row browser sample).
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: ALL_STAFF });
    await connectDB();

    const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days") || "30")));
    const todayStart = startOfIstDay();
    const periodStart = startOfIstDayDaysAgo(days);
    const notCancelled = { status: { $ne: "Cancelled" } };

    const [periodAgg, todayAgg, needsConfirmation, productCount, collectionCount, customerCount] =
      await Promise.all([
        Order.aggregate([
          { $match: { createdAt: { $gte: periodStart }, ...notCancelled } },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
            },
          },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: todayStart }, ...notCancelled } },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
            },
          },
        ]),
        Order.countDocuments({ status: "Confirmation Pending" }),
        Product.countDocuments({}),
        Collection.countDocuments({}),
        Customer.countDocuments({}),
      ]);

    const period = periodAgg[0] || { revenue: 0, orders: 0 };
    const today = todayAgg[0] || { revenue: 0, orders: 0 };

    return jsonOk({
      days,
      revenue: Number(period.revenue) || 0,
      orderCount: Number(period.orders) || 0,
      todayRevenue: Number(today.revenue) || 0,
      todayOrderCount: Number(today.orders) || 0,
      needsConfirmation,
      productCount,
      collectionCount,
      customerCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
