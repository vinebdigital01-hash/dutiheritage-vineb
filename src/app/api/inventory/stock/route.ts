import { Product } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { setAbsoluteStock } from "@/services/inventory";
import { logAdminAction } from "@/lib/admin-audit";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

type StockRow = {
  productId: string;
  name: string;
  size: string;
  sku: string;
  stock: number;
  trackInventory: boolean;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/inventory/stock — list sizes a packer can type a quantity for.
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(40, Math.max(1, Number(searchParams.get("limit") || "30")));
    const filter: Record<string, unknown> = {};
    if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };

    const [docs, total] = await Promise.all([
      Product.find(filter)
        .select("name sizes inventory trackInventory")
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const rows: (StockRow & { color: string })[] = [];
    for (const p of docs) {
      const inv = Array.isArray(p.inventory) ? p.inventory : [];
      
      // Collect combinations of size & color
      const combinations = new Map<string, {size: string, color: string}>();
      
      for (const r of inv) {
        const s = String(r.size || "");
        const c = String(r.color || "");
        combinations.set(`${c}-${s}`, { size: s, color: c });
      }
      
      // If there's no inventory entries yet, just show sizes with no color
      if (combinations.size === 0 && Array.isArray(p.sizes)) {
         for (const s of p.sizes) {
            combinations.set(`-${String(s)}`, { size: String(s), color: "" });
         }
      }
      
      if (combinations.size === 0) continue;
      
      for (const { size, color } of combinations.values()) {
        const row = inv.find((r) => r.size === size && (r.color || "") === color);
        rows.push({
          productId: p._id.toString(),
          name: String(p.name || ""),
          size,
          color,
          sku: row?.sku ? String(row.sku) : "",
          stock: row ? Number(row.stock || 0) : 0,
          trackInventory: Boolean(p.trackInventory),
        });
      }
    }

    return jsonOk({
      rows,
      page,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/inventory/stock — set qty for one size (or a CSV batch). Logs movements.
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    const body = await request.json();
    const items = Array.isArray(body.items)
      ? body.items
      : [
          {
            productId: body.productId,
            size: body.size,
            stock: body.stock,
          },
        ];

    if (!body.items) {
      if (!String(body.productId || "").trim()) throw new ApiError("productId is required");
      if (!String(body.size || "").trim()) throw new ApiError("size is required");
      const stock = Number(body.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        throw new ApiError("Quantity must be 0 or more");
      }
    }

    const actor = authUser.email || authUser.uid;
    const updatedCount = await setAbsoluteStock(
      items.map((item: { productId?: string; size?: string; color?: string; stock?: string | number }) => ({
        productId: String(item.productId || ""),
        size: item.size ? String(item.size) : undefined,
        color: item.color ? String(item.color) : undefined,
        stock: Number(item.stock),
      })),
      { reason: Array.isArray(body.items) ? "csv" : "admin", actor }
    );

    if (updatedCount === 0) {
      throw new ApiError("Nothing was updated. Check the product and size.");
    }

    await logAdminAction({
      request,
      actor: authUser,
      action: "update",
      resource: "inventory",
      resourceId: String(body.productId || "batch"),
      message: Array.isArray(body.items)
        ? `CSV stock ${updatedCount} rows`
        : `${body.size} → ${body.stock}`,
    });

    return jsonOk({ updatedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
