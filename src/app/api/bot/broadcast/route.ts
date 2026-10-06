import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { ChatSession } from "@/models/ChatSession";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { isWhatsAppConfigured, sendWhatsApp } from "@/lib/whatsapp";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

const MAX_SEND = 200;

export async function GET(request: Request) {
  try {
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    const provider = (process.env.WHATSAPP_PROVIDER || "").toLowerCase();
    const configured = isWhatsAppConfigured();
    return jsonOk({
      configured,
      provider: configured ? provider : "",
      reason: configured
        ? ""
        : "WhatsApp is not connected. Set WHATSAPP_PROVIDER (interakt or wati) and the API key on the server. Until then we will not pretend a message was sent. Use Customer lists if you send to a saved group after keys are live.",
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
    await requireAuth(request, { admin: true, roles: OPS_WRITE });

    if (!isWhatsAppConfigured()) {
      throw new ApiError(
        "WhatsApp is not connected. No messages were sent.",
        503
      );
    }

    const body = await request.json();
    const message = String(body.message || "").trim();
    const type = String(body.type || "text");
    const audience = String(
      body.audience || (body.phones === "all" ? "all" : "custom")
    );
    if (!message) throw new ApiError("Message is required", 400);

    await connectDB();

    let phones: string[] = [];
    if (audience === "custom" || (typeof body.phones === "string" && body.phones !== "all")) {
      const raw = Array.isArray(body.phones)
        ? body.phones.join(",")
        : String(body.phones || "");
      phones = raw
        .split(/[\s,;]+/)
        .map((p) => p.replace(/\D/g, ""))
        .filter((p) => p.length >= 10);
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
      });
      if (r.ok && !r.skipped) {
        sent++;
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
