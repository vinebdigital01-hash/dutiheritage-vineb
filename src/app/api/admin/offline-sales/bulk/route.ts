import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { adjustInventory, findInventoryRowServer, computeStockStatus, logStockMovement } from "@/services/inventory";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

type BulkSaleItem = {
  productId: string;
  size?: string;
  color?: string;
  quantitySold?: number;
  newStock?: number;
  price?: number;
};

/**
 * POST /api/admin/offline-sales/bulk
 * Body: { items: BulkSaleItem[] }
 * Updates inventory based on offline sales quantities or stock overrides.
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    const body = await request.json();
    const items: BulkSaleItem[] = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      throw new ApiError("No items provided for bulk update", 400);
    }

    let totalSold = 0;
    const errors: string[] = [];
    const deductLines: Array<{
      productId: string;
      size?: string;
      color?: string;
      quantity: number;
    }> = [];

    // 1. Separate items with quantitySold (deductions)
    for (const item of items) {
      const qSold = Number(item.quantitySold) || 0;
      if (qSold > 0) {
        deductLines.push({
          productId: String(item.productId),
          size: item.size ? String(item.size).trim() : "",
          color: item.color ? String(item.color).trim() : "",
          quantity: qSold,
        });
        totalSold += qSold;
      }
    }

    // 2. Perform inventory adjustments for deductions
    if (deductLines.length > 0) {
      try {
        await adjustInventory(deductLines, false, {
          reason: "admin",
          actor: "bulk-csv-offline-sale",
        });
      } catch (err: any) {
        errors.push(err.message || "Failed to deduct inventory for sold items");
      }
    }

    // 3. For items with direct newStock override (where quantitySold was not used)
    let overrideCount = 0;
    for (const item of items) {
      const qSold = Number(item.quantitySold) || 0;
      if (item.newStock !== undefined && item.newStock !== null && qSold <= 0) {
        const stockVal = Math.max(0, Number(item.newStock) || 0);
        try {
          const product = await Product.findById(item.productId);
          if (product) {
            const size = item.size ? String(item.size).trim() : "";
            const color = item.color ? String(item.color).trim() : "";
            const row = findInventoryRowServer(product, size, color);
            const prevStock = row ? Number(row.stock || 0) : 0;

            if (row) {
              row.stock = stockVal;
            } else if (Array.isArray(product.inventory)) {
              product.inventory.push({ size, color, stock: stockVal });
            }
            product.stockStatus = computeStockStatus(product);
            await product.save();

            await logStockMovement({
              productId: product._id.toString(),
              productName: product.name,
              size,
              color,
              delta: stockVal - prevStock,
              stockAfter: stockVal,
              reason: "csv",
              actor: "bulk-csv-override",
            });
            overrideCount++;
          }
        } catch (e: any) {
          errors.push(`Product ${item.productId}: ${e.message}`);
        }
      }
    }

    return jsonOk({
      success: errors.length === 0,
      updatedCount: deductLines.length + overrideCount,
      totalSold,
      overrideCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
