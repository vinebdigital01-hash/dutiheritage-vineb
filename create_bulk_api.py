new_api = """import { requireAuth } from "@/lib/auth";
import { Product } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, ApiError, requireMongo } from "@/lib/api";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const products = await Product.find({ trackInventory: true }).lean();
    
    // Create CSV rows
    const rows = [];
    rows.push(["productId", "productName", "size", "sku", "stock"].join(","));

    products.forEach(p => {
      if (p.inventory && p.inventory.length > 0) {
        p.inventory.forEach(inv => {
          rows.push([
            p._id.toString(),
            `"${p.name.replace(/"/g, '""')}"`,
            `"${(inv.size || "").replace(/"/g, '""')}"`,
            `"${(inv.sku || "").replace(/"/g, '""')}"`,
            inv.stock
          ].join(","));
        });
      } else {
        // If trackInventory is true but no inventory array exists yet
        rows.push([
          p._id.toString(),
          `"${p.name.replace(/"/g, '""')}"`,
          "",
          "",
          "0"
        ].join(","));
      }
    });

    const csvContent = rows.join("\\n");
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
    const { items } = body; // Expected: [{ productId, size, stock }]

    if (!Array.isArray(items)) {
      throw new ApiError("Invalid payload. Expected { items: [...] }");
    }

    let updatedCount = 0;
    const adminName = authUser.name || authUser.email?.split("@")[0] || "Admin";

    for (const item of items) {
      if (!item.productId || typeof item.stock === 'undefined') continue;
      
      const parsedStock = parseInt(item.stock, 10);
      if (isNaN(parsedStock)) continue;

      if (item.size) {
        // Update specific size
        await Product.updateOne(
          { _id: item.productId, "inventory.size": item.size },
          { 
            $set: { 
              "inventory.$.stock": parsedStock,
              lastEditedBy: adminName,
              updatedAt: new Date()
            } 
          }
        );
      } else {
        // Update single size product (or first item in array)
        const p = await Product.findById(item.productId);
        if (p && p.inventory && p.inventory.length > 0) {
          p.inventory[0].stock = parsedStock;
          p.lastEditedBy = adminName;
          await p.save();
        }
      }
      updatedCount++;
    }

    return jsonOk({ success: true, updatedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
"""
import os
os.makedirs("src/app/api/products/bulk-inventory", exist_ok=True)
with open("src/app/api/products/bulk-inventory/route.ts", "w", encoding="utf-8") as f:
    f.write(new_api)
print("Created bulk inventory API")
