import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OtpSession } from "@/models/OtpSession";
import { sendEmail, emailLayout } from "@/lib/email";
import { verifyIdToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(authHeader);
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { target, type } = await req.json(); // type: "email" | "phone"
    if (!target || !type) return NextResponse.json({ error: "Target and type required" }, { status: 400 });

    await connectDB();

    // Clean target
    let formattedTarget = target;
    if (type === "phone") {
      formattedTarget = target.replace(/\D/g, "");
      if (formattedTarget.length === 10) formattedTarget = "91" + formattedTarget;
      if (!formattedTarget.startsWith("+")) formattedTarget = "+" + formattedTarget;
    } else {
      formattedTarget = target.trim().toLowerCase();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpSession.deleteMany({ phone: formattedTarget }); // re-using phone field as 'target'
    await OtpSession.create({ phone: formattedTarget, otp, expiresAt });

    if (type === "phone") {
      const botUrl = process.env.WHATSAPP_BOT_API_URL || "http://localhost:4000/internal/send-message";
      const botKey = process.env.WHATSAPP_BOT_API_KEY || "duti_bot_secret_key_2026";
      const message = `*Duti Heritage*\n\nYour verification code to update your profile is: *${otp}*\n\n_Valid for 5 minutes._`;
      
      await fetch(botUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-api-key": botKey },
        body: JSON.stringify({ phone: formattedTarget.replace("+", ""), message }),
      }).catch(err => console.error("Bot API error:", err));
    } else {
      await sendEmail({
        to: formattedTarget,
        subject: "Verify your email address - Duti Heritage",
        html: emailLayout("Email Verification", `Your verification code is: <strong>${otp}</strong>. Valid for 5 minutes.`),
        type: "auth",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Contact Update Send]", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
