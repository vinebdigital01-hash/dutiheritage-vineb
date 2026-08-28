import { connectDB } from "@/lib/mongodb";
import {
  Customer,
  Order,
  Event,
  Cart,
  CustomerGroup,
  type CustomerDocument,
} from "@/models";
import type { TrackEvent } from "@/models/Event";

export type CustomerDTO = {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  firebaseUid?: string | null;
  source?: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  tags: string[];
  groupIds: string[];
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  ltvScore: "LOW" | "MEDIUM" | "HIGH";
  firstVisit?: string;
  lastVisit?: string;
  lastPurchase?: string;
  createdAt?: string;
  address?: CustomerDocument["address"];
};

export function computeLtvScore(
  totalSpent: number,
  totalOrders: number
): "LOW" | "MEDIUM" | "HIGH" {
  if (totalSpent >= 10000 || totalOrders >= 5) return "HIGH";
  if (totalSpent >= 3000 || totalOrders >= 2) return "MEDIUM";
  return "LOW";
}

export function toCustomerDTO(doc: CustomerDocument | LeanCustomer): CustomerDTO {
  const totalSpent = Number(doc.totalSpent ?? 0);
  const totalOrders = Number(doc.totalOrders ?? 0);
  const avg =
    totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

  return {
    id: doc._id.toString(),
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    name: doc.name ?? null,
    firebaseUid: doc.firebaseUid ?? null,
    source: doc.source,
    city: doc.city ?? null,
    state: doc.state ?? null,
    pincode: doc.pincode ?? null,
    tags: doc.tags ?? [],
    groupIds: (doc.groupIds ?? []).map((g) => g.toString()),
    totalOrders,
    totalSpent,
    avgOrderValue: doc.avgOrderValue ?? avg,
    ltvScore: (doc.ltvScore as CustomerDTO["ltvScore"]) ?? computeLtvScore(totalSpent, totalOrders),
    firstVisit: doc.firstVisit ? new Date(doc.firstVisit).toISOString() : undefined,
    lastVisit: doc.lastVisit ? new Date(doc.lastVisit).toISOString() : undefined,
    lastPurchase: doc.lastPurchase
      ? new Date(doc.lastPurchase).toISOString()
      : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : undefined,
    address: doc.address,
  };
}

type LeanCustomer = {
  _id: { toString(): string };
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  firebaseUid?: string | null;
  source?: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  tags?: string[];
  groupIds?: { toString(): string }[];
  totalOrders?: number;
  totalSpent?: number;
  avgOrderValue?: number;
  ltvScore?: string;
  firstVisit?: Date | string;
  lastVisit?: Date | string;
  lastPurchase?: Date | string;
  createdAt?: Date | string;
  address?: CustomerDocument["address"];
};

/** Recompute order stats on a customer from orders collection. */
export async function refreshCustomerStats(customerId: string) {
  await connectDB();
  const orders = await Order.find({
    customerId,
    status: { $nin: ["Cancelled", "Returned"] },
  }).lean();

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const avgOrderValue =
    totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
  const lastPurchase = orders.length
    ? orders.reduce(
        (latest, o) => {
          const d = new Date(o.createdAt || 0);
          return d > latest ? d : latest;
        },
        new Date(0)
      )
    : undefined;

  await Customer.findByIdAndUpdate(customerId, {
    totalOrders,
    totalSpent,
    avgOrderValue,
    ltvScore: computeLtvScore(totalSpent, totalOrders),
    ...(lastPurchase && lastPurchase.getTime() > 0
      ? { lastPurchase }
      : {}),
  });
}

export async function getCustomerProfile(customerId: string) {
  await connectDB();
  const customer = await Customer.findById(customerId).lean();
  if (!customer) return null;

  const [orders, events, carts] = await Promise.all([
    Order.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Event.find({
      $or: [
        { customerId: String(customer._id) },
        ...(customer.firebaseUid
          ? [{ firebaseUid: customer.firebaseUid }]
          : []),
        ...(customer.email ? [{ email: customer.email }] : []),
      ],
    } as Record<string, unknown>)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Cart.find({
      $or: [
        { customerId },
        { firebaseUid: customer.firebaseUid },
        ...(customer.email ? [{ email: customer.email }] : []),
      ],
      status: { $in: ["abandoned", "emailed", "active"] },
    })
      .sort({ lastUpdated: -1 })
      .limit(5)
      .lean(),
  ]);

  const productViews = await Event.aggregate([
    {
      $match: {
        event: "product_view",
        $or: [
          { customerId: customer._id },
          ...(customer.firebaseUid
            ? [{ firebaseUid: customer.firebaseUid }]
            : []),
        ],
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: "$productId",
        name: { $first: "$productName" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    customer: toCustomerDTO(customer as LeanCustomer),
    orders: orders.map((o) => ({
      orderId: o.orderId,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    })),
    recentEvents: events.map((e) => ({
      id: e._id.toString(),
      event: e.event,
      productId: e.productId,
      productName: e.productName,
      path: e.path,
      createdAt: e.createdAt,
    })),
    abandonedCarts: carts.map((c) => ({
      id: c._id.toString(),
      status: c.status,
      itemCount: c.items?.length ?? 0,
      lastUpdated: c.lastUpdated,
    })),
    topProductViews: productViews.map((p) => ({
      productId: p._id,
      name: p.name,
      count: p.count,
    })),
  };
}

type GroupFilter = {
  field: string;
  operator: string;
  value?: unknown;
};

/** Resolve smart group members from filters. */
export async function resolveGroupMembers(
  group: {
    type: string;
    memberIds?: { toString(): string }[];
    filters?: GroupFilter[];
  },
  limit = 500
) {
  await connectDB();

  if (group.type === "manual" && group.memberIds?.length) {
    return Customer.find({ _id: { $in: group.memberIds } } as Record<string, unknown>)
      .limit(limit)
      .lean();
  }

  const filters = group.filters || [];
  const query: Record<string, unknown> = {};

  for (const f of filters) {
    if (f.field === "minTotalSpent" && f.operator === "gte") {
      query.totalSpent = { $gte: Number(f.value) || 0 };
    }
    if (f.field === "city" && f.operator === "eq") {
      query.city = new RegExp(String(f.value), "i");
    }
    if (f.field === "neverPurchased" && f.value) {
      query.totalOrders = 0;
    }
    if (f.field === "dormantDays" && f.operator === "gte") {
      const days = Number(f.value) || 30;
      query.lastPurchase = {
        $lte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      };
    }
    if (f.field === "ltvScore" && f.operator === "eq") {
      query.ltvScore = String(f.value);
    }
  }

  let customers = await Customer.find(query).limit(limit).lean();

  // Event-based filter: viewed product N+ times
  const viewFilter = filters.find(
    (f) => f.field === "viewedProductMin" && f.operator === "gte"
  );
  if (viewFilter) {
    const min = Number(viewFilter.value) || 3;
    const productId = filters.find((f) => f.field === "productId")?.value;
    const match: Record<string, unknown> = {
      event: "product_view" as TrackEvent,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    };
    if (productId) match.productId = String(productId);

    const agg = await Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: { uid: "$firebaseUid", email: "$email", cid: "$customerId" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gte: min } } },
    ]);

    const uids = agg.map((a) => a._id.uid).filter(Boolean);
    const emails = agg.map((a) => a._id.email).filter(Boolean);
    const cids = agg
      .map((a) => a._id.cid)
      .filter(Boolean)
      .map(String);

    customers = await Customer.find({
      $or: [
        ...(uids.length ? [{ firebaseUid: { $in: uids } }] : []),
        ...(emails.length ? [{ email: { $in: emails } }] : []),
        ...(cids.length ? [{ _id: { $in: cids.map(String) } }] : []),
      ],
    } as Record<string, unknown>)
      .limit(limit)
      .lean();
  }

  // Cart abandoners in last N days
  const cartFilter = filters.find((f) => f.field === "cartAbandoner");
  if (cartFilter?.value) {
    const days = Number(cartFilter.value) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const carts = await Cart.find({
      status: { $in: ["abandoned", "emailed"] },
      lastUpdated: { $gte: since },
    }).lean();
    const emails = carts.map((c) => c.email).filter(Boolean);
    const uids = carts.map((c) => c.firebaseUid).filter(Boolean);
    customers = await Customer.find({
      $or: [
        ...(emails.length ? [{ email: { $in: emails } }] : []),
        ...(uids.length ? [{ firebaseUid: { $in: uids } }] : []),
      ],
    } as Record<string, unknown>)
      .limit(limit)
      .lean();
  }

  return customers;
}

export async function getAnalyticsSummary(days = 30) {
  await connectDB();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    customerCount,
    newCustomers,
    orderStats,
    eventCounts,
    topProducts,
    funnel,
    abandonedCarts,
    specificUserViews,
    recentJourneys,
  ] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ createdAt: { $gte: since } }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          status: { $nin: ["Cancelled", "Returned"] },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Event.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$event", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Event.aggregate([
      {
        $match: {
          event: "product_view",
          createdAt: { $gte: since },
          productId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$productId",
          name: { $first: "$productName" },
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
    Event.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$sessionId", events: { $addToSet: "$event" } } },
      {
        $project: {
          viewed: { $in: ["product_view", "$events"] },
          carted: { $in: ["add_to_cart", "$events"] },
          checkout: { $in: ["checkout_start", "$events"] },
          purchased: { $in: ["purchase", "$events"] },
        },
      },
      {
        $group: {
          _id: null,
          sessions: { $sum: 1 },
          withCart: { $sum: { $cond: ["$carted", 1, 0] } },
          withCheckout: { $sum: { $cond: ["$checkout", 1, 0] } },
          withPurchase: { $sum: { $cond: ["$purchased", 1, 0] } },
        },
      },
    ]),
    Cart.countDocuments({
      status: { $in: ["abandoned", "emailed"] },
      lastUpdated: { $gte: since },
    }),
    // User Product Views & Frequency
    Event.aggregate([
      {
        $match: {
          event: "product_view",
          createdAt: { $gte: since },
          productId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            customerId: "$customerId",
            email: "$email",
            sessionId: "$sessionId",
            productId: "$productId",
          },
          productName: { $first: "$productName" },
          count: { $sum: 1 },
          lastViewed: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "customers",
          let: { custId: { $toObjectId: "$_id.customerId" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$custId"] } } }],
          as: "customerDoc",
        },
      },
      {
        $project: {
          _id: 0,
          user: {
            $cond: [
              { $gt: [{ $size: "$customerDoc" }, 0] },
              { $arrayElemAt: ["$customerDoc.name", 0] },
              { $ifNull: ["$_id.email", "$_id.sessionId"] }
            ]
          },
          customerId: { $arrayElemAt: ["$customerDoc._id", 0] },
          productId: "$_id.productId",
          productName: 1,
          count: 1,
          lastViewed: 1,
        }
      },
      { $match: { count: { $gt: 1 } } }, // Only show multiple views for insight
      { $sort: { lastViewed: -1 } },
      { $limit: 10 },
    ]),
    // Recent User Journeys
    Event.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$sessionId",
          email: { $last: "$email" },
          customerId: { $last: "$customerId" },
          lastEventAt: { $last: "$createdAt" },
          events: {
            $push: {
              event: "$event",
              productName: "$productName",
              path: "$path"
            }
          }
        }
      },
      { $sort: { lastEventAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "customers",
          let: { custId: { $toObjectId: "$customerId" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$custId"] } } }],
          as: "customerDoc",
        },
      },
      {
        $project: {
          sessionId: "$_id",
          user: {
            $cond: [
              { $gt: [{ $size: "$customerDoc" }, 0] },
              { $arrayElemAt: ["$customerDoc.name", 0] },
              { $ifNull: ["$email", "$_id"] }
            ]
          },
          events: 1,
          lastEventAt: 1
        }
      }
    ])
  ]);

  const revenue = orderStats[0]?.revenue ?? 0;
  const orders = orderStats[0]?.orders ?? 0;

  return {
    periodDays: days,
    customers: { total: customerCount, new: newCustomers },
    revenue,
    orders,
    avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
    eventCounts: eventCounts.map((e) => ({
      event: e._id,
      count: e.count,
    })),
    topProducts: topProducts.map((p) => ({
      productId: p._id,
      name: p.name,
      views: p.views,
    })),
    funnel: funnel[0] || {
      sessions: 0,
      withCart: 0,
      withCheckout: 0,
      withPurchase: 0,
    },
    abandonedCarts,
    userProductViews: specificUserViews || [],
    recentJourneys: recentJourneys || [],
  };
}

export async function updateGroupMemberCount(groupId: string) {
  const group = await CustomerGroup.findById(groupId);
  if (!group) return;
  const members = await resolveGroupMembers(group.toObject(), 10000);
  group.memberCount = members.length;
  await group.save();
}
