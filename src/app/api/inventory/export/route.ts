import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { Product } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, requireMongo } from "@/lib/api";

/**
 * GET /api/inventory/export — CSV of tracked (and sized) stock. Managers can download this.
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    const products = await Product.find({
      $or: [{ trackInventory: true }, { "inventory.0": { $exists: true } }, { "sizes.0": { $exists: true } }],
    })
      .select("name sizes inventory")
      .sort({ name: 1 })
      .lean();

    const rows = ["productId,productName,size,sku,stock"];
    for (const p of products) {
      const inv = Array.isArray(p.inventory) ? p.inventory : [];
      const sizeSet = new Set<string>();
      for (const s of p.sizes || []) if (s) sizeSet.add(String(s));
      for (const r of inv) if (r.size) sizeSet.add(String(r.size));
      if (sizeSet.size === 0) continue;
      for (const size of sizeSet) {
        const row = inv.find((r) => r.size === size);
        const name = String(p.name || "").replace(/"/g, '""');
        const sku = String(row?.sku || "").replace(/"/g, '""');
        rows.push(
          [
            p._id.toString(),
            `"${name}"`,
            `"${size.replace(/"/g, '""')}"`,
            `"${sku}"`,
            row ? Number(row.stock || 0) : 0,
          ].join(",")
        );
      }
    }

    return new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename=inventory.csv',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
