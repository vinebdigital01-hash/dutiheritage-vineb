import { connectDB } from "@/lib/mongodb";
import { ReturnRequest, Order } from "@/models";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { logAdminAction } from "@/lib/admin-audit";
import { refundOrder } from "@/lib/order-refund";
import { appendTimeline } from "@/lib/order-workspace";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
  isValidObjectId,
} from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: OPS_WRITE });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid return id", 400);

    await connectDB();
    const doc = await ReturnRequest.findById(id);
    if (!doc) return jsonError("Return not found", 404);

    const body = await request.json();
    const action = String(body.action || "").trim();
    const actor = authUser.email || authUser.uid;

    if (action === "approve") {
      if (doc.status !== "requested") throw new ApiError("Only requested returns can be approved");
      doc.status = "approved";
      doc.decidedBy = actor;
    } else if (action === "reject") {
      if (doc.status !== "requested") throw new ApiError("Only requested returns can be rejected");
      const rejectReason = String(body.reason || "").trim();
      if (!rejectReason) throw new ApiError("A reject reason is required");
      doc.status = "rejected";
      doc.rejectReason = rejectReason;
      doc.decidedBy = actor;
    } else if (action === "restock") {
      if (doc.status !== "approved" && doc.status !== "restocked") {
        throw new ApiError("Approve the return before restocking");
      }
      if (doc.status !== "restocked") {
        const { adjustInventory } = await import("@/services/inventory");
        await adjustInventory(
          doc.items.map((i) => ({
            productId: i.productId,
            size: i.size || undefined,
            quantity: i.quantity,
          })),
          true,
          { reason: "return", orderId: doc.orderId, actor }
        );
        doc.status = "restocked";
        doc.restockedAt = new Date();
        doc.decidedBy = actor;

        const order = await Order.findOne({ orderId: doc.orderId });
        if (order && order.status !== "Returned") {
          const prev = order.status;
          order.status = "Returned";
          appendTimeline(order, {
            actor,
            action: "status",
            fromStatus: prev,
            toStatus: "Returned",
            message: "Return restocked",
            internal: false,
          });
          order.markModified("timeline");
          await order.save();
        }
      }
    } else if (action === "refund") {
      const order = await Order.findOne({ orderId: doc.orderId });
      if (!order) return jsonError("Order not found", 404);
      const amount = body.amount !== undefined ? Number(body.amount) : Number(order.total);
      const result = await refundOrder({
        order,
        amount,
        reason: String(body.reason || doc.reason || "Return refund"),
        actor: authUser,
        request,
      });
      doc.refundAmount = Number(doc.refundAmount || 0) + amount;
      if (doc.status === "requested") {
        doc.status = "approved";
        doc.decidedBy = actor;
      }
      await doc.save();
      await logAdminAction({
        request,
        actor: authUser,
        action: "refund",
        resource: "return",
        resourceId: doc.orderId,
        message: `₹${amount}`,
      });
      return jsonOk({
        return: {
          id: doc._id.toString(),
          orderId: doc.orderId,
          status: doc.status,
          refundAmount: doc.refundAmount,
        },
        refundedAmount: result.refundedAmount,
      });
    } else {
      throw new ApiError("action must be approve, reject, restock, or refund");
    }

    await doc.save();
    await logAdminAction({
      request,
      actor: authUser,
      action,
      resource: "return",
      resourceId: doc.orderId,
      message: doc.reason,
    });

    return jsonOk({
      return: {
        id: doc._id.toString(),
        orderId: doc.orderId,
        type: doc.type,
        status: doc.status,
        reason: doc.reason,
        rejectReason: doc.rejectReason,
        refundAmount: doc.refundAmount,
        decidedBy: doc.decidedBy,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
