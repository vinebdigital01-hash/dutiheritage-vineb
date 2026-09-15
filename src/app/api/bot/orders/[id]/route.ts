// src/app/api/bot/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { validateBotApiKey } from '@/lib/bot-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const o = await Order.findOne({ orderId: id }).lean();
  if (!o) return NextResponse.json({ order: null }, { status: 404 });

  return NextResponse.json({ order: {
    orderNumber: o.orderId,
    status: o.status,
    createdAt: o.createdAt,
    total: o.total,
    trackingUrl: o.trackingInfo?.trackingUrl,
    items: o.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
  } });
}
