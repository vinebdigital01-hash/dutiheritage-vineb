import { connectDB } from "@/lib/mongodb";
import { ReturnRequest, Order } from "@/models";
import { requireAuth, verifyIdToken, AuthError } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { logAdminAction } from "@/lib/admin-audit";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  jsonError,
  requireMongo,
  ApiError,
} from "@/lib/api";

function serializeReturn(doc: {
  _id: { toString(): string };
  orderId: string;
  type: string;
  status: string;
  source?: string | null;
  reason?: string | null;
  rejectReason?: string | null;
  items: Array<{
    productId: string;
    name: string;
    image?: string | null;
    size?: string | null;
    quantity: number;
  }>;
  refundAmount?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  decidedBy?: string | null;
  restockedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}) {
  return {
    id: doc._id.toString(),
    orderId: doc.orderId,
    type: doc.type,
    status: doc.status,
    source: doc.source || "customer",
    reason: doc.reason || "",
    rejectReason: doc.rejectReason || "",
    items: doc.items,
    refundAmount: Number(doc.refundAmount || 0),
    customerName: doc.customerName || "",
    customerPhone: doc.customerPhone || "",
    decidedBy: doc.decidedBy || "",
    restockedAt: doc.restockedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    const status = String(new URL(request.url).searchParams.get("status") || "").trim();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const docs = await ReturnRequest.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return jsonOk({
      returns: docs.map((d) => serializeReturn(d)),
      pending: docs.filter((d) => d.status === "requested").length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader) throw new AuthError("Authorization required", 401);

    const body = await request.json();
    const orderId = String(body.orderId || "").trim();
    if (!orderId) throw new ApiError("orderId is required");

    const order = await Order.findOne({ orderId });
    if (!order) return jsonError("Order not found", 404);

    const type = body.type === "exchange" ? "exchange" : "return";
    const reason = String(body.reason || "").trim();
    if (!reason) throw new ApiError("A reason is required");

    const allowed = ["Delivered", "Shipped", "In Transit"];
    if (!allowed.includes(order.status)) {
      throw new ApiError("Returns are only open after the order has shipped");
    }

    let source: "customer" | "staff" = "customer";
    let actorEmail = "";

    try {
      const staff = await requireAuth(request, { admin: true, roles: OPS_WRITE });
      source = "staff";
      actorEmail = staff.email || staff.uid;
    } catch {
      const user = await verifyIdToken(authHeader);
      if (order.firebaseUid && order.firebaseUid !== user.uid) {
        throw new AuthError("Not allowed to return this order", 403);
      }
      actorEmail = user.email || user.uid;
    }

    const existing = await ReturnRequest.findOne({
      orderId,
      status: { $in: ["requested", "approved"] },
    });
    if (existing) {
      throw new ApiError("An open return already exists for this order");
    }

    const rawItems = Array.isArray(body.items) ? body.items : order.items;
    const items = rawItems
      .map((i: { productId?: string; name?: string; image?: string; size?: string; quantity?: number }) => ({
        productId: String(i.productId || ""),
        name: String(i.name || ""),
        image: i.image ? String(i.image) : "",
        size: i.size ? String(i.size) : "",
        quantity: Math.max(1, Number(i.quantity) || 1),
      }))
      .filter((i: { productId: string; name: string }) => i.productId && i.name);

    if (items.length === 0) throw new ApiError("Select at least one item");

    const doc = await ReturnRequest.create({
      orderId: order.orderId,
      orderMongoId: order._id.toString(),
      firebaseUid: order.firebaseUid,
      customerName: order.customer?.name,
      customerPhone: order.customer?.phone,
      type,
      status: "requested",
      source,
      reason,
      items,
    });

    if (source === "staff") {
      await logAdminAction({
        request,
        actor: { uid: actorEmail, email: actorEmail, name: null, token: {} as never, role: null },
        action: "create",
        resource: "return",
        resourceId: order.orderId,
        message: reason,
      });
    }

    return jsonCreated({ return: serializeReturn(doc) });
  } catch (error) {
    return handleApiError(error);
  }
}
