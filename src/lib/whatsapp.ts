/**
 * WhatsApp via Interakt or Wati. Skips when not configured.
 */

export function isWhatsAppConfigured(): boolean {
  const provider = (process.env.WHATSAPP_PROVIDER || "").toLowerCase();
  if (provider === "interakt") return Boolean(process.env.INTERAKT_API_KEY);
  if (provider === "wati") {
    return Boolean(process.env.WATI_API_TOKEN && process.env.WATI_API_URL);
  }
  return false;
}

export type SendWhatsAppResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function sendWhatsApp(input: {
  phone: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
}): Promise<SendWhatsAppResult> {
  if (!input.phone?.trim()) {
    return { ok: false, error: "Missing phone" };
  }

  const provider = (process.env.WHATSAPP_PROVIDER || "").toLowerCase();
  const phone = digitsOnly(input.phone);

  if (!provider || provider === "none") {
    console.info("[whatsapp] skipped — WHATSAPP_PROVIDER not set");
    return { ok: true, skipped: true };
  }

  try {
    if (provider === "interakt") return sendInterakt(phone, input);
    if (provider === "wati") return sendWati(phone, input);
    return { ok: false, error: `Unknown WHATSAPP_PROVIDER: ${provider}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "WhatsApp send failed";
    console.error("[whatsapp]", msg);
    return { ok: false, error: msg };
  }
}

async function sendInterakt(
  phone: string,
  input: {
    message: string;
    templateName?: string;
    templateParams?: string[];
  }
): Promise<SendWhatsAppResult> {
  const apiKey = process.env.INTERAKT_API_KEY;
  if (!apiKey) return { ok: true, skipped: true };

  const countryCode = phone.startsWith("91") && phone.length >= 12 ? "91" : "91";
  const local =
    phone.startsWith(countryCode) && phone.length > 10
      ? phone.slice(countryCode.length)
      : phone;

  const payload: Record<string, unknown> = {
    countryCode: `+${countryCode}`,
    phoneNumber: local,
    callbackData: "dutiheritage-automation",
    type: input.templateName ? "Template" : "Text",
  };

  if (input.templateName) {
    payload.template = {
      name: input.templateName,
      languageCode: "en",
      bodyValues: input.templateParams || [],
    };
  } else {
    payload.data = { message: input.message };
  }

  const res = await fetch("https://api.interakt.ai/v1/public/message/", {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[whatsapp/interakt]", res.status, text);
    return { ok: false, error: `Interakt HTTP ${res.status}` };
  }
  return { ok: true };
}

async function sendWati(
  phone: string,
  input: {
    message: string;
    templateName?: string;
    templateParams?: string[];
  }
): Promise<SendWhatsAppResult> {
  const token = process.env.WATI_API_TOKEN;
  const base = process.env.WATI_API_URL?.replace(/\/$/, "");
  if (!token || !base) return { ok: true, skipped: true };

  if (input.templateName) {
    const res = await fetch(
      `${base}/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(phone)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_name: input.templateName,
          broadcast_name: `auto_${Date.now()}`,
          parameters: (input.templateParams || []).map((v) => ({
            name: v,
            value: v,
          })),
        }),
      }
    );
    if (!res.ok) return { ok: false, error: `Wati HTTP ${res.status}` };
    return { ok: true };
  }

  const res = await fetch(`${base}/api/v1/sendSessionMessage/${phone}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageText: input.message }),
  });

  if (!res.ok) return { ok: false, error: `Wati HTTP ${res.status}` };
  return { ok: true };
}
