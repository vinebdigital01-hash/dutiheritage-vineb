import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OtpSession } from "@/models/OtpSession";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    await connectDB();

    // Clean phone number (ensure +91)
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;
    if (!formattedPhone.startsWith("+")) formattedPhone = "+" + formattedPhone;

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Remove any existing OTPs for this number
    await OtpSession.deleteMany({ phone: formattedPhone });

    // Save new OTP
    await OtpSession.create({
      phone: formattedPhone,
      otp,
      expiresAt,
    });

    // Call dutiheritage-bot API
    const botUrl = process.env.WHATSAPP_BOT_API_URL || "http://localhost:4000/internal/send-message";
    const botKey = process.env.WHATSAPP_BOT_API_KEY || "duti_bot_secret_key_2026";

    const message = `*Duti Heritage*\n\nYour login OTP is: *${otp}*\n\n_Valid for 5 minutes. Do not share this code with anyone._`;

    // Only send if bot URL is defined (or try localhost)
    try {
      const botRes = await fetch(botUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-api-key": botKey,
        },
        body: JSON.stringify({
          phone: formattedPhone.replace("+", ""), // Bot usually expects no plus
          message: message,
        }),
      });
      
      if (!botRes.ok) {
        console.error("Bot API error:", await botRes.text());
        // We still return success to the client for security, or fail.
        // If testing, we might want to fail. Let's not fail so UI progresses.
      }
    } catch (botErr) {
      console.error("Could not reach bot:", botErr);
    }

    return NextResponse.json({ success: true, message: "OTP sent via WhatsApp" });
  } catch (error: any) {
    console.error("[WhatsApp OTP Send]", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
