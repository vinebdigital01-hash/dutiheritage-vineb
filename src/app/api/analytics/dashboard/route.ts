import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Order, Event, Cart, Customer, Product, Collection } from "@/models";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    for (let i = 0; i <= days; i++) {
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
      { $match: { createdAt: { $gte: startDate }, event: "product_view" } },
      { $group: { _id: "$productId", views: { $sum: 1 } } },
    ]);
    
    // Resolve products to get their collections
    const viewProductIds = colViews
      .map(c => c._id?.toString() || "")
      .filter(id => id && mongoose.isValidObjectId(id));
      
    const viewProducts = viewProductIds.length > 0 
      ? await Product.find({ _id: { $in: viewProductIds } } as any).select("collectionId").lean()
      : [];
      
    const pColMap = new Map(viewProducts.map(p => [p._id.toString(), p.collectionId]));
    const colViewsMap = new Map<string, number>();
    
    colViews.forEach(cv => {
      const colId = pColMap.get(cv._id?.toString() || "");
      if (colId) {
        colViewsMap.set(colId, (colViewsMap.get(colId) || 0) + cv.views);
      }
    });
    
    const validColViewIds = Array.from(colViewsMap.keys())
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));
      
    const collections = await Collection.find({ _id: { $in: validColViewIds } } as any).select("name").lean();
    const colNameMap = new Map(collections.map(c => [c._id.toString(), c.name]));
    
    const topCollections = Array.from(colViewsMap.entries())
      .map(([colId, views], i) => {
        const colors = ["#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6"];
        return {
          name: colNameMap.get(colId) || "Unknown",
          views,
          color: colors[i % colors.length]
        };
      })
      .filter(c => c.name !== "Unknown")
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // 5. Abandoned Cart by Collection
    const abandoned = await Cart.aggregate([
      { $match: { status: "abandoned", lastUpdated: { $gte: startDate } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", count: { $sum: 1 } } }, // Group by product first to get collection
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    // Resolve products to get their collections safely
    const productIds = abandoned.map(a => a._id?.toString() || "").filter(id => id && mongoose.isValidObjectId(id));
    const cartProducts = productIds.length > 0
      ? await Product.find({ _id: { $in: productIds } } as any).select("collectionId").lean()
      : [];
    const prodColMap = new Map(cartProducts.map(p => [p._id.toString(), p.collectionId]));
    
    const colAbandonMap = new Map<string, number>();
    abandoned.forEach(a => {
      const colId = prodColMap.get(a._id?.toString() || "");
      if (colId) {
        colAbandonMap.set(colId, (colAbandonMap.get(colId) || 0) + a.count);
      }
    });
    
    const validAbColIds = Array.from(colAbandonMap.keys())
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));
      
    const abandonedCollections = await Collection.find({ _id: { $in: validAbColIds } } as any).select("name").lean();
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
    console.error("[analytics/dashboard] CRASH:", error);
    return handleApiError(error);
  }
}
