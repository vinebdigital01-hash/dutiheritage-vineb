import { requireAuth } from "@/lib/auth";
import { Order, ORDER_STATUSES } from "@/models/Order";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";
import { sendOrderShipped, sendOrderDelivered, sendOrderCancelled } from "@/lib/automations";

type UpdateRow = {
  orderId: string;
  status?: string;
  awb?: string;
  courier?: string;
  trackingUrl?: string;
};

export async function POST(request: Request) {
  try {
    await requireAuth(request, { admin: true, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] });
    const { updates }: { updates: UpdateRow[] } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return jsonError("Invalid payload: expected an array of updates", 400);
    }

    await connectDB();
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of updates) {
      if (!row.orderId) {
        errorCount++;
        errors.push("Missing orderId in row");
        continue;
      }

      const existingOrder = await Order.findOne({ orderId: row.orderId }).lean();
      if (!existingOrder) {
        errorCount++;
        errors.push(`Order not found: ${row.orderId}`);
        continue;
      }

      const updateData: any = {};
      if (row.status && ORDER_STATUSES.includes(row.status as any)) {
        updateData.status = row.status;
        
        // Auto-update COD payment status when delivered
        if (row.status === "Delivered" && existingOrder.paymentStatus === "pending") {
          updateData.paymentStatus = "paid";
        }
      }

      if (row.awb || row.courier || row.trackingUrl) {
        // Find existing to merge tracking info
        if (!existingOrder) {
          errorCount++;
          errors.push(`Order not found: ${row.orderId}`);
          continue;
        }
        
        updateData.trackingInfo = {
          awb: row.awb ?? existingOrder.trackingInfo?.awb,
          courier: row.courier ?? existingOrder.trackingInfo?.courier,
          trackingUrl: row.trackingUrl ?? existingOrder.trackingInfo?.trackingUrl,
        };
      }

      if (Object.keys(updateData).length === 0) {
        errorCount++;
        errors.push(`No valid updates for order ${row.orderId}`);
        continue;
      }

      try {
        const result = await Order.findOneAndUpdate(
          { orderId: row.orderId },
          { $set: updateData },
          { new: true } // Need the updated doc
        );
        if (result) {
          successCount++;
          
          // Trigger Automations
          const prevStatus = existingOrder.status;
          const notifyBase = {
            email: result.customer?.email,
            phone: result.customer?.phone,
            name: result.customer?.name,
            orderId: result.orderId,
            customerId: result.customerId?.toString(),
          };

          if (updateData.status === "Shipped" && prevStatus !== "Shipped") {
            void sendOrderShipped({
              ...notifyBase,
              trackingUrl: result.trackingInfo?.trackingUrl,
              courier: result.trackingInfo?.courier,
              awb: result.trackingInfo?.awb,
            }).catch((e) => console.error("[bulk_order_shipped]", e));
          }

          if (updateData.status === "Delivered" && prevStatus !== "Delivered") {
            void sendOrderDelivered(notifyBase).catch((e) =>
              console.error("[bulk_order_delivered]", e)
            );
          }

          if (updateData.status === "Cancelled" && prevStatus !== "Cancelled") {
            void sendOrderCancelled({
              ...notifyBase,
              total: result.total,
            }).catch((e) => console.error("[bulk_order_cancelled]", e));
          }

        } else {
          errorCount++;
          errors.push(`Order not found: ${row.orderId}`);
        }
      } catch (e: any) {
        errorCount++;
        errors.push(`Error updating ${row.orderId}: ${e.message}`);
      }
    }

    return jsonOk({
      successCount,
      errorCount,
      errors
    });

  } catch (error) {
    return handleApiError(error);
  }
}