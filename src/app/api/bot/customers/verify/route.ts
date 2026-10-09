import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer, Order } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone, phoneMatchOr } from "@/lib/bot-phone";

export async function GET(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  await connectDB();
  const customer = await Customer.findOne({ $or: phoneMatchOr("phone", phone) }).lean();

  let isVIP = false;
  let completedOrders = 0;
  if (customer) {
    completedOrders = await Order.countDocuments({
      $or: [
        ...phoneMatchOr("customer.phone", phone),
        ...(customer._id ? [{ customerId: customer._id }] : []),
      ],
      status: { $in: ["Delivered", "Shipped", "In Transit", "Confirmed", "Packed"] },
    });
    // VIP = more than 3 completed orders
    isVIP = completedOrders > 3;
  }

  return NextResponse.json({
    customer: customer || null,
    isVIP,
    completedOrders,
  });
}

export async function POST(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone, customerId } = await req.json();
  if (!phone || !customerId) {
    return NextResponse.json(
      { error: "phone and customerId are required" },
      { status: 400 }
    );
  }

  await connectDB();
  await Customer.findByIdAndUpdate(customerId, {
    lastVisit: new Date(),
    phone: normalizeBotPhone(phone),
  });

  return NextResponse.json({ success: true });
}
