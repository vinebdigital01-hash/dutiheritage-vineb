import { requireAuth } from "@/lib/auth";
import { Product } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, ApiError, requireMongo } from "@/lib/api";
import { setAbsoluteStock } from "@/services/inventory";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const products = await Product.find({ trackInventory: true }).lean();

    const rows = [];
    rows.push(["productId", "productName", "size", "sku", "stock"].join(","));

    products.forEach((p) => {
      if (p.inventory && p.inventory.length > 0) {
        p.inventory.forEach((inv) => {
          rows.push(
            [
              p._id.toString(),
              `"${p.name.replace(/"/g, '""')}"`,
              `"${(inv.size || "").replace(/"/g, '""')}"`,
              `"${(inv.sku || "").replace(/"/g, '""')}"`,
              inv.stock,
            ].join(",")
          );
        });
      } else {
        rows.push([p._id.toString(), `"${p.name.replace(/"/g, '""')}"`, "", "", "0"].join(","));
      }
    });

    const csvContent = rows.join("\n");
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=inventory.csv",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      throw new ApiError("Invalid payload. Expected { items: [...] }");
    }

    const updatedCount = await setAbsoluteStock(
      items.map((item: { productId?: string; size?: string; stock?: string | number }) => ({
        productId: String(item.productId || ""),
        size: item.size ? String(item.size) : undefined,
        stock: Number(item.stock),
      })),
      { reason: "csv", actor: authUser.email || authUser.name || "admin" }
    );

    return jsonOk({ success: true, updatedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
