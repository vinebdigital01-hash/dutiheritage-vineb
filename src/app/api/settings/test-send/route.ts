import { requireAuth } from "@/lib/auth";
import { SETTINGS_WRITE } from "@/lib/rbac";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";
import { sendEmail, emailLayout, isEmailConfigured } from "@/lib/email";
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp";
import { getStoreSettings } from "@/lib/store-settings";

export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: SETTINGS_WRITE });
    const body = await request.json();
    const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
    const to = String(body.to || "").trim();
    if (!to) throw new ApiError("Recipient is required");

    const store = await getStoreSettings();
    const name = store.legalName;

    if (channel === "email") {
      if (!to.includes("@")) throw new ApiError("Valid email required");
      const result = await sendEmail({
        to,
        subject: `${name} — test email`,
        html: emailLayout(
          "Test email",
          `<p>This is a test from the admin Settings hub.</p><p>If you received this, Resend is working.</p>`
        ),
        type: "orders",
      });
      return jsonOk({
        result,
        configured: isEmailConfigured(),
      });
    }

    const result = await sendWhatsApp({
      phone: to,
      message: `${name}: test message from admin Settings. WhatsApp is working.`,
    });
    return jsonOk({
      result,
      configured: isWhatsAppConfigured(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
