import { connectDB } from "@/lib/mongodb";
import {
  Order,
  Product,
  Cart,
  Customer,
  Review,
  AutomationLog,
  Event,
  Collection,
} from "@/models";
import {
  sendEmail,
  emailLayout,
  emailEyebrow,
  emailLead,
  emailNote,
  emailButton,
  escHtml,
} from "@/lib/email";
import { getPublicSiteUrl } from "@/lib/utils";
import { getStoreSettings } from "@/lib/store-settings";

function toCSV(data: Record<string, unknown>[], headers: string[]) {
  if (data.length === 0) return headers.join(",") + "\n";
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function rupees(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function pct(n: number, d: number) {
  if (!d) return "0.0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

function sectionTitle(text: string) {
  return `<h2 style="margin:28px 0 12px;font-family:'Times New Roman',Times,Georgia,serif;font-size:16px;letter-spacing:1.5px;text-transform:uppercase;color:#1a1a1a;border-bottom:1px solid #e8e4df;padding-bottom:8px;">${escHtml(text)}</h2>`;
}

function kvTable(rows: { label: string; value: string }[]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;font-family:Georgia,Helvetica,Arial,sans-serif;font-size:14px;">${rows
    .map(
      (r) => `<tr>
      <td style="padding:7px 0;border-bottom:1px solid #f0ebe3;color:#6b6560;">${escHtml(r.label)}</td>
      <td align="right" style="padding:7px 0;border-bottom:1px solid #f0ebe3;font-weight:600;color:#1a1a1a;">${escHtml(r.value)}</td>
    </tr>`
    )
    .join("")}</table>`;
}

function dataTable(headers: string[], rows: string[][]) {
  const head = headers
    .map(
      (h, i) =>
        `<th align="${i === 0 ? "left" : "right"}" style="padding:8px 4px;border-bottom:2px solid #e8e4df;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b6560;font-weight:600;">${escHtml(h)}</th>`
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, i) =>
              `<td align="${i === 0 ? "left" : "right"}" style="padding:8px 4px;border-bottom:1px solid #f0ebe3;font-size:13px;color:#1a1a1a;">${cell}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;font-family:Georgia,Helvetica,Arial,sans-serif;">${head ? `<tr>${head}</tr>` : ""}${body}</table>`;
}

function isCountedOrder(status: string) {
  return status !== "Cancelled" && status !== "Returned";
}

export type ReportSnapshot = {
  monthLabel: string;
  rangeLabel: string;
  revenue: number;
  orders: number;
  aov: number;
  prepaid: number;
  cod: number;
  partial: number;
  cancelled: number;
  cancelledPct: string;
  returned: number;
  vsLastMonth: string;
  topProducts: Array<{
    name: string;
    sold: number;
    revenue: number;
    conv: string;
    stock: number;
  }>;
  reviews: {
    newCount: number;
    avg: string;
    fiveStar: number;
    fivePct: string;
    lowStar: number;
    lowPct: string;
    mostReviewed: string;
  };
  topCities: Array<{ city: string; orders: number; revenue: number }>;
  funnel: {
    abandoned: number;
    abandonedValue: number;
    recoveryRate: string;
    mostAbandoned: string;
  };
  customers: {
    newCount: number;
    repeatBuyers: number;
    highLtv: number;
    repeatRevenuePct: string;
    codBlocked: number;
    topSpender: string;
  };
  automations: Array<{ flow: string; sent: number; failed: number }>;
  inventory: { out: number; low: number; dead: number };
  insights: string[];
  csvCount: number;
};

export async function buildMonthlyReportData(): Promise<{
  snapshot: ReportSnapshot;
  attachments: { filename: string; content: string }[];
}> {
  await connectDB();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const prevStart = new Date(startDate);
  prevStart.setMonth(prevStart.getMonth() - 1);

  const [
    orders,
    prevOrders,
    products,
    carts,
    customersPeriod,
    reviews,
    automationLogs,
    viewEvents,
    allCustomers,
  ] = await Promise.all([
    Order.find({ createdAt: { $gte: startDate, $lt: endDate } }).lean(),
    Order.find({ createdAt: { $gte: prevStart, $lt: startDate } }).lean(),
    Product.find({}).lean(),
    Cart.find({
      status: { $in: ["abandoned", "emailed", "active"] },
      lastUpdated: { $gte: startDate, $lt: endDate },
    }).lean(),
    Customer.find({ createdAt: { $gte: startDate, $lt: endDate } }).lean(),
    Review.find({ createdAt: { $gte: startDate, $lt: endDate } }).lean(),
    AutomationLog.find({ createdAt: { $gte: startDate, $lt: endDate } }).lean(),
    Event.find({
      event: "product_view",
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .select("productId")
      .lean(),
    Customer.find({}).select("totalOrders totalSpent ltvScore name email codBlocked").lean(),
  ]);

  let revenue = 0;
  let orderCount = 0;
  let prepaid = 0;
  let cod = 0;
  let partial = 0;
  let cancelled = 0;
  let returned = 0;

  const productSales = new Map<
    string,
    { name: string; sold: number; revenue: number; productId: string }
  >();
  const cityMap = new Map<string, { orders: number; revenue: number }>();
  const sizeMap = new Map<string, number>();
  const dayMap = new Map<string, number>();
  const collectionSales = new Map<string, { orders: number; revenue: number }>();

  for (const o of orders) {
    const status = String(o.status || "");
    if (status === "Cancelled") cancelled++;
    if (status === "Returned") returned++;
    if (!isCountedOrder(status)) continue;

    const total = Number(o.total) || 0;
    revenue += total;
    orderCount++;
    if (o.paymentMethod === "cod") cod++;
    else if (o.paymentMethod === "partial") partial++;
    else prepaid++;

    const city = String(o.customer?.city || "Offline").trim() || "Offline";
    const cityRow = cityMap.get(city) || { orders: 0, revenue: 0 };
    cityRow.orders++;
    cityRow.revenue += total;
    cityMap.set(city, cityRow);

    const day = new Date(o.createdAt).toLocaleDateString("en-IN", {
      weekday: "long",
    });
    dayMap.set(day, (dayMap.get(day) || 0) + 1);

    const seenCollections = new Set<string>();
    for (const item of o.items || []) {
      const pid = String(item.productId || "");
      const unit =
        Number(item.salePrice) > 0 ? Number(item.salePrice) : Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      const line = unit * qty;
      const prev = productSales.get(pid) || {
        name: String(item.name || "Product"),
        sold: 0,
        revenue: 0,
        productId: pid,
      };
      prev.sold += qty;
      prev.revenue += line;
      productSales.set(pid, prev);

      const size = String(item.size || "").trim().toUpperCase();
      if (size) sizeMap.set(size, (sizeMap.get(size) || 0) + qty);

      const itemCollectionId = (item as { collectionId?: string }).collectionId;
      if (itemCollectionId) {
        seenCollections.add(String(itemCollectionId));
      }
    }
    for (const cid of seenCollections) {
      const row = collectionSales.get(cid) || { orders: 0, revenue: 0 };
      row.orders++;
      row.revenue += total;
      collectionSales.set(cid, row);
    }
  }

  let prevRevenue = 0;
  for (const o of prevOrders) {
    if (isCountedOrder(String(o.status || ""))) {
      prevRevenue += Number(o.total) || 0;
    }
  }
  const vsLastMonth =
    prevRevenue > 0
      ? `${(((revenue - prevRevenue) / prevRevenue) * 100).toFixed(0)}%`
      : revenue > 0
        ? "+100%"
        : "0%";

  const viewsByProduct = new Map<string, number>();
  for (const ev of viewEvents) {
    const pid = String(ev.productId || "");
    if (!pid) continue;
    viewsByProduct.set(pid, (viewsByProduct.get(pid) || 0) + 1);
  }

  const productById = new Map(products.map((p) => [String(p._id), p]));
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => {
      const doc = productById.get(p.productId);
      const stock = Array.isArray(doc?.inventory)
        ? doc!.inventory!.reduce((s, i) => s + (Number(i.stock) || 0), 0)
        : 0;
      const views = viewsByProduct.get(p.productId) || 0;
      const conv = views > 0 ? pct(p.sold, views) : p.sold > 0 ? "100.00%" : "0.00%";
      return {
        name: p.name,
        sold: p.sold,
        revenue: p.revenue,
        conv,
        stock,
      };
    });

  const productPerfRows = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((p) => {
      const doc = productById.get(p.productId);
      const stock = Array.isArray(doc?.inventory)
        ? doc!.inventory!.reduce((s, i) => s + (Number(i.stock) || 0), 0)
        : 0;
      const views = viewsByProduct.get(p.productId) || 0;
      return {
        Product: p.name,
        ProductId: p.productId,
        Sold: p.sold,
        Revenue: Math.round(p.revenue),
        Views: views,
        ConvPct: views > 0 ? ((p.sold / views) * 100).toFixed(2) : "",
        Stock: stock,
      };
    });

  const cityRows = Array.from(cityMap.entries())
    .map(([city, v]) => ({
      City: city,
      Orders: v.orders,
      Revenue: Math.round(v.revenue),
    }))
    .sort((a, b) => b.Revenue - a.Revenue);

  const topCities = cityRows.slice(0, 5).map((c) => ({
    city: c.City,
    orders: c.Orders,
    revenue: c.Revenue,
  }));

  // Cart funnel
  let abandoned = 0;
  let abandonedValue = 0;
  const abandonProduct = new Map<string, number>();
  for (const c of carts) {
    if (c.status === "purchased") continue;
    const items = Array.isArray(c.items) ? c.items : [];
    if (items.length === 0) continue;
    abandoned++;
    for (const it of items) {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      abandonedValue += qty * price;
      const name = String(it.name || it.productId || "Item");
      abandonProduct.set(name, (abandonProduct.get(name) || 0) + qty);
    }
  }
  const recovered = orders.filter(
    (o) => isCountedOrder(String(o.status || "")) && o.paymentStatus !== "failed"
  ).length;
  const recoverDenom = abandoned + recovered;
  const recoveryRate = pct(recovered, recoverDenom || 1);
  const mostAbandonedEntry = Array.from(abandonProduct.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const mostAbandoned = mostAbandonedEntry
    ? `${mostAbandonedEntry[0]} (${mostAbandonedEntry[1]}x)`
    : "—";

  // Reviews
  const newReviews = reviews.length;
  const avgRating =
    newReviews > 0
      ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / newReviews).toFixed(1)
      : "0.0";
  const fiveStar = reviews.filter((r) => Number(r.rating) >= 5).length;
  const lowStar = reviews.filter((r) => Number(r.rating) <= 2).length;
  const reviewCountByProduct = new Map<string, { name: string; n: number }>();
  for (const r of reviews) {
    const pid = String(r.productId || "");
    const prev = reviewCountByProduct.get(pid) || {
      name: productById.get(pid)?.name || pid,
      n: 0,
    };
    prev.n++;
    reviewCountByProduct.set(pid, prev);
  }
  const mostReviewedEntry = Array.from(reviewCountByProduct.values()).sort(
    (a, b) => b.n - a.n
  )[0];
  const mostReviewed = mostReviewedEntry
    ? `${mostReviewedEntry.name} (${mostReviewedEntry.n})`
    : "—";

  // Customers
  const newCount = customersPeriod.length;
  const repeatBuyers = allCustomers.filter((c) => Number(c.totalOrders) >= 2).length;
  const highLtv = allCustomers.filter((c) => c.ltvScore === "HIGH").length;
  const codBlocked = allCustomers.filter((c) => c.codBlocked).length;
  const topSpenderDoc = [...allCustomers].sort(
    (a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0)
  )[0];
  const topSpender = topSpenderDoc
    ? `${topSpenderDoc.name || topSpenderDoc.email || "Customer"} — ${rupees(Number(topSpenderDoc.totalSpent || 0))}`
    : "—";

  // Approximate repeat revenue: orders from customers with 2+ lifetime orders
  const repeatUids = new Set(
    allCustomers.filter((c) => Number(c.totalOrders) >= 2).map((c) => String(c._id))
  );
  let repeatRev = 0;
  for (const o of orders) {
    if (!isCountedOrder(String(o.status || ""))) continue;
    if (o.customerId && repeatUids.has(String(o.customerId))) {
      repeatRev += Number(o.total) || 0;
    }
  }
  const repeatRevenuePct = pct(repeatRev, revenue || 1);

  // Automations
  const autoMap = new Map<string, { sent: number; failed: number }>();
  for (const log of automationLogs) {
    const flow = String(log.flow || "unknown");
    const row = autoMap.get(flow) || { sent: 0, failed: 0 };
    if (log.status === "failed") row.failed++;
    else row.sent++;
    autoMap.set(flow, row);
  }
  const automations = Array.from(autoMap.entries())
    .map(([flow, v]) => ({
      flow: flow.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      sent: v.sent,
      failed: v.failed,
    }))
    .sort((a, b) => b.sent - a.sent);

  // Inventory
  let out = 0;
  let low = 0;
  let dead = 0;
  const inventoryHealth: Record<string, unknown>[] = [];
  for (const p of products) {
    if (p.isActive === false) continue;
    const inv = Array.isArray(p.inventory) ? p.inventory : [];
    const threshold = Number(p.lowStockThreshold) || 3;
    const totalStock = inv.reduce((s, i) => s + (Number(i.stock) || 0), 0);
    const sold = productSales.get(String(p._id))?.sold || 0;
    if (totalStock <= 0) {
      out++;
      inventoryHealth.push({
        ProductName: p.name,
        Status: "Out of Stock",
        Stock: 0,
        SoldPeriod: sold,
      });
    } else if (inv.some((i) => Number(i.stock) <= threshold)) {
      low++;
      for (const i of inv) {
        if (Number(i.stock) <= threshold) {
          inventoryHealth.push({
            ProductName: p.name,
            Size: i.size || "Default",
            Status: Number(i.stock) === 0 ? "Out of Stock" : "Low Stock",
            Stock: i.stock,
            SoldPeriod: sold,
          });
        }
      }
    }
    if (sold === 0 && totalStock > 0) {
      dead++;
      inventoryHealth.push({
        ProductName: p.name,
        Status: "Dead Stock",
        Stock: totalStock,
        SoldPeriod: 0,
      });
    }
  }

  // Collection performance CSV
  const collections = await Collection.find({}).select("name").lean();
  const collName = new Map(collections.map((c) => [String(c._id), c.name]));
  const collectionRows = Array.from(collectionSales.entries())
    .map(([id, v]) => ({
      Collection: collName.get(id) || id,
      Orders: v.orders,
      Revenue: Math.round(v.revenue),
    }))
    .sort((a, b) => b.Revenue - a.Revenue);

  // Audience / size / day insights
  const sizeTotal = Array.from(sizeMap.values()).reduce((a, b) => a + b, 0) || 1;
  const sizePop = Array.from(sizeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s, n]) => `${s} (${pct(n, sizeTotal)})`)
    .join(" > ");
  const peakDays = Array.from(dayMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d, n]) => `${d} (${n})`)
    .join(" > ");

  const insights = [
    sizePop ? `Size Popularity  ${sizePop}` : "Size Popularity  —",
    peakDays ? `Peak Sales Days  ${peakDays}` : "Peak Sales Days  —",
    topCities[0]
      ? `Top market  ${topCities[0].city} (${topCities[0].orders} orders)`
      : "Top market  —",
    topProducts[0]
      ? `Hero product  ${topProducts[0].name} — ${rupees(topProducts[0].revenue)}`
      : "Hero product  —",
  ];

  const orderCsvRows = orders.map((o) => ({
    OrderId: o.orderId,
    Date: new Date(o.createdAt).toISOString().split("T")[0],
    Customer: o.customer?.name || "",
    Email: o.customer?.email || "",
    Phone: o.customer?.phone || "",
    City: o.customer?.city || "",
    Total: o.total,
    Status: o.status,
    PaymentMethod: o.paymentMethod,
    PaymentStatus: o.paymentStatus,
  }));

  const reviewCsv = reviews.map((r) => ({
    ProductId: r.productId,
    Rating: r.rating,
    Status: r.status,
    UserName: r.userName,
    Date: new Date(r.createdAt).toISOString().split("T")[0],
  }));

  const abandonCsv = carts
    .filter((c) => c.status !== "purchased" && (c.items?.length || 0) > 0)
    .map((c) => ({
      CartId: String(c._id),
      Email: c.email || "",
      Phone: c.phone || "",
      Status: c.status,
      ItemCount: c.items?.length || 0,
      Value: (c.items || []).reduce(
        (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0),
        0
      ),
      Updated: c.lastUpdated
        ? new Date(c.lastUpdated).toISOString()
        : "",
    }));

  const automationCsv = automations.map((a) => ({
    Flow: a.flow,
    Sent: a.sent,
    Failed: a.failed,
  }));

  const sizeCsv = Array.from(sizeMap.entries()).map(([Size, Qty]) => ({
    Size,
    Qty,
  }));

  const attachments = [
    {
      filename: "product_performance.csv",
      content: Buffer.from(
        toCSV(productPerfRows, [
          "Product",
          "ProductId",
          "Sold",
          "Revenue",
          "Views",
          "ConvPct",
          "Stock",
        ])
      ).toString("base64"),
    },
    {
      filename: "city_geo_targeting.csv",
      content: Buffer.from(
        toCSV(cityRows, ["City", "Orders", "Revenue"])
      ).toString("base64"),
    },
    {
      filename: "inventory_health.csv",
      content: Buffer.from(
        toCSV(inventoryHealth, [
          "ProductName",
          "Size",
          "Status",
          "Stock",
          "SoldPeriod",
        ])
      ).toString("base64"),
    },
    {
      filename: "collection_performance.csv",
      content: Buffer.from(
        toCSV(collectionRows, ["Collection", "Orders", "Revenue"])
      ).toString("base64"),
    },
    {
      filename: "monthly_orders.csv",
      content: Buffer.from(
        toCSV(orderCsvRows, [
          "OrderId",
          "Date",
          "Customer",
          "Email",
          "Phone",
          "City",
          "Total",
          "Status",
          "PaymentMethod",
          "PaymentStatus",
        ])
      ).toString("base64"),
    },
    {
      filename: "abandoned_carts.csv",
      content: Buffer.from(
        toCSV(abandonCsv, [
          "CartId",
          "Email",
          "Phone",
          "Status",
          "ItemCount",
          "Value",
          "Updated",
        ])
      ).toString("base64"),
    },
    {
      filename: "reviews_period.csv",
      content: Buffer.from(
        toCSV(reviewCsv, ["ProductId", "Rating", "Status", "UserName", "Date"])
      ).toString("base64"),
    },
    {
      filename: "email_automations.csv",
      content: Buffer.from(
        toCSV(automationCsv, ["Flow", "Sent", "Failed"])
      ).toString("base64"),
    },
    {
      filename: "size_popularity.csv",
      content: Buffer.from(toCSV(sizeCsv, ["Size", "Qty"])).toString("base64"),
    },
  ];

  const aov = orderCount > 0 ? revenue / orderCount : 0;
  const monthLabel = endDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const rangeLabel = `${startDate.toLocaleDateString("en-IN")} – ${endDate.toLocaleDateString("en-IN")}`;

  const snapshot: ReportSnapshot = {
    monthLabel,
    rangeLabel,
    revenue,
    orders: orderCount,
    aov,
    prepaid,
    cod,
    partial,
    cancelled,
    cancelledPct: pct(cancelled, orders.length || 1),
    returned,
    vsLastMonth,
    topProducts,
    reviews: {
      newCount: newReviews,
      avg: avgRating,
      fiveStar,
      fivePct: pct(fiveStar, newReviews || 1),
      lowStar,
      lowPct: pct(lowStar, newReviews || 1),
      mostReviewed,
    },
    topCities,
    funnel: {
      abandoned,
      abandonedValue,
      recoveryRate,
      mostAbandoned,
    },
    customers: {
      newCount: newCount,
      repeatBuyers,
      highLtv,
      repeatRevenuePct,
      codBlocked,
      topSpender,
    },
    automations,
    inventory: { out, low, dead },
    insights,
    csvCount: attachments.length,
  };

  return { snapshot, attachments };
}

export function renderPerformanceReportHtml(
  snapshot: ReportSnapshot,
  opts?: { storeAddress?: string; supportEmail?: string }
) {
  const site = getPublicSiteUrl();
  const s = snapshot;

  const body =
    emailEyebrow("Performance report") +
    emailLead(
      `Detailed store intelligence for <strong>${escHtml(s.monthLabel)}</strong> (${escHtml(s.rangeLabel)}).`
    ) +
    sectionTitle("Revenue Snapshot") +
    kvTable([
      { label: "Revenue", value: rupees(s.revenue) },
      { label: "Orders", value: String(s.orders) },
      { label: "AOV", value: rupees(s.aov) },
      {
        label: "Prepaid / COD / Partial",
        value: `${s.prepaid} / ${s.cod} / ${s.partial}`,
      },
      { label: "Cancelled", value: `${s.cancelled} (${s.cancelledPct})` },
      { label: "Returned", value: String(s.returned) },
      { label: "vs Last Month", value: s.vsLastMonth },
    ]) +
    sectionTitle("Top 5 Products — Run Ads On These") +
    (s.topProducts.length
      ? dataTable(
          ["Product", "Sold", "Revenue", "Conv%", "Stock"],
          s.topProducts.map((p) => [
            escHtml(p.name),
            String(p.sold),
            rupees(p.revenue),
            escHtml(p.conv),
            String(p.stock),
          ])
        )
      : emailNote("No product sales in this period.")) +
    `<p style="margin:0 0 16px;font-size:12px;color:#6b6560;">Full data in product_performance.csv</p>` +
    sectionTitle("Review Highlights") +
    kvTable([
      { label: "New Reviews", value: String(s.reviews.newCount) },
      { label: "Avg Rating", value: `${s.reviews.avg} ★` },
      {
        label: "5★ Reviews",
        value: `${s.reviews.fiveStar} (${s.reviews.fivePct})`,
      },
      {
        label: "1-2★ Reviews",
        value: `${s.reviews.lowStar} (${s.reviews.lowPct})`,
      },
      { label: "Most Reviewed", value: s.reviews.mostReviewed },
    ]) +
    sectionTitle("Top Cities — Geo-Target These") +
    (s.topCities.length
      ? dataTable(
          ["City", "Orders", "Revenue"],
          s.topCities.map((c) => [
            escHtml(c.city),
            String(c.orders),
            rupees(c.revenue),
          ])
        )
      : emailNote("No city data yet.")) +
    `<p style="margin:0 0 16px;font-size:12px;color:#6b6560;">Full city data in city_geo_targeting.csv</p>` +
    sectionTitle("Cart & Funnel") +
    kvTable([
      { label: "Abandoned Carts", value: String(s.funnel.abandoned) },
      { label: "Abandoned Value", value: rupees(s.funnel.abandonedValue) },
      { label: "Recovery Rate", value: s.funnel.recoveryRate },
      { label: "Most Abandoned", value: s.funnel.mostAbandoned },
    ]) +
    sectionTitle("Customer Health") +
    kvTable([
      { label: "New Customers", value: String(s.customers.newCount) },
      {
        label: "Repeat Buyers (2+ orders)",
        value: String(s.customers.repeatBuyers),
      },
      { label: "HIGH LTV Customers", value: String(s.customers.highLtv) },
      { label: "Repeat Revenue %", value: s.customers.repeatRevenuePct },
      { label: "COD-Blocked", value: String(s.customers.codBlocked) },
      { label: "Top Spender", value: s.customers.topSpender },
    ]) +
    sectionTitle("Email Automation") +
    (s.automations.length
      ? dataTable(
          ["Flow", "Sent", "Failed"],
          s.automations.map((a) => [
            escHtml(a.flow),
            String(a.sent),
            String(a.failed),
          ])
        )
      : emailNote("No automation sends logged this period.")) +
    sectionTitle("Inventory Alerts") +
    kvTable([
      { label: "Out of Stock", value: `${s.inventory.out} products` },
      { label: "Low Stock", value: `${s.inventory.low} products` },
      { label: "Dead Stock (0 sales)", value: `${s.inventory.dead} products` },
    ]) +
    `<p style="margin:0 0 16px;font-size:12px;color:#6b6560;">Details in inventory_health.csv</p>` +
    sectionTitle("Quick Insights") +
    `<ul style="margin:0 0 20px;padding-left:18px;font-size:14px;line-height:1.7;color:#1a1a1a;">${s.insights
      .map((i) => `<li>${escHtml(i)}</li>`)
      .join("")}</ul>` +
    emailNote(
      `${s.csvCount} detailed CSV files attached for deep analysis. Open in Excel/Google Sheets to filter, sort, and build ad audiences.`
    ) +
    `<p style="margin:20px 0 0;">${emailButton("View admin dashboard", `${site}/admin`)}</p>` +
    (opts?.storeAddress || opts?.supportEmail
      ? `<p style="margin:24px 0 0;font-size:12px;color:#6b6560;line-height:1.6;">${
          opts.storeAddress ? `${escHtml(opts.storeAddress)}<br/>` : ""
        }${opts.supportEmail ? escHtml(opts.supportEmail) : ""}</p>`
      : "");

  return emailLayout(`Performance report for ${s.monthLabel}`, body, {
    kind: "staff",
    hideDefaultCtas: true,
    primaryCta: { label: "View admin dashboard", href: `${site}/admin` },
    secondaryCta: { label: "Open reports", href: `${site}/admin/reports` },
    preheader: `${rupees(s.revenue)} · ${s.orders} orders · ${s.monthLabel}`,
    footerNote: "Sent to your store support inbox.",
  });
}

export async function generateMonthlyReport(targetEmail: string) {
  const { snapshot, attachments } = await buildMonthlyReportData();
  const store = await getStoreSettings().catch(() => null);
  const html = renderPerformanceReportHtml(snapshot, {
    storeAddress: store?.address,
    supportEmail: store?.supportEmail || targetEmail,
  });

  const res = await sendEmail({
    to: targetEmail,
    subject: `Performance report — ${snapshot.monthLabel}`,
    html,
    type: "orders",
    attachments,
  });

  return { ...res, snapshot };
}
