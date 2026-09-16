import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { refundOrder } from "@/lib/order-refund";
import { toOrder } from "@/lib/mappers";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
  isValidObjectId,
} from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: OPS_WRITE });
    const { id } = await params;
    await connectDB();

    const order = isValidObjectId(id)
      ? (await Order.findById(id)) || (await Order.findOne({ orderId: id }))
      : await Order.findOne({ orderId: id });
    if (!order) return jsonError("Order not found", 404);

    const body = await request.json();
    const amount = body.amount !== undefined ? Number(body.amount) : Number(order.total) - Number(order.refundedAmount || 0);
    const reason = String(body.reason || "").trim();
    if (!reason) throw new ApiError("A refund reason is required");

    await refundOrder({
      order,
      amount,
      reason,
      actor: authUser,
      request,
    });

    return jsonOk({
      order: toOrder(order.toObject(), { includeTimeline: true, includeInternal: true }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
