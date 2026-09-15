new_route = """import { connectDB } from "@/lib/mongodb";
import { Order, Event, Cart, Customer, Product, Collection } from "@/models";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 1 & 2. Revenue & Orders Trend
    const orders = await Order.find({
      createdAt: { $gte: startDate },
      status: { $ne: "Cancelled" }
    }).select("createdAt total paymentMethod").lean();

    const trendMap = new Map<string, { date: string; revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      trendMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0 });
    }

    let cod = 0;
    let prepaid = 0;
    let partial = 0;

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split("T")[0];
      if (trendMap.has(dateStr)) {
        const t = trendMap.get(dateStr)!;
        t.revenue += o.total || 0;
        t.orders += 1;
      }
      
      if (o.paymentMethod === "cod") cod++;
      else if (o.paymentMethod === "prepaid") prepaid++;
      else if (o.paymentMethod === "partial") partial++;
    });

    const trends = Array.from(trendMap.values());
    const paymentSplit = [
      { name: "COD", value: cod, color: "#f59e0b" },
      { name: "Prepaid", value: prepaid, color: "#10b981" },
      { name: "Partial", value: partial, color: "#3b82f6" },
    ].filter(p => p.value > 0);

    // 3. Top Products
    const topProductsAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", name: { $first: "$items.name" }, sales: { $sum: "$items.quantity" } } },
      { $sort: { sales: -1 } },
      { $limit: 10 }
    ]);

    // 4. Top Collections by Views
    const colViews = await Event.aggregate([
      { $match: { createdAt: { $gte: startDate }, event: "collection_view" } },
      { $group: { _id: "$collectionId", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]);
    
    // Resolve collection names
    const collections = await Collection.find({ _id: { $in: colViews.map(c => c._id) } }).select("name").lean();
    const colNameMap = new Map(collections.map(c => [c._id.toString(), c.name]));
    
    const topCollections = colViews.map((c, i) => {
      const colors = ["#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6"];
      return {
        name: colNameMap.get(c._id?.toString() || "") || "Unknown",
        views: c.views,
        color: colors[i % colors.length]
      };
    }).filter(c => c.name !== "Unknown");

    // 5. Abandoned Cart by Collection
    // Carts have items array. We find abandoned carts, unwind items, group by collectionId
    const abandoned = await Cart.aggregate([
      { $match: { status: "abandoned", lastUpdated: { $gte: startDate } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", count: { $sum: 1 } } }, // Group by product first to get collection
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    // Resolve products to get their collections
    const productIds = abandoned.map(a => a._id);
    const cartProducts = await Product.find({ _id: { $in: productIds } }).select("collectionId").lean();
    const prodColMap = new Map(cartProducts.map(p => [p._id.toString(), p.collectionId]));
    
    const colAbandonMap = new Map<string, number>();
    abandoned.forEach(a => {
      const colId = prodColMap.get(a._id?.toString() || "");
      if (colId) {
        colAbandonMap.set(colId, (colAbandonMap.get(colId) || 0) + a.count);
      }
    });
    
    const abandonedCollections = await Collection.find({ _id: { $in: Array.from(colAbandonMap.keys()) } }).select("name").lean();
    const abColNameMap = new Map(abandonedCollections.map(c => [c._id.toString(), c.name]));
    
    const abandonedCartsByCollection = Array.from(colAbandonMap.entries()).map(([colId, count]) => ({
      name: abColNameMap.get(colId) || "Unknown",
      abandonments: count
    })).sort((a, b) => b.abandonments - a.abandonments).slice(0, 5);

    // 6. Conversion Funnel
    const funnelEvents = await Event.aggregate([
      { $match: { createdAt: { $gte: startDate }, event: { $in: ["product_view", "add_to_cart", "checkout_start", "purchase"] } } },
      { $group: { _id: "$event", count: { $sum: 1 } } }
    ]);
    
    const funnelMap = new Map(funnelEvents.map(e => [e._id, e.count]));
    const conversionFunnel = [
      { name: "Views", value: funnelMap.get("product_view") || 0 },
      { name: "Add to Cart", value: funnelMap.get("add_to_cart") || 0 },
      { name: "Checkout", value: funnelMap.get("checkout_start") || 0 },
      { name: "Purchase", value: funnelMap.get("purchase") || 0 },
    ];

    // 7. Customer Acquisition (New vs Returning)
    // For simplicity, we just count Customers created per day vs Orders per day
    const newCustomers = await Customer.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const customerMap = new Map(newCustomers.map(c => [c._id, c.count]));
    const customerAcquisition = trends.map(t => {
      const newCust = customerMap.get(t.date) || 0;
      return {
        date: t.date,
        new: newCust,
        returning: Math.max(0, t.orders - newCust) // Approximation
      };
    });

    return jsonOk({
      trends,
      paymentSplit,
      topProducts: topProductsAgg,
      topCollections,
      abandonedCartsByCollection,
      conversionFunnel,
      customerAcquisition
    });

  } catch (error) {
    return handleApiError(error);
  }
}
"""

import os
os.makedirs("src/app/api/analytics/dashboard", exist_ok=True)
with open("src/app/api/analytics/dashboard/route.ts", "w", encoding="utf-8") as f:
    f.write(new_route)
print("Created dashboard API")
