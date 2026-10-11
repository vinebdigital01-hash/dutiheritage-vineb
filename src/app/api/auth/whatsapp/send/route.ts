import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OtpSession } from "@/models/OtpSession";

function resolveBotNotifyUrl(): string {
  const explicit = (process.env.WHATSAPP_BOT_API_URL || "").trim();
  if (explicit) return explicit;
  const base = (process.env.BOT_SERVER_URL || "").replace(/\/$/, "");
  if (base) return `${base}/api/notify`;
  return "https://dutiheritage-bot.onrender.com/api/notify";
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    await connectDB();

    let digits = String(phone).replace(/\D/g, "");
    if (digits.length === 10) digits = "91" + digits;
    if (digits.length !== 12 || !digits.startsWith("91")) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }
    const formattedPhone = `+${digits}`;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpSession.deleteMany({ phone: formattedPhone });
    await OtpSession.create({
      phone: formattedPhone,
      otp,
      expiresAt,
    });

    const botUrl = resolveBotNotifyUrl();
    const botKey =
      process.env.BOT_API_KEY || process.env.WHATSAPP_BOT_API_KEY || "";

    if (!botKey) {
      console.error("[WhatsApp OTP] BOT_API_KEY missing");
      return NextResponse.json(
        { error: "WhatsApp login is not configured on the server." },
        { status: 503 }
      );
    }

    const message = `🔐 *Duti Heritage Login*\n\nYour one-time password is: *${otp}*\n\nThis code is valid for 5 minutes. Do not share it with anyone.`;

    try {
      const botRes = await fetch(botUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-api-key": botKey,
        },
        body: JSON.stringify({
          phone: digits,
          message,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!botRes.ok) {
        const errText = await botRes.text().catch(() => "");
        console.error("Bot API error:", botRes.status, errText.slice(0, 300));
        return NextResponse.json(
          {
            error:
              "Could not send WhatsApp OTP right now. Ensure the bot is online, or try SMS.",
          },
          { status: 502 }
        );
      }
    } catch (botErr) {
      console.error("Could not reach bot:", botErr);
      return NextResponse.json(
        {
          error:
            "WhatsApp bot is unreachable. Start the bot server or use SMS OTP.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent via WhatsApp" });
  } catch (error: unknown) {
    console.error("[WhatsApp OTP Send]", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
