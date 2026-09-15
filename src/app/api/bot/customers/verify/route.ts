// src/app/api/bot/customers/verify/route.ts
//
// ⚠️ GET checks whether a phone number has an account (used before sending
// an OTP). POST marks that customer as WhatsApp-verified — this writes two
// optional fields (whatsappVerified, lastVerifiedAt); add them to your
// Customer schema if it runs in strict mode.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';
import { validateBotApiKey } from '@/lib/bot-auth';

export async function GET(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

  await connectDB();
  const customer = await Customer.findOne({ phone }).lean();

  return NextResponse.json({ customer: customer || null });
}

export async function POST(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phone, customerId } = await req.json();
  if (!phone || !customerId) {
    return NextResponse.json({ error: 'phone and customerId are required' }, { status: 400 });
  }

  await connectDB();
  await Customer.findByIdAndUpdate(customerId, { lastVisit: new Date() });

  return NextResponse.json({ success: true });
}
