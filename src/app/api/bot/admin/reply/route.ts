// src/app/api/bot/admin/reply/route.ts
//
// Called by your Admin dashboard's Live Inbox "send" button — so this
// should sit behind whatever auth already protects /admin/whatsapp (the
// Firebase ID token check your adminFetch wrapper sends), not the bot API
// key. Add that check where marked below; I don't have that middleware.

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, isAdminEmail } from '@/lib/auth';

const BOT_SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const user = await verifyIdToken(authHeader);
    if (!isAdminEmail(user.email)) {
      throw new Error("Not an admin");
    }
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phone, message, resumeBot } = await req.json();
  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message are required' }, { status: 400 });
  }

  const res = await fetch(`${BOT_SERVER_URL}/internal/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bot-api-key': process.env.BOT_API_KEY || '' },
    body: JSON.stringify({ phone, message, resumeBot }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.error || 'Bot server rejected the message' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
