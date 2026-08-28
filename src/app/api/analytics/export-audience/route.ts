import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Customer, Cart, Event } from "@/models";
import { handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireAuth(request, { admin: true });
    await connectDB();

    const days = Math.min(
      Math.max(Number(new URL(request.url).searchParams.get("days") || "30"), 1),
      90
    );
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch all customers active in this period
    const customers = await Customer.find({
      $or: [
        { lastVisit: { $gte: since } },
        { createdAt: { $gte: since } },
        { lastPurchase: { $gte: since } }
      ]
    }).lean();

    // Fetch abandoned carts
    const abandonedCarts = await Cart.find({
      status: { $in: ["abandoned", "emailed"] },
      lastUpdated: { $gte: since }
    }).lean();

    let csv = "Name,Email,Phone,City,State,Total Spent,LTV Score,Has Abandoned Cart,Top Viewed Product,fbclid (Meta Ads)\n";

    for (const c of customers) {
      const email = c.email || "";
      const phone = c.phone || "";
      const uid = c.firebaseUid || "";
      const idStr = String(c._id);

      // Check if they have an abandoned cart
      const hasAbandoned = abandonedCarts.some(cart => 
        (email && cart.email === email) || 
        (uid && cart.firebaseUid === uid) || 
        (cart.customerId?.toString() === idStr)
      );

      // Get their most viewed product in this period
      const topViewAgg = await Event.aggregate([
        {
          $match: {
            event: "product_view",
            createdAt: { $gte: since },
            $or: [
              { customerId: idStr },
              ...(email ? [{ email }] : []),
              ...(uid ? [{ firebaseUid: uid }] : [])
            ]
          }
        },
        {
          $group: {
            _id: "$productId",
            productName: { $first: "$productName" },
            fbclid: { $first: "$fbclid" },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);

      const topProduct = topViewAgg.length > 0 ? topViewAgg[0].productName : "";
      const fbclid = (topViewAgg.length > 0 && topViewAgg[0].fbclid) ? topViewAgg[0].fbclid : (c as any).fbclid || "";

      const name = `"${(c.name || "").replace(/"/g, '""')}"`;
      const city = `"${(c.city || "").replace(/"/g, '""')}"`;
      const state = `"${(c.state || "").replace(/"/g, '""')}"`;
      const topProdStr = `"${(topProduct || "").replace(/"/g, '""')}"`;
      
      csv += `${name},${email},${phone},${city},${state},${c.totalSpent || 0},${c.ltvScore || "LOW"},${hasAbandoned ? "Yes" : "No"},${topProdStr},${fbclid}\n`;
    }

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="retargeting-audience-${days}days.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
