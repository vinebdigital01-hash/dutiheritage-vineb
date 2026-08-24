export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
};

/**
 * Send email via Resend REST (no npm SDK).
 * Skips quietly when RESEND_API_KEY is missing (dev-safe).
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.info("[email] skipped — RESEND_API_KEY / EMAIL_FROM not set");
    return { ok: true, skipped: true };
  }

  if (!input.to || !input.to.includes("@")) {
    return { ok: false, error: "Invalid recipient email" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to.trim().toLowerCase()],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg =
        data.error?.message || data.message || `Resend HTTP ${res.status}`;
      console.error("[email]", msg);
      return { ok: false, error: msg };
    }

    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email send failed";
    console.error("[email]", msg);
    return { ok: false, error: msg };
  }
}

export function emailLayout(title: string, bodyHtml: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dutiheritage.com";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:Georgia,serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e8e4de;padding:32px;">
        <tr><td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#888;padding-bottom:16px;">Duti Heritage</td></tr>
        <tr><td style="font-size:22px;letter-spacing:1px;padding-bottom:16px;">${title}</td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#333;">${bodyHtml}</td></tr>
        <tr><td style="padding-top:28px;font-size:12px;color:#999;">
          <a href="${site}" style="color:#1a1a1a;">Shop now</a> ·
          <a href="${site}/account" style="color:#1a1a1a;">Your account</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
