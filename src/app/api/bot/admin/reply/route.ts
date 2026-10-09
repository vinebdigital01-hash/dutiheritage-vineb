import { NextRequest, NextResponse } from "next/server";
import { validateBotApiKey } from "@/lib/bot-auth";

const BOT_SERVER_URL = process.env.BOT_SERVER_URL || "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone, message, resumeBot } = await req.json();
  if (!phone || !message) {
    return NextResponse.json(
      { error: "phone and message are required" },
      { status: 400 }
    );
  }

  const res = await fetch(`${BOT_SERVER_URL}/internal/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bot-api-key": process.env.BOT_API_KEY || "",
    },
    body: JSON.stringify({ phone, message, resumeBot }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { error?: string }).error || "Bot server rejected the message" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
