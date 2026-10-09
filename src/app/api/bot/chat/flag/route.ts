import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatSession } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone } from "@/lib/bot-phone";

export async function POST(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone, reason } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const normalized = normalizeBotPhone(phone);
  await connectDB();
  await ChatSession.findOneAndUpdate(
    { phone: normalized },
    {
      phone: normalized,
      needsHumanReview: true,
      handoffReason: reason || "",
      handoffAt: new Date(),
      mode: "human",
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
