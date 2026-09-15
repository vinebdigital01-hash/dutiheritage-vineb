// src/app/api/bot/orders/route.ts
//
// ⚠️ Assumes Order has a `phone` field to match against. If orders are only
// linked via a Customer reference in your schema, look up the Customer by
// phone first and query Order by customerId instead.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { validateBotApiKey } from '@/lib/bot-auth';

export async function GET(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const limit = Math.min(Number(searchParams.get('limit') || 8), 20);
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

  await connectDB();
  const orders = await Order.find({ "customer.phone": phone }).sort({ createdAt: -1 }).limit(limit).lean();

  return NextResponse.json({ orders: orders.map(o => ({
    orderNumber: o.orderId,
    status: o.status,
    createdAt: o.createdAt,
    total: o.total,
    items: o.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
  })) });
}
