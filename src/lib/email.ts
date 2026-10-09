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
    const payload: Record<string, unknown> = {
      from,
      to: [input.to.trim().toLowerCase()],
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
    if (input.attachments?.length) {
      payload.attachments = input.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

/* ─── Premium design tokens (email-safe) ─── */

const FONT_SERIF = "'Times New Roman',Times,Georgia,serif";
const FONT_SANS = "Georgia,Helvetica,Arial,sans-serif";
const C = {
  ink: "#1a1a1a",
  muted: "#6b6560",
  line: "#e8e4df",
  paper: "#ffffff",
  wash: "#f7f4ef",
  accent: "#8b6914",
  soft: "#f0ebe3",
} as const;

export function escHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailCta = { label: string; href: string };

export type EmailLayoutOptions = {
  /** Inbox preview text (hidden in body) */
  preheader?: string;
  primaryCta?: EmailCta;
  secondaryCta?: EmailCta;
  /** Hide default Shop / Account buttons */
  hideDefaultCtas?: boolean;
  footerNote?: string;
  kind?: "transactional" | "marketing" | "staff";
};

/** Primary / outline button — table-based for Outlook */
export function emailButton(
  label: string,
  href: string,
  variant: "primary" | "outline" = "primary"
): string {
  const safeHref = escHtml(href);
  const safeLabel = escHtml(label);
  if (variant === "outline") {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;"><tr><td style="border:1px solid ${C.ink};">
      <a href="${safeHref}" style="display:inline-block;padding:13px 22px;font-family:${FONT_SANS};font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none;color:${C.ink};">${safeLabel}</a>
    </td></tr></table>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;"><tr><td style="background:${C.ink};">
    <a href="${safeHref}" style="display:inline-block;padding:14px 24px;font-family:${FONT_SANS};font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none;color:#ffffff;">${safeLabel}</a>
  </td></tr></table>`;
}

export function emailEyebrow(text: string): string {
  return `<p style="margin:0 0 10px;font-family:${FONT_SANS};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${C.accent};">${escHtml(text)}</p>`;
}

export function emailLead(html: string): string {
  return `<div style="margin:0 0 20px;font-family:${FONT_SANS};font-size:16px;line-height:1.65;color:${C.ink};">${html}</div>`;
}

export function emailNote(html: string): string {
  return `<div style="margin:0 0 20px;padding:16px 18px;background:${C.soft};border-left:3px solid ${C.accent};font-family:${FONT_SANS};font-size:14px;line-height:1.55;color:${C.ink};">${html}</div>`;
}

export function emailPromoCode(code: string, hint?: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;"><tr><td align="center" style="padding:20px 16px;background:${C.wash};border:1px dashed ${C.accent};">
    ${hint ? `<p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${escHtml(hint)}</p>` : ""}
    <p style="margin:0;font-family:${FONT_SERIF};font-size:28px;letter-spacing:4px;color:${C.ink};">${escHtml(code)}</p>
  </td></tr></table>`;
}

export function emailOtpBlock(otp: string, minutes = 10): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 20px;"><tr><td align="center" style="padding:22px 16px;background:${C.wash};border:1px solid ${C.line};">
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Your code</p>
    <p style="margin:0;font-family:Consolas,Monaco,monospace;font-size:32px;letter-spacing:10px;font-weight:700;color:${C.ink};">${escHtml(otp)}</p>
    <p style="margin:12px 0 0;font-family:${FONT_SANS};font-size:12px;color:${C.muted};">Valid for ${minutes} minutes</p>
  </td></tr></table>`;
}

export function emailMetricRow(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      (r) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${FONT_SANS};font-size:14px;color:${C.muted};">${escHtml(r.label)}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${FONT_SANS};font-size:14px;font-weight:600;color:${C.ink};">${escHtml(r.value)}</td>
    </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${cells}</table>`;
}

/**
 * Premium brand shell for every automated email.
 * Backward compatible: emailLayout(title, bodyHtml) or emailLayout(title, bodyHtml, opts).
 */
export function emailLayout(
  title: string,
  bodyHtml: string,
  opts: EmailLayoutOptions = {}
): string {
  const site = getPublicSiteUrl();
  const year = new Date().getFullYear();
  const kind = opts.kind || "transactional";
  const preheader = opts.preheader || title;

  const primary =
    opts.primaryCta ||
    (!opts.hideDefaultCtas
      ? {
          label: kind === "staff" ? "Open admin" : "Shop now",
          href: kind === "staff" ? `${site}/admin` : site,
        }
      : null);
  const secondary =
    opts.secondaryCta ||
    (!opts.hideDefaultCtas && kind !== "staff"
      ? { label: "Your account", href: `${site}/account` }
      : null);

  const ctaRow =
    primary || secondary
      ? `<tr>
          <td style="padding:8px 36px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                ${primary ? `<td style="padding-right:10px;">${emailButton(primary.label, primary.href, "primary")}</td>` : ""}
                ${secondary ? `<td>${emailButton(secondary.label, secondary.href, "outline")}</td>` : ""}
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const footerExtra = opts.footerNote
    ? `<p style="margin:0 0 10px;font-family:${FONT_SANS};font-size:12px;line-height:1.5;color:${C.muted};">${opts.footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escHtml(title)}</title>
  <!--[if mso]><style>body,table,td{font-family:Georgia,serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.wash};color:${C.ink};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.wash};">
    ${escHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.wash};padding:0;">
    <tr>
      <td align="center" style="padding:28px 14px 40px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.paper};border:1px solid ${C.line};">
          <tr>
            <td style="padding:0;height:4px;background:${C.ink};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 36px 22px;text-align:center;border-bottom:1px solid ${C.line};">
              <a href="${site}" style="text-decoration:none;color:${C.ink};">
                <span style="font-family:${FONT_SERIF};font-size:22px;letter-spacing:4px;text-transform:uppercase;font-weight:400;color:${C.ink};">Duti Heritage</span>
              </a>
              <p style="margin:10px 0 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${C.muted};">Handcrafted · India</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 12px;">
              <h1 style="margin:0 0 22px;font-family:${FONT_SERIF};font-size:24px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;line-height:1.35;color:${C.ink};">${escHtml(title)}</h1>
              <div style="font-family:${FONT_SANS};font-size:15px;font-weight:400;line-height:1.65;color:#3d3a36;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          ${ctaRow}
          <tr>
            <td style="padding:22px 36px;background:${C.wash};border-top:1px solid ${C.line};text-align:center;">
              ${footerExtra}
              <p style="margin:0 0 6px;font-family:${FONT_SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Made with love in India</p>
              <p style="margin:0;font-family:${FONT_SANS};font-size:12px;color:${C.muted};">© ${year} Duti Heritage · <a href="${site}" style="color:${C.ink};text-decoration:underline;">dutiheritage.co.in</a></p>
              ${
                kind === "marketing"
                  ? `<p style="margin:12px 0 0;font-family:${FONT_SANS};font-size:11px;color:${C.muted};">You received this because you shopped with us or joined our list.</p>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
