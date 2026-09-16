import { Product, StockMovement } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import mongoose from "mongoose";

export type StockLine = {
  productId: string;
  size?: string;
  quantity: number;
  name?: string;
};

type InventoryRow = { size?: string | null; stock?: number | null; sku?: string | null };

export function enforcesInventory(product: {
  trackInventory?: boolean;
  inventory?: InventoryRow[] | null;
}): boolean {
  if (product.trackInventory) return true;
  return Array.isArray(product.inventory) && product.inventory.length > 0;
}

export function resolveInventorySize(
  product: { inventory?: InventoryRow[] | null; sizes?: string[] },
  requested?: string
): string | undefined {
  const rows = product.inventory || [];
  if (requested) {
    const exact = rows.find((r) => r.size === requested);
    if (exact) return requested;
  }
  if (!requested && rows.length === 1) return rows[0]?.size || undefined;
  return requested;
}

export function availableStock(
  product: { inventory?: InventoryRow[] | null },
  size?: string
): number {
  const rows = product.inventory || [];
  if (!rows.length) return 0;
  const row = size
    ? rows.find((r) => r.size === size)
    : rows.length === 1
      ? rows[0]
      : undefined;
  return row ? Number(row.stock || 0) : 0;
}

export function computeStockStatus(
  product: { inventory?: InventoryRow[] | null; lowStockThreshold?: number }
): "in_stock" | "low_stock" | "out_of_stock" {
  const rows = product.inventory || [];
  if (!rows.length) return "in_stock";
  const total = rows.reduce((s, r) => s + Number(r.stock || 0), 0);
  if (total <= 0) return "out_of_stock";
  const threshold = product.lowStockThreshold ?? 3;
  if (rows.some((r) => Number(r.stock || 0) > 0 && Number(r.stock || 0) <= threshold)) {
    return "low_stock";
  }
  return "in_stock";
}

export function assertLineInStock(
  product: {
    name?: string;
    trackInventory?: boolean;
    inventory?: InventoryRow[] | null;
  },
  size: string | undefined,
  qty: number
) {
  if (!enforcesInventory(product)) return;
  const resolved = resolveInventorySize(product, size);
  const stock = availableStock(product, resolved);
  if (stock < qty) {
    throw new ApiError(
      `Only ${stock} left for ${product.name || "this product"}${resolved ? ` (Size: ${resolved})` : ""}`,
      400
    );
  }
}

export async function logStockMovement(input: {
  productId: string;
  productName?: string;
  size?: string;
  delta: number;
  stockAfter?: number;
  reason: "order" | "cancel" | "return" | "admin" | "csv";
  orderId?: string;
  actor?: string;
}) {
  await StockMovement.create({
    productId: input.productId,
    productName: input.productName,
    size: input.size || "",
    delta: input.delta,
    stockAfter: input.stockAfter,
    reason: input.reason,
    orderId: input.orderId,
    actor: input.actor,
  });
}

export async function logInventoryDiff(
  productId: string,
  productName: string,
  prev: InventoryRow[],
  next: InventoryRow[],
  meta: { reason: "admin" | "csv"; actor?: string }
) {
  const sizes = new Set([
    ...prev.map((r) => r.size || ""),
    ...next.map((r) => r.size || ""),
  ]);
  for (const size of sizes) {
    const before = Number(prev.find((r) => (r.size || "") === size)?.stock || 0);
    const after = Number(next.find((r) => (r.size || "") === size)?.stock || 0);
    const delta = after - before;
    if (delta === 0) continue;
    await logStockMovement({
      productId,
      productName,
      size,
      delta,
      stockAfter: after,
      reason: meta.reason,
      actor: meta.actor,
    });
  }
}

export async function setAbsoluteStock(
  items: Array<{ productId: string; size?: string; stock: number }>,
  meta: { actor?: string; reason: "admin" | "csv" }
) {
  await connectDB();
  let updatedCount = 0;

  for (const item of items) {
    const productId = String(item.productId || "").trim();
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;
    const parsedStock = Number(item.stock);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) continue;

    const product = await Product.findById(productId);
    if (!product) continue;

    const prev = (product.inventory || []).map((r) => ({
      size: r.size,
      stock: r.stock,
      sku: r.sku,
    }));
    const size = (item.size || "").trim() || (prev.length === 1 ? prev[0]?.size : undefined);
    if (!size) continue;

    const existingRow = product.inventory.find((r) => r.size === size);
    if (existingRow) {
      existingRow.stock = parsedStock;
    } else {
      product.inventory.push({ size, stock: parsedStock, sku: "" });
    }
    product.stockStatus = computeStockStatus(product);
    await product.save();
    await logInventoryDiff(
      product._id.toString(),
      product.name,
      prev,
      (product.inventory || []).map((r) => ({ size: r.size, stock: r.stock, sku: r.sku })),
      meta
    );
    updatedCount += 1;
  }

  return updatedCount;
}

export async function getRecentMovements(opts?: { productId?: string; limit?: number }) {
  await connectDB();
  const filter: Record<string, string> = {};
  if (opts?.productId) filter.productId = opts.productId;
  const docs = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(opts?.limit ?? 50, 200))
    .lean();
  return docs.map((d) => ({
    id: d._id.toString(),
    productId: d.productId,
    productName: d.productName || "",
    size: d.size || "",
    delta: d.delta,
    stockAfter: d.stockAfter,
    reason: d.reason,
    orderId: d.orderId,
    actor: d.actor,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));
}

async function refreshStatus(productId: string) {
  const p = await Product.findById(productId);
  if (!p) return;
  p.stockStatus = computeStockStatus(p);
  await p.save();
}

/**
 * Atomic decrement (or increment on cancel). Throws if stock would go negative.
 */
export async function adjustInventory(
  items: StockLine[],
  increment: boolean = false,
  meta?: { reason?: "order" | "cancel" | "return" | "admin" | "csv"; orderId?: string; actor?: string }
) {
  await connectDB();
  const reason = meta?.reason || (increment ? "cancel" : "order");
  const alerts: string[] = [];

  for (const item of items) {
    if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) continue;
    const qty = Math.abs(Number(item.quantity) || 0);
    if (qty <= 0) continue;

    const product = await Product.findById(item.productId);
    if (!product || !enforcesInventory(product)) continue;

    const size = resolveInventorySize(product, item.size);
    if (!size) {
      if (!increment) {
        throw new ApiError(
          `Select a valid size for ${product.name} — this item is inventory-tracked.`,
          400
        );
      }
      continue;
    }

    const filter = {
      _id: product._id,
      inventory: { $elemMatch: { size, stock: increment ? { $gte: 0 } : { $gte: qty } } },
    };
    const update = { $inc: { "inventory.$.stock": increment ? qty : -qty } };
    const res = await Product.updateOne(filter, update);

    if (!increment && res.modifiedCount !== 1) {
      throw new ApiError(
        `Not enough stock for ${product.name} (Size: ${size}). Refresh and try again.`,
        409
      );
    }

    const after = await Product.findById(product._id).lean();
    const row = after?.inventory?.find((i) => i.size === size);
    const stockAfter = row ? Number(row.stock || 0) : undefined;

    await logStockMovement({
      productId: product._id.toString(),
      productName: product.name,
      size,
      delta: increment ? qty : -qty,
      stockAfter,
      reason,
      orderId: meta?.orderId,
      actor: meta?.actor,
    });
    await refreshStatus(product._id.toString());

    if (!increment && after?.trackInventory) {
      const threshold = after.lowStockThreshold || 3;
      if (row && row.stock <= threshold) {
        alerts.push(
          `- ${after.name} (Size: ${row.size || "Default"}) — Only ${row.stock} left`
        );
      }
    }
  }

  if (alerts.length > 0) {
    const { sendEmail } = await import("@/lib/email");
    const emailTo =
      process.env.SUPER_ADMIN_EMAIL ||
      process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
      "";
    if (emailTo) {
      await sendEmail({
        to: emailTo,
        subject: "Low stock alert — Duti Heritage",
        html: `<p>These items are at or below the low-stock threshold:</p><ul>${alerts.map((a) => `<li>${a}</li>`).join("")}</ul><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/inventory">Open inventory</a></p>`,
        type: "orders",
      });
    }
  }
}

export async function getInventoryAlerts() {
  await connectDB();
  const products = await Product.find({
    $or: [{ trackInventory: true }, { "inventory.0": { $exists: true } }],
  }).lean();

  const low: Array<{
    id: string;
    name: string;
    slug: string;
    size: string;
    sku?: string;
    stock: number;
    threshold: number;
    status: "low_stock" | "out_of_stock";
  }> = [];

  for (const p of products) {
    const threshold = p.lowStockThreshold ?? 3;
    for (const inv of p.inventory || []) {
      const stock = Number(inv.stock || 0);
      if (stock <= threshold) {
        low.push({
          id: p._id.toString(),
          name: p.name,
          slug: p.slug,
          size: inv.size || "",
          sku: inv.sku || undefined,
          stock,
          threshold,
          status: stock <= 0 ? "out_of_stock" : "low_stock",
        });
      }
    }
  }

  low.sort((a, b) => a.stock - b.stock);
  return {
    alerts: low,
    lowCount: low.filter((a) => a.status === "low_stock").length,
    outCount: low.filter((a) => a.status === "out_of_stock").length,
  };
}
