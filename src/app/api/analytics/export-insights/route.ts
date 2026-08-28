import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/models";
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

    // Get all events grouped by product
    const productStats = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          productId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$productId",
          productName: { $first: "$productName" },
          collectionId: { $first: "$collectionId" },
          views: {
            $sum: { $cond: [{ $eq: ["$event", "product_view"] }, 1, 0] },
          },
          add_to_cart: {
            $sum: { $cond: [{ $eq: ["$event", "add_to_cart"] }, 1, 0] },
          },
          purchases: {
            $sum: { $cond: [{ $eq: ["$event", "purchase"] }, 1, 0] },
          },
        },
      },
      { $sort: { views: -1 } },
    ]);

    let csv = "Product Name,Category ID,Total Views,Adds to Cart,Purchases,Conversion Rate (%),Drop-off Stage,Insight / Recommendation\n";

    for (const stat of productStats) {
      const views = stat.views || 0;
      const carts = stat.add_to_cart || 0;
      const purchases = stat.purchases || 0;

      const conversionRate = views > 0 ? ((purchases / views) * 100).toFixed(2) : "0.00";
      
      let dropOff = "None";
      let insight = "Normal Performance";

      if (views > 50 && carts === 0) {
        dropOff = "Product Page";
        insight = "High Traffic but Zero Carts (Check Pricing / Description / Images)";
      } else if (carts > 10 && purchases === 0) {
        dropOff = "Checkout";
        insight = "High Cart Intent but Zero Sales (Check Shipping Cost / COD Availability)";
      } else if (views > 100 && purchases > 0 && (purchases / views) < 0.01) {
        dropOff = "Funnel";
        insight = "Low Conversion Rate (Run Retargeting Ads / Price Drop)";
      } else if (purchases > 10 && (purchases / views) > 0.05) {
        dropOff = "N/A";
        insight = "Best Seller (Increase Ad Spend Here!)";
      } else if (views < 10) {
        dropOff = "Discovery";
        insight = "Low Visibility (Feature on Homepage / Run Ads)";
      }

      const name = `"${(stat.productName || "Unknown").replace(/"/g, '""')}"`;
      const category = `"${(stat.collectionId || "Unknown").replace(/"/g, '""')}"`;
      
      csv += `${name},${category},${views},${carts},${purchases},${conversionRate}%,${dropOff},"${insight}"\n`;
    }

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="product-insights-${days}days.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
