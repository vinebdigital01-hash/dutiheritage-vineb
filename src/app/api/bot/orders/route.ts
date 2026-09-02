import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(request: Request) {
  try {
    await await validateBotApiKey(request);
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");

    await connectDB();

    if (orderId) {
      const order = await Order.findOne({ orderId });
      if (!order) {
        return jsonError("Order not found", 404);
      }
      return jsonOk(order);
    }

    if (phone) {
      // Extract last 10 digits for loose matching if length > 10, else match exactly or regex
      const last10 = phone.length >= 10 ? phone.slice(-10) : phone;
      const orders = await Order.find({ "customer.phone": { $regex: last10, $options: "i" } })
        .sort({ createdAt: -1 });
      return jsonOk(orders);
    }
    
    return jsonError("Must provide orderId or phone query param", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
