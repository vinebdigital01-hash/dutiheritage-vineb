import { getPublicSiteUrl } from "@/lib/utils";

export function isEmailConfigured(): boolean {
  const key =
    process.env.RESEND_API_KEY ||
    process.env.RESEND_AUTH_KEY ||
    process.env.RESEND_ORDERS_KEY ||
    process.env.RESEND_MARKETING_KEY;
  return Boolean(key && process.env.EMAIL_FROM);
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
  type?: "auth" | "orders" | "marketing";
  attachments?: { filename: string; content: string }[];
}): Promise<SendEmailResult> {
  
  let apiKey = process.env.RESEND_API_KEY;
  if (input.type === "auth") apiKey = process.env.RESEND_AUTH_KEY || apiKey;
  if (input.type === "orders") apiKey = process.env.RESEND_ORDERS_KEY || apiKey;
  if (input.type === "marketing") apiKey = process.env.RESEND_MARKETING_KEY || apiKey;
  
  let from = process.env.EMAIL_FROM;
  if (input.type === "marketing") from = "Duti Heritage <marketing@dutiheritage.co.in>";
  

  if (!apiKey || !from) {
    console.info("[email] skipped — RESEND_API_KEY / EMAIL_FROM not set");
    return { ok: true, skipped: true };
  }

  if (!input.to || !input.to.includes("@")) {
    console.error("[email] Invalid recipient email:", input.to);
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
      console.error("[email] Error from Resend:", msg);
      return { ok: false, error: msg };
    }

    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email send failed";
    console.error("[email] Exception caught:", msg);
    return { ok: false, error: msg };
  }
}

export function emailLayout(title: string, bodyHtml: string): string {
  const site = getPublicSiteUrl();
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;color:#000000;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e0e0e0;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #e0e0e0;text-align:center;">
              <a href="${site}" style="text-decoration:none;color:#000000;">
                <span style="font-family:'Times New Roman',Times,Georgia,serif;font-size:20px;letter-spacing:3px;text-transform:uppercase;font-weight:400;">Duti Heritage</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 20px;font-family:'Times New Roman',Times,Georgia,serif;font-size:22px;font-weight:400;letter-spacing:2px;text-transform:uppercase;line-height:1.3;color:#000000;">${title}</h1>
              <div style="font-family:Outfit,Helvetica,Arial,sans-serif;font-size:15px;font-weight:300;line-height:1.65;color:#333333;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111111;">
                    <a href="${site}" style="display:inline-block;padding:14px 28px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:12px;font-weight:500;letter-spacing:2px;text-transform:uppercase;text-decoration:none;color:#ffffff;">Shop now</a>
                  </td>
                  <td width="12"></td>
                  <td style="border:1px solid #000000;">
                    <a href="${site}/account" style="display:inline-block;padding:13px 24px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:12px;font-weight:500;letter-spacing:2px;text-transform:uppercase;text-decoration:none;color:#000000;">Your account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f5f5f5;border-top:1px solid #e0e0e0;text-align:center;">
              <p style="margin:0 0 6px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b6b6b;">Made with love in India</p>
              <p style="margin:0;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:12px;color:#6b6b6b;">© ${year} Duti Heritage · <a href="${site}" style="color:#000000;text-decoration:underline;">dutiheritage.co.in</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
