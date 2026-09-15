// src/app/api/bot/chat/flag/route.ts
//
// ⚠️ Flags a conversation for the admin dashboard when a customer asks for
// a human. Adjust the ChatSession match field ({ phone }) if your schema
// keys sessions differently.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ChatSession } from '@/models';

function requireBotKey(req: NextRequest) {
  return req.headers.get('x-bot-api-key') === process.env.BOT_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!requireBotKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phone, reason } = await req.json();
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

  await connectDB();
  await ChatSession.findOneAndUpdate(
    { phone },
    { needsHumanReview: true, handoffReason: reason, handoffAt: new Date() },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
