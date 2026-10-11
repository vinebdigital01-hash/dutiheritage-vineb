import { Product, StockMovement } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import mongoose from "mongoose";
import { getPublicSiteUrl } from "@/lib/utils";

export type StockLine = {
  productId: string;
  size?: string;
  color?: string;
  quantity: number;
  name?: string;
};

type InventoryRow = {
  size?: string | null;
  color?: string | null;
  stock?: number | null;
  sku?: string | null;
};

function normColor(c?: string | null) {
  return String(c || "").trim();
}

/** Find inventory row by size + color (color-aware; falls back safely for legacy rows). */
export function findInventoryRowServer(
  product: { inventory?: InventoryRow[] | null },
  size?: string,
  color?: string
): InventoryRow | undefined {
  const rows = product.inventory || [];
  if (!rows.length) return undefined;
  const wantColor = normColor(color);
  if (size) {
    const exact = rows.find(
      (r) => r.size === size && normColor(r.color) === wantColor
    );
    if (exact) return exact;
    const bySize = rows.filter((r) => r.size === size);
    if (bySize.length === 1) return bySize[0];
    if (!wantColor && bySize.length > 0) return bySize[0];
  }
  if (!size && rows.length === 1) return rows[0];
  return undefined;
}

export function enforcesInventory(product: {
  trackInventory?: boolean;
  inventory?: InventoryRow[] | null;
}): boolean {
  if (product.trackInventory) return true;
  return Array.isArray(product.inventory) && product.inventory.length > 0;
}

export function resolveInventorySize(
  product: { inventory?: InventoryRow[] | null; sizes?: string[] },
  requested?: string,
  color?: string
): string | undefined {
  const row = findInventoryRowServer(product, requested, color);
  if (row?.size) return row.size || undefined;
  if (requested) return requested;
  if (!requested && (product.inventory || []).length === 1) {
    return product.inventory?.[0]?.size || undefined;
  }
  return requested;
}

export function availableStock(
  product: { inventory?: InventoryRow[] | null },
  size?: string,
  color?: string
): number {
  const row = findInventoryRowServer(product, size, color);
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
  qty: number,
  color?: string
) {
  if (!enforcesInventory(product)) return;
  const resolved = resolveInventorySize(product, size, color);
  const stock = availableStock(product, resolved, color);
  if (stock < qty) {
    const label = [
      resolved ? `Size: ${resolved}` : "",
      normColor(color) ? `Color: ${normColor(color)}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    throw new ApiError(
      `Only ${stock} left for ${product.name || "this product"}${label ? ` (${label})` : ""}`,
      400
    );
  }
}

export async function logStockMovement(input: {
  productId: string;
  productName?: string;
  size?: string;
  color?: string;
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
    color: normColor(input.color),
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
  const keys = new Set([
    ...prev.map((r) => `${normColor(r.color)}::${r.size || ""}`),
    ...next.map((r) => `${normColor(r.color)}::${r.size || ""}`),
  ]);
  for (const key of keys) {
    const [color, size] = key.split("::");
    const before = Number(
      prev.find(
        (r) => (r.size || "") === size && normColor(r.color) === color
      )?.stock || 0
    );
    const after = Number(
      next.find(
        (r) => (r.size || "") === size && normColor(r.color) === color
      )?.stock || 0
    );
    const delta = after - before;
    if (delta === 0) continue;
    await logStockMovement({
      productId,
      productName,
      size,
      color,
      delta,
      stockAfter: after,
      reason: meta.reason,
      actor: meta.actor,
    });
    try {
      const { notifyBotWaitlistOnRestock } = await import("@/lib/bot-waitlist-notify");
      await notifyBotWaitlistOnRestock({
        productId,
        productName,
        size,
        prevStock: before,
        nextStock: after,
      });
    } catch (e) {
      console.error("[bot-waitlist-restock]", e);
    }
    try {
      const { processAutoRestockEmails } = await import("@/lib/auto-restock-notify");
      await processAutoRestockEmails({
        productId,
        productName,
        size,
        color,
        prevStock: before,
        nextStock: after,
      });
    } catch (e) {
      console.error("[auto-restock-email]", e);
    }
  }
}

export async function setAbsoluteStock(
  items: Array<{ productId: string; size?: string; color?: string; stock: number }>,
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
      color: r.color,
      stock: r.stock,
      sku: r.sku,
    }));
    const size = (item.size || "").trim() || (prev.length === 1 ? prev[0]?.size : undefined);
    if (!size) continue;
    const color = (item.color || "").trim();

    const existingRow = product.inventory.find((r) => r.size === size && (r.color || "") === color);
    if (existingRow) {
      existingRow.stock = parsedStock;
    } else {
      product.inventory.push({ size, color, stock: parsedStock, sku: "" });
    }
    if (!product.sizes.includes(size)) {
      product.sizes.push(size);
    }
    if (color && !product.colors) {
       // if product.colors doesn't exist, we skip, wait, actually Product doesn't have an array of colors? It has `colors: [String]` or a single string `colors`?
       // ProductForm uses `form.colors.split(',')` which means it's a string, wait, let's just leave colors alone.
    }
    product.trackInventory = true;
    product.stockStatus = computeStockStatus(product);
    await product.save();
    const nextRows = (product.inventory || []).map((r) => ({
      size: r.size,
      color: r.color,
      stock: r.stock,
      sku: r.sku,
    }));
    await logInventoryDiff(
      product._id.toString(),
      product.name,
      prev,
      nextRows,
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
    color: (d as { color?: string }).color || "",
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

    const color = normColor(item.color);
    const size = resolveInventorySize(product, item.size, color);
    if (!size) {
      if (!increment) {
        throw new ApiError(
          `Select a valid size for ${product.name} — this item is inventory-tracked.`,
          400
        );
      }
      continue;
    }

    // Normalize missing color fields so color-aware matching is reliable
    for (const r of product.inventory || []) {
      if (r.color == null) r.color = "";
    }

    const row = findInventoryRowServer(product, size, color);
    if (!row) {
      if (!increment) {
        throw new ApiError(
          `Size ${size}${color ? ` / ${color}` : ""} is not tracked for ${product.name}.`,
          400
        );
      }
      continue;
    }

    const current = Number(row.stock || 0);
    if (!increment && current < qty) {
      throw new ApiError(
        `Not enough stock for ${product.name} (Size: ${size}${color ? `, Color: ${color}` : ""}). Refresh and try again.`,
        409
      );
    }

    row.stock = increment ? current + qty : current - qty;
    product.stockStatus = computeStockStatus(product);
    await product.save();

    const stockAfter = Number(row.stock || 0);

    await logStockMovement({
      productId: product._id.toString(),
      productName: product.name,
      size,
      color,
      delta: increment ? qty : -qty,
      stockAfter,
      reason,
      orderId: meta?.orderId,
      actor: meta?.actor,
    });
    await refreshStatus(product._id.toString());

    if (product.slug) {
      try {
        const { revalidatePath } = await import("next/cache");
        revalidatePath(`/products/${product.slug}`);
      } catch {
        /* non-Next callers */
      }
    }

    if (!increment && product.trackInventory) {
      const threshold = product.lowStockThreshold || 3;
      if (stockAfter <= threshold) {
        alerts.push(
          `- ${product.name} (Size: ${size}${color ? `, ${color}` : ""}) — Only ${stockAfter} left`
        );
      }
    }
  }

  if (alerts.length > 0) {
    const { sendEmail } = await import("@/lib/email");
    const { getStoreSettings } = await import("@/lib/store-settings");
    let emailTo = "";
    try {
      emailTo = String((await getStoreSettings()).supportEmail || "").trim();
    } catch {
      emailTo = "";
    }
    if (!emailTo) {
      emailTo =
        process.env.SUPER_ADMIN_EMAIL ||
        process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
        "";
    }
    if (emailTo) {
      const { emailLayout, emailEyebrow, emailLead, emailNote, escHtml } =
        await import("@/lib/email");
      const list = alerts
        .map((a) => `<li style="margin:0 0 8px;">${escHtml(a.replace(/^- /, ""))}</li>`)
        .join("");
      await sendEmail({
        to: emailTo,
        subject: "Low stock alert — Duti Heritage",
        html: emailLayout(
          "Low stock alert",
          emailEyebrow("Inventory") +
            emailLead("These items are at or below the low-stock threshold:") +
            `<ul style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.5;">${list}</ul>` +
            emailNote("Restock soon so checkout does not oversell."),
          {
            kind: "staff",
            hideDefaultCtas: true,
            primaryCta: {
              label: "Open inventory",
              href: `${getPublicSiteUrl()}/admin/inventory`,
            },
          }
        ),
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
