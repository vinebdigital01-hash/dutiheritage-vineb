import { requireAuth } from "@/lib/auth";
import { Order } from "@/models/Order";
import { connectDB } from "@/lib/mongodb";
import { handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireAuth(request, { admin: true, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] });
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    await connectDB();
    
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const headers = [
      "orderId", 
      "status", 
      "awb", 
      "courier", 
      "trackingUrl", 
      "customerName", 
      "customerPhone", 
      "customerEmail",
      "city",
      "state",
      "pinCode",
      "paymentMethod",
      "paymentStatus", 
      "total",
      "createdAt"
    ];
    
    const csvLines = [headers.join(",")];
    
    orders.forEach((o: any) => {
      const row = [
        o.orderId,
        `"${o.status}"`,
        `"${o.trackingInfo?.awb || ""}"`,
        `"${o.trackingInfo?.courier || ""}"`,
        `"${o.trackingInfo?.trackingUrl || ""}"`,
        `"${o.customer?.name || ""}"`,
        `"${o.customer?.phone || ""}"`,
        `"${o.customer?.email || ""}"`,
        `"${o.customer?.city || ""}"`,
        `"${o.customer?.state || ""}"`,
        `"${o.customer?.pinCode || ""}"`,
        `"${o.paymentMethod || ""}"`,
        `"${o.paymentStatus || ""}"`,
        o.total,
        `"${new Date(o.createdAt).toISOString()}"`
      ];
      csvLines.push(row.join(","));
    });

    const csvContent = csvLines.join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders_export_${new Date().toISOString().split("T")[0]}.csv"`
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}