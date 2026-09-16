import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, requireMongo } from "@/lib/api";
import {
  Cart,
  Collection,
  Customer,
  Event,
  Order,
  Product,
  ReturnRequest,
} from "@/models";
import { getInventoryAlerts } from "@/services/inventory";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

type Cell = string | number | Date | null;

const PAYMENT_LABEL: Record<string, string> = {
  prepaid: "Prepaid (online)",
  cod: "Cash on delivery",
  partial: "Partial (advance + COD)",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  partially_paid: "Partially paid",
  failed: "Failed",
  refunded: "Refunded",
};

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function money(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function unitPrice(item: { price?: number; salePrice?: number | null }) {
  const sale = item.salePrice;
  if (sale != null && sale > 0) return sale;
  return Number(item.price) || 0;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111111" },
  };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 22;
}

function addTable(
  wb: ExcelJS.Workbook,
  name: string,
  headers: string[],
  rows: Cell[][],
  moneyCols: number[] = []
) {
  const ws = wb.addWorksheet(name.slice(0, 31));
  styleHeader(ws.addRow(headers));
  const moneySet = new Set(moneyCols);
  if (rows.length === 0) {
    ws.addRow(["No rows for this date range."]);
  } else {
    for (const values of rows) {
      const row = ws.addRow(values.map((v) => (v === undefined ? null : v)));
      for (const col of moneySet) {
        const cell = row.getCell(col);
        if (typeof cell.value === "number") cell.numFmt = '"₹"#,##0.00';
      }
    }
  }
  const lastRow = Math.max(1, rows.length + 1);
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: lastRow, column: headers.length },
  };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = Math.min(42, Math.max(14, h.length + 4));
  });
  return ws;
}

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const days = Math.min(
      Math.max(Number(new URL(request.url).searchParams.get("days") || "30") || 30, 1),
      90
    );
    const generatedAt = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [
      orders,
      abandonedCarts,
      newCustomers,
      funnelEvents,
      returns,
      stock,
      products,
      collections,
    ] = await Promise.all([
      Order.find({ createdAt: { $gte: startDate } })
        .select(
          "orderId createdAt customer items subtotal discount shipping codCharge prepaidDiscount total paymentMethod paymentStatus couponCode status trackingInfo refundedAmount notes"
        )
        .sort({ createdAt: 1 })
        .lean(),
      Cart.find({
        status: { $in: ["abandoned", "emailed"] },
        lastUpdated: { $gte: startDate },
      })
        .select("email phone items status lastUpdated")
        .sort({ lastUpdated: -1 })
        .lean(),
      Customer.find({ createdAt: { $gte: startDate } })
        .select("name email phone city totalOrders totalSpent ltvScore createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Event.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            event: { $in: ["product_view", "add_to_cart", "checkout_start", "purchase"] },
          },
        },
        { $group: { _id: "$event", count: { $sum: 1 } } },
      ]),
      ReturnRequest.find({ createdAt: { $gte: startDate } })
        .select("orderId customerName customerPhone type status reason refundAmount createdAt items")
        .sort({ createdAt: -1 })
        .lean(),
      getInventoryAlerts(),
      Product.find({}).select("name collectionId").lean(),
      Collection.find({}).select("name").lean(),
    ]);

    const productName = new Map<string, string>();
    const productCollection = new Map<string, string>();
    for (const p of products) {
      const id = String(p._id);
      productName.set(id, p.name);
      if (p.collectionId) productCollection.set(id, String(p.collectionId));
    }
    const collectionName = new Map<string, string>();
    for (const c of collections) {
      collectionName.set(String(c._id), c.name);
    }

    const counted = orders.filter((o) => o.status !== "Cancelled");
    const cancelled = orders.filter((o) => o.status === "Cancelled");
    const revenue = money(counted.reduce((s, o) => s + (o.total || 0), 0));
    const cancelledAmount = money(cancelled.reduce((s, o) => s + (o.total || 0), 0));
    const aov = counted.length ? money(revenue / counted.length) : 0;
    const waiting = orders.filter((o) => o.status === "Confirmation Pending").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const unpaidCartValue = money(
      abandonedCarts.reduce((sum, cart) => {
        return (
          sum +
          (cart.items || []).reduce(
            (line, item) => line + (Number(item.price) || 0) * (Number(item.quantity) || 0),
            0
          )
        );
      }, 0)
    );

    const daily = new Map<
      string,
      { orders: number; revenue: number; cancelled: number; cancelledAmount: number }
    >();
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      daily.set(ymd(d), { orders: 0, revenue: 0, cancelled: 0, cancelledAmount: 0 });
    }

    const byStatus = new Map<string, { count: number; amount: number }>();
    const byPayMethod = new Map<string, { count: number; amount: number }>();
    const byPayStatus = new Map<string, { count: number; amount: number }>();
    const byCity = new Map<string, { count: number; amount: number }>();
    const byCoupon = new Map<string, { count: number; amount: number }>();
    const byProduct = new Map<
      string,
      { name: string; qty: number; amount: number; orders: Set<string> }
    >();
    const byCollection = new Map<string, { name: string; qty: number; amount: number }>();
    const byCustomer = new Map<
      string,
      { name: string; phone: string; email: string; city: string; orders: number; amount: number }
    >();

    const bump = (
      map: Map<string, { count: number; amount: number }>,
      key: string,
      amount: number
    ) => {
      const cur = map.get(key) || { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += amount;
      map.set(key, cur);
    };

    const orderRows: Cell[][] = [];
    const itemRows: Cell[][] = [];

    for (const o of orders) {
      const day = ymd(new Date(o.createdAt));
      const bucket = daily.get(day);
      const total = money(o.total || 0);
      const isCancelled = o.status === "Cancelled";
      if (bucket) {
        if (isCancelled) {
          bucket.cancelled += 1;
          bucket.cancelledAmount += total;
        } else {
          bucket.orders += 1;
          bucket.revenue += total;
        }
      }

      bump(byStatus, o.status || "Unknown", total);
      if (!isCancelled) {
        bump(byPayMethod, o.paymentMethod || "unknown", total);
        bump(byPayStatus, o.paymentStatus || "unknown", total);
        bump(byCity, o.customer?.city || "Unknown", total);
        if (o.couponCode) bump(byCoupon, String(o.couponCode).toUpperCase(), total);
      }

      const phone = o.customer?.phone || "";
      const custKey = phone || o.customer?.email || o.orderId;
      const cust = byCustomer.get(custKey) || {
        name: o.customer?.name || "",
        phone,
        email: o.customer?.email || "",
        city: o.customer?.city || "",
        orders: 0,
        amount: 0,
      };
      cust.orders += 1;
      if (!isCancelled) cust.amount += total;
      byCustomer.set(custKey, cust);

      orderRows.push([
        o.orderId,
        new Date(o.createdAt),
        o.customer?.name || "",
        o.customer?.phone || "",
        o.customer?.email || "",
        o.customer?.city || "",
        o.customer?.state || "",
        o.customer?.pinCode || "",
        o.status,
        PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod,
        PAYMENT_STATUS_LABEL[o.paymentStatus || ""] || o.paymentStatus || "",
        money(o.subtotal || 0),
        money(o.discount || 0),
        money(o.shipping || 0),
        money(o.codCharge || 0),
        money(o.prepaidDiscount || 0),
        total,
        money(o.refundedAmount || 0),
        o.couponCode || "",
        o.trackingInfo?.courier || "",
        o.trackingInfo?.awb || "",
        o.trackingInfo?.trackingUrl || "",
        (o.items || []).reduce((n, i) => n + (Number(i.quantity) || 0), 0),
      ]);

      for (const item of o.items || []) {
        const qty = Number(item.quantity) || 0;
        const price = unitPrice(item);
        const line = money(qty * price);
        const pid = String(item.productId || "");
        const colId = productCollection.get(pid);
        const colLabel = (colId && collectionName.get(colId)) || "Unassigned";

        if (!isCancelled) {
          const pKey = pid || item.name;
          const p = byProduct.get(pKey) || {
            name: item.name || productName.get(pid) || "Unknown",
            qty: 0,
            amount: 0,
            orders: new Set<string>(),
          };
          p.qty += qty;
          p.amount += line;
          p.orders.add(o.orderId);
          byProduct.set(pKey, p);

          const c = byCollection.get(colLabel) || { name: colLabel, qty: 0, amount: 0 };
          c.qty += qty;
          c.amount += line;
          byCollection.set(colLabel, c);
        }

        itemRows.push([
          o.orderId,
          new Date(o.createdAt),
          o.status,
          item.name || "",
          item.size || "",
          item.color || "",
          qty,
          money(price),
          line,
          colLabel,
        ]);
      }
    }

    const funnelMap = new Map(funnelEvents.map((e) => [e._id as string, e.count as number]));
    const views = funnelMap.get("product_view") || 0;
    const addToCart = funnelMap.get("add_to_cart") || 0;
    const checkout = funnelMap.get("checkout_start") || 0;
    const purchases = funnelMap.get("purchase") || 0;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Admin Home";
    wb.created = generatedAt;
    wb.title = `Complete analysis — last ${days} days`;

    const how = wb.addWorksheet("How to use");
    how.getColumn(1).width = 28;
    how.getColumn(2).width = 88;
    how.addRow(["Complete analysis report", ""]);
    how.getRow(1).font = { bold: true, size: 16 };
    how.addRow([]);
    const intro: [string, string][] = [
      ["Date range", `Last ${days} days (same as Home). From ${ymd(startDate)} to ${ymd(generatedAt)}.`],
      ["Revenue", "Totals exclude cancelled orders. Cancelled amounts are listed separately."],
      ["Summary", "The one-page snapshot: money in, orders, stock, unpaid carts."],
      ["Daily", "Each day: orders, revenue, cancelled count."],
      ["Status", "How many orders sit in each status (waiting, packed, delivered, …)."],
      ["Payments", "COD vs prepaid vs partial, and paid vs pending."],
      ["Products sold", "What sold (quantity and rupees). Cancelled orders are left out."],
      ["Collections", "Sales grouped by collection."],
      ["Cities", "Where parcels are going."],
      ["Customers", "People who ordered in this range, plus new accounts."],
      ["Discount codes", "Which coupon codes were used."],
      ["Funnel", "Shop views → cart → checkout → purchase."],
      ["Stock", "Sizes that are low or sold out right now (not limited to this date range)."],
      ["Unpaid carts", "Carts left without paying."],
      ["Returns", "Return / exchange requests opened in this range."],
      ["Orders", "One row per order — open in Excel and filter."],
      ["Order items", "One row per product line on each order."],
    ];
    for (const [k, v] of intro) {
      const row = how.addRow([k, v]);
      row.getCell(2).alignment = { wrapText: true };
    }

    const summary = wb.addWorksheet("Summary");
    summary.getColumn(1).width = 36;
    summary.getColumn(2).width = 28;
    styleHeader(summary.addRow(["Metric", "Value"]));
    const summaryRows: [string, Cell][] = [
      ["Generated at", generatedAt.toISOString()],
      ["Days included", days],
      ["From", ymd(startDate)],
      ["To", ymd(generatedAt)],
      ["Revenue (excludes cancelled)", revenue],
      ["Orders (excludes cancelled)", counted.length],
      ["Average order value", aov],
      ["Cancelled orders", cancelled.length],
      ["Cancelled amount", cancelledAmount],
      ["All orders in range", orders.length],
      ["Orders waiting to confirm", waiting],
      ["Delivered", delivered],
      ["New customer accounts", newCustomers.length],
      ["Unique buyers in range", byCustomer.size],
      ["Carts left unpaid", abandonedCarts.length],
      ["Value sitting in unpaid carts", unpaidCartValue],
      ["Return / exchange requests", returns.length],
      ["Low stock sizes (now)", stock.lowCount],
      ["Sold-out sizes (now)", stock.outCount],
      ["Shop views", views],
      ["Add to cart", addToCart],
      ["Checkout starts", checkout],
      ["Purchases (tracked)", purchases],
    ];
    const moneyLabels = new Set([
      "Revenue (excludes cancelled)",
      "Average order value",
      "Cancelled amount",
      "Value sitting in unpaid carts",
    ]);
    for (const [label, value] of summaryRows) {
      const row = summary.addRow([label, value]);
      if (moneyLabels.has(label) && typeof value === "number") {
        row.getCell(2).numFmt = '"₹"#,##0.00';
      }
    }

    addTable(
      wb,
      "Daily",
      ["Date", "Orders", "Revenue", "Cancelled orders", "Cancelled amount"],
      [...daily.entries()].map(([date, v]) => [
        date,
        v.orders,
        money(v.revenue),
        v.cancelled,
        money(v.cancelledAmount),
      ]),
      [3, 5]
    );

    addTable(
      wb,
      "Status",
      ["Status", "Orders", "Amount"],
      [...byStatus.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .map(([status, v]) => [status, v.count, money(v.amount)]),
      [3]
    );

    addTable(
      wb,
      "Payments",
      ["Type", "Detail", "Orders", "Amount (excludes cancelled)"],
      [
        ...[...byPayMethod.entries()].map(([k, v]) => [
          "Pay method",
          PAYMENT_LABEL[k] || k,
          v.count,
          money(v.amount),
        ]),
        ...[...byPayStatus.entries()].map(([k, v]) => [
          "Pay status",
          PAYMENT_STATUS_LABEL[k] || k,
          v.count,
          money(v.amount),
        ]),
      ],
      [4]
    );

    addTable(
      wb,
      "Products sold",
      ["Product", "Units sold", "Orders", "Revenue"],
      [...byProduct.values()]
        .sort((a, b) => b.amount - a.amount)
        .map((p) => [p.name, p.qty, p.orders.size, money(p.amount)]),
      [4]
    );

    addTable(
      wb,
      "Collections",
      ["Collection", "Units sold", "Revenue"],
      [...byCollection.values()]
        .sort((a, b) => b.amount - a.amount)
        .map((c) => [c.name, c.qty, money(c.amount)]),
      [3]
    );

    addTable(
      wb,
      "Cities",
      ["City", "Orders", "Revenue (excludes cancelled)"],
      [...byCity.entries()]
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([city, v]) => [city, v.count, money(v.amount)]),
      [3]
    );

    addTable(
      wb,
      "Customers",
      ["Name", "Phone", "Email", "City", "Orders in range", "Spent in range"],
      [...byCustomer.values()]
        .sort((a, b) => b.amount - a.amount)
        .map((c) => [c.name, c.phone, c.email, c.city, c.orders, money(c.amount)]),
      [6]
    );

    addTable(
      wb,
      "New accounts",
      ["Joined", "Name", "Phone", "Email", "City", "Lifetime orders", "Lifetime spent", "LTV"],
      newCustomers.map((c) => [
        new Date(c.createdAt),
        c.name || "",
        c.phone || "",
        c.email || "",
        c.city || "",
        c.totalOrders || 0,
        money(c.totalSpent || 0),
        c.ltvScore || "",
      ]),
      [7]
    );

    addTable(
      wb,
      "Discount codes",
      ["Code", "Times used", "Revenue"],
      [...byCoupon.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .map(([code, v]) => [code, v.count, money(v.amount)]),
      [3]
    );

    const pct = (num: number, den: number) => (den > 0 ? money((num / den) * 100) : 0);
    addTable(
      wb,
      "Funnel",
      ["Step", "Count", "% of views"],
      [
        ["Shop views", views, 100],
        ["Add to cart", addToCart, pct(addToCart, views)],
        ["Checkout", checkout, pct(checkout, views)],
        ["Purchase", purchases, pct(purchases, views)],
      ]
    );

    addTable(
      wb,
      "Stock",
      ["Product", "Size", "SKU", "Stock", "Alert at", "Status"],
      stock.alerts.map((a) => [
        a.name,
        a.size,
        a.sku || "",
        a.stock,
        a.threshold,
        a.status === "out_of_stock" ? "Sold out" : "Low",
      ])
    );

    addTable(
      wb,
      "Unpaid carts",
      ["Last updated", "Status", "Phone", "Email", "Items", "Qty", "Est. value", "Products"],
      abandonedCarts.map((cart) => {
        const items = cart.items || [];
        const qty = items.reduce((n, i) => n + (Number(i.quantity) || 0), 0);
        const value = money(
          items.reduce((n, i) => n + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
        );
        return [
          cart.lastUpdated ? new Date(cart.lastUpdated) : null,
          cart.status === "emailed" ? "Reminded" : "Left unpaid",
          cart.phone || "",
          cart.email || "",
          items.length,
          qty,
          value,
          items.map((i) => `${i.name || i.productId} ×${i.quantity}`).join("; "),
        ];
      }),
      [7]
    );

    addTable(
      wb,
      "Returns",
      ["Opened", "Order", "Customer", "Phone", "Type", "Status", "Reason", "Refund", "Items"],
      returns.map((r) => [
        new Date(r.createdAt),
        r.orderId,
        r.customerName || "",
        r.customerPhone || "",
        r.type || "return",
        r.status,
        r.reason || "",
        money(r.refundAmount || 0),
        (r.items || []).map((i) => `${i.name} ×${i.quantity}`).join("; "),
      ]),
      [8]
    );

    addTable(
      wb,
      "Orders",
      [
        "Order",
        "Placed",
        "Customer",
        "Phone",
        "Email",
        "City",
        "State",
        "PIN",
        "Status",
        "Pay method",
        "Pay status",
        "Subtotal",
        "Discount",
        "Shipping",
        "COD charge",
        "Prepaid discount",
        "Total",
        "Refunded",
        "Coupon",
        "Courier",
        "Tracking number",
        "Tracking URL",
        "Item qty",
      ],
      orderRows,
      [12, 13, 14, 15, 16, 17, 18]
    );

    addTable(
      wb,
      "Order items",
      [
        "Order",
        "Placed",
        "Status",
        "Product",
        "Size",
        "Color",
        "Qty",
        "Unit price",
        "Line total",
        "Collection",
      ],
      itemRows,
      [8, 9]
    );

    const buffer = await wb.xlsx.writeBuffer();
    const filename = `complete-analysis-last-${days}-days.xlsx`;
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[analytics/export-complete]", error);
    return handleApiError(error);
  }
}
