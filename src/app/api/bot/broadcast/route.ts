import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { ChatSession } from "@/models/ChatSession";
import { ChatMessage } from "@/models/ChatMessage";
import { isWhatsAppConfigured, sendWhatsApp, sanitizeWhatsAppImageUrl } from "@/lib/whatsapp";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

const MAX_SEND = 200;

export async function GET(request: Request) {
  try {
    await validateBotApiKey(request);
    const provider = (process.env.WHATSAPP_PROVIDER || "").toLowerCase();
    const configured = isWhatsAppConfigured();
    return jsonOk({
      configured,
      provider: configured ? (provider || "bot") : "",
      reason: configured
        ? ""
        : "WhatsApp is not connected. Configure your WhatsApp bot or provider in environment variables.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/bot/broadcast — send real WhatsApp, or fail. Never fake success.
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 4, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    await validateBotApiKey(request);

    if (!isWhatsAppConfigured()) {
      throw new ApiError(
        "WhatsApp is not connected. No messages were sent.",
        503
      );
    }

    const body = await request.json();
    const message = String(body.message || "").trim();
    const type = String(body.type || "text");
    const imageUrl = sanitizeWhatsAppImageUrl(body.imageUrl) || "";
    const buttonType = String(body.buttonType || "none");
    const ctaText = body.ctaText ? String(body.ctaText).trim().slice(0, 20) : "Shop Now";
    const ctaUrl = body.ctaUrl ? String(body.ctaUrl).trim() : "";
    const buttons = Array.isArray(body.buttons)
      ? body.buttons
          .filter((b: any) => b && (b.title || b.text))
          .slice(0, 3)
          .map((b: any, idx: number) => ({
            id: String(b.id || `btn_${idx + 1}`),
            title: String(b.title || b.text).trim().slice(0, 20),
          }))
      : [];
    const header = body.header ? String(body.header).trim().slice(0, 60) : "";
    const footer = body.footer ? String(body.footer).trim().slice(0, 60) : "";

    const audience = String(
      body.audience || (body.phones === "all" ? "all" : "custom")
    );

    if (type !== "template" && !message && !imageUrl && !ctaUrl && buttons.length === 0) {
      throw new ApiError("Please provide a message, photo, or button.", 400);
    }
    if (type === "template" && !message) {
      throw new ApiError("Template name is required.", 400);
    }
    if (buttonType === "cta" && !ctaUrl) {
      throw new ApiError("Website URL is required for Call-to-Action button.", 400);
    }
    if (buttonType === "reply" && buttons.length === 0) {
      throw new ApiError("At least one reply button title is required.", 400);
    }

    await connectDB();

    let phones: string[] = [];
    if (audience === "custom" || (typeof body.phones === "string" && body.phones !== "all")) {
      const raw = Array.isArray(body.phones)
        ? body.phones.join(",")
        : String(body.phones || "");
      phones = raw
        .split(/[\s,;]+/)
        .map((p: string) => p.replace(/\D/g, ""))
        .filter((p: string) => p.length >= 10);
    } else if (audience === "active") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sessions = await ChatSession.find({
        lastMessageAt: { $gte: since },
      })
        .select("phone")
        .limit(MAX_SEND)
        .lean();
      phones = sessions.map((s) => String(s.phone || "").replace(/\D/g, "")).filter((p) => p.length >= 10);
    } else {
      const customers = await Customer.find({
        phone: { $exists: true, $nin: [null, ""] },
      })
        .select("phone")
        .limit(MAX_SEND)
        .lean();
      phones = customers.map((c) => String(c.phone || "").replace(/\D/g, "")).filter((p) => p.length >= 10);
    }

    phones = [...new Set(phones)].slice(0, MAX_SEND);
    if (phones.length === 0) {
      throw new ApiError("No phone numbers to send to.", 400);
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const phone of phones) {
      const r = await sendWhatsApp({
        phone,
        message: type === "template" ? "" : message,
        templateName: type === "template" ? message : undefined,
        imageUrl: type === "template" ? undefined : (imageUrl || undefined),
        buttonType: type === "template" ? "none" : (buttonType as any),
        ctaText: type === "template" ? undefined : (ctaText || undefined),
        ctaUrl: type === "template" ? undefined : (ctaUrl || undefined),
        buttons: type === "template" ? undefined : (buttons.length > 0 ? buttons : undefined),
        header: header || undefined,
        footer: footer || undefined,
      });

      if (r.ok && !r.skipped) {
        sent++;
        try {
          let chatBody = message || "";
          if (imageUrl) chatBody = chatBody ? `[Photo] ${chatBody}` : `[Photo]`;
          if (buttonType === "cta" && ctaUrl) {
            chatBody = `${chatBody}\n🔘 [Button: ${ctaText} -> ${ctaUrl}]`.trim();
          } else if (buttonType === "reply" && buttons.length > 0) {
            const btnTitles = buttons.map((b: { title: string }) => b.title).join(" | ");
            chatBody = `${chatBody}\n🔘 [Buttons: ${btnTitles}]`.trim();
          }

          await ChatMessage.create({
            phone,
            direction: "outgoing",
            body: type === "template" ? `[Template: ${message}]` : chatBody,
            mediaUrl: imageUrl || undefined,
            messageType:
              buttonType !== "none"
                ? "interactive"
                : imageUrl
                ? "image"
                : type === "template"
                ? "template"
                : "text",
            sentBy: "admin",
          });
          await ChatSession.findOneAndUpdate(
            { phone },
            { $set: { lastMessageAt: new Date() } },
            { upsert: true }
          );
        } catch {
          // non-critical DB log failure
        }
      } else {
        failed++;
        if (r.error && errors.length < 5) errors.push(r.error);
      }
    }

    if (sent === 0) {
      throw new ApiError(
        errors[0] || "No WhatsApp messages were sent. Check the provider keys.",
        502
      );
    }

    return jsonOk({
      sent,
      failed,
      attempted: phones.length,
      message: `Sent ${sent} WhatsApp message${sent === 1 ? "" : "s"}${failed ? `. ${failed} failed` : ""}. Max ${MAX_SEND} numbers per send.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
