import { connectDB } from "@/lib/mongodb";
import {
  AutomationLog,
  AutomationSettings,
  Order,
  type AutomationFlowKey,
} from "@/models";
import {
  sendEmail,
  emailLayout,
  isEmailConfigured,
  emailEyebrow,
  emailLead,
  emailNote,
  emailPromoCode,
  emailButton,
  emailMetricRow,
  escHtml,
} from "@/lib/email";
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp";
import { getPublicSiteUrl } from "@/lib/utils";

/** Re-export for account-merge callers that historically looked here */
export { sendMergeOtpEmail } from "@/lib/account-merge";

const SITE = () => getPublicSiteUrl();

const PAYMENT_LABEL: Record<string, string> = {
  prepaid: "Prepaid (online)",
  cod: "Cash on delivery",
  partial: "Partial (advance + COD)",
};

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rupees(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "0";
}

function lineUnit(item: { price?: number; salePrice?: number | null }) {
  const sale = Number(item.salePrice);
  if (Number.isFinite(sale) && sale > 0) return sale;
  return Number(item.price) || 0;
}

export async function getAutomationSettings() {
  await connectDB();
  let doc = await AutomationSettings.findById("automations");
  if (!doc) {
    doc = await AutomationSettings.create({ _id: "automations" });
  }
  return doc;
}

export async function isFlowEnabled(flow: AutomationFlowKey): Promise<boolean> {
  const settings = await getAutomationSettings();
  const entry = settings[flow] as { enabled?: boolean } | undefined;
  return entry?.enabled !== false;
}

/**
 * Claim a send slot (dedup). Returns false if already sent.
 */
export async function claimAutomationSend(input: {
  flow: string;
  stage: string;
  recipientKey: string;
  channel: "email" | "whatsapp" | "both";
  customerId?: string;
  orderId?: string;
  cartId?: string;
  meta?: Record<string, unknown>;
}): Promise<boolean> {
  await connectDB();
  try {
    await AutomationLog.create({
      flow: input.flow,
      stage: input.stage,
      recipientKey: input.recipientKey.toLowerCase(),
      channel: input.channel,
      status: "sent",
      customerId: input.customerId,
      orderId: input.orderId,
      cartId: input.cartId,
      meta: input.meta,
    });
    return true;
  } catch (e: unknown) {
    // Duplicate key = already sent
    const err = e as { code?: number };
    if (err?.code === 11000) return false;
    throw e;
  }
}

export async function markAutomationFailed(
  flow: string,
  stage: string,
  recipientKey: string,
  detail: string
) {
  await connectDB();
  await AutomationLog.findOneAndUpdate(
    {
      flow,
      stage,
      recipientKey: recipientKey.toLowerCase(),
    },
    { status: "failed", detail }
  );
}

async function notifyChannels(input: {
  email?: string | null;
  phone?: string | null;
  subject: string;
  html: string;
  text: string;
  waMessage: string;
  waTemplate?: string;
  waParams?: string[];
  emailType?: "auth" | "orders" | "marketing";
}): Promise<{ emailOk: boolean; waOk: boolean; detail: string }> {
  const parts: string[] = [];
  let emailOk = true;
  let waOk = true;

  if (input.email && isEmailConfigured()) {
    const r = await sendEmail({
      to: input.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
      type: input.emailType,
    });
    emailOk = r.ok;
    parts.push(r.skipped ? "email:skipped" : r.ok ? "email:sent" : `email:${r.error}`);
  } else if (input.email) {
    const r = await sendEmail({
      to: input.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
      type: input.emailType,
    });
    parts.push(r.skipped ? "email:skipped" : r.ok ? "email:sent" : `email:${r.error}`);
    emailOk = r.ok;
  }

  if (input.phone && (isWhatsAppConfigured() || process.env.WHATSAPP_PROVIDER)) {
    const r = await sendWhatsApp({
      phone: input.phone,
      message: input.waMessage,
      templateName: input.waTemplate,
      templateParams: input.waParams,
    });
    waOk = r.ok;
    parts.push(r.skipped ? "wa:skipped" : r.ok ? "wa:sent" : `wa:${r.error}`);
  } else if (input.phone) {
    parts.push("wa:skipped");
  }

  return { emailOk, waOk, detail: parts.join(", ") || "nothing_to_send" };
}

// ─── Flows ───────────────────────────────────────────────────────────

export async function sendWelcome(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  customerId?: string;
}) {
  if (!(await isFlowEnabled("welcome"))) return { sent: false, reason: "disabled" };
  const key = (input.email || input.phone || input.customerId || "").toLowerCase();
  if (!key) return { sent: false, reason: "no_recipient" };

  const claimed = await claimAutomationSend({
    flow: "welcome",
    stage: "default",
    recipientKey: key,
    channel: "both",
    customerId: input.customerId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const name = input.name || "there";
  let loginHtml = "";
  
  if (input.email) {
    try {
      const { getAuth } = await import("firebase-admin/auth");
      const { getAdminApp } = await import("@/lib/auth");
      const auth = getAuth(getAdminApp());
      
      // Try to create the user if they don't exist in Firebase Auth yet (e.g. guest checkout)
      try {
        await auth.getUserByEmail(input.email);
      } catch (e: any) {
        if (e.code === "auth/user-not-found") {
          await auth.createUser({
            email: input.email,
            displayName: input.name || undefined,
          });
        }
      }
      
      // Generate password reset link so they can log in
      const link = await auth.generatePasswordResetLink(input.email, {
        url: `${SITE()}/account`,
      });
      loginHtml = link;
    } catch (err) {
      console.error("[sendWelcome] Failed to generate auth link", err);
    }
  }

  const subject = "Welcome to Duti Heritage";
  const body =
    emailEyebrow("You're in") +
    emailLead(
      `Hi ${escHtml(name)},<br/><br/>Welcome to Duti Heritage — handcrafted pieces made with care in India. Enjoy <strong>10% off</strong> your first order.`
    ) +
    emailPromoCode("WELCOME10", "Your welcome code") +
    (loginHtml
      ? emailNote(
          `To track orders, <a href="${escHtml(loginHtml)}" style="color:#1a1a1a;font-weight:600;">set your password here</a>.`
        )
      : "");
  const text = `Hi ${name}, Welcome to Duti Heritage. Use code WELCOME10 for 10% off your first order.`;
  const wa = `Welcome to Duti Heritage! Use code WELCOME10 for 10% off your first order. Shop: ${SITE()}`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, body, {
      preheader: "10% off your first order with WELCOME10",
      primaryCta: { label: "Shop the collection", href: SITE() },
      secondaryCta: { label: "Your account", href: `${SITE()}/account` },
      kind: "marketing",
    }),
    text,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_WELCOME,
    waParams: [name, "WELCOME10"],
    emailType: "auth",
  });

  if (!result.emailOk && !result.waOk) {
    await markAutomationFailed("welcome", "default", key, result.detail);
  }
  return { sent: true, detail: result.detail };
}

export async function sendOrderPlaced(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  orderId: string;
  total: number;
  customerId?: string;
}) {
  if (!(await isFlowEnabled("order_placed"))) return { sent: false, reason: "disabled" };
  const key = `${input.orderId}:placed`;
  const claimed = await claimAutomationSend({
    flow: "order_placed",
    stage: "default",
    recipientKey: key,
    channel: "both",
    customerId: input.customerId,
    orderId: input.orderId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const name = input.name || "there";
  const subject = `We received your order ${input.orderId}`;
  const intro =
    emailEyebrow("Order placed") +
    `Hi ${escHtml(name)},<br/><br/>Thank you — we received your order <strong>${escHtml(input.orderId)}</strong> (₹${rupees(input.total)}). Our team will confirm and pack it with care.`;
  const nextStep =
    "We will email you when the order is confirmed. Tracking arrives after it ships.";
  const bodyHtml = await buildOrderEmailHtml(input.orderId, "Confirmed", intro, nextStep);

  const text = `Order ${input.orderId} placed. Total ₹${input.total}. Track at ${SITE()}/account`;
  const wa = `We received your order ${input.orderId}! Total ₹${input.total}. Track anytime from your account.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml, {
      preheader: `Order ${input.orderId} · ₹${rupees(input.total)}`,
      primaryCta: { label: "View order", href: `${SITE()}/account/orders` },
      secondaryCta: { label: "Shop more", href: SITE() },
    }),
    text,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_ORDER_PLACED,
    waParams: [name, input.orderId, String(input.total)],
    emailType: "orders",
  });
  return { sent: true, detail: result.detail };
}

export async function sendAdminNewOrderAlert(orderId: string) {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return;

  await connectDB();
  const order = await Order.findOne({ orderId }).lean() as any;
  if (!order) return;

  const emails = adminEmails.split(",").map(e => e.trim()).filter(Boolean);
  if (emails.length === 0) return;

  const total = Number(order.total ?? order.totalAmount ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? 0);
  const shipping = Number(order.shipping ?? 0);
  const customer = order.customer || {};
  const mongoId = order._id?.toString?.() || orderId;
  const subject = `New order received: ${orderId} (₹${rupees(total)})`;
  const invoiceLink = `${SITE()}/admin/orders/${mongoId}/invoice`;
  const adminOrderLink = `${SITE()}/admin/orders/${mongoId}`;
  
  let itemsHtml = `<table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 8px;border-top:1px solid #e8e4df;">`;
  (order.items || []).forEach(
    (item: {
      name?: string;
      size?: string;
      quantity?: number;
      price?: number;
      salePrice?: number | null;
    }) => {
      const qty = Number(item.quantity) || 0;
      const line = lineUnit(item) * qty;
      itemsHtml += `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e8e4df;font-size:14px;">${esc(item.name)}${item.size ? ` <span style="color:#6b6560;">· ${esc(item.size)}</span>` : ""}</td>
        <td align="center" style="padding:12px 8px;border-bottom:1px solid #e8e4df;color:#6b6560;">×${qty}</td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #e8e4df;font-weight:600;">₹${rupees(line)}</td>
      </tr>`;
    }
  );
  itemsHtml += `</table>`;

  const couponText =
    discount > 0
      ? emailNote(
          `Coupon${order.couponCode ? ` <strong>${esc(order.couponCode)}</strong>` : ""} · discount ₹${rupees(discount)}`
        )
      : "";

  const addressLine = [
    customer.address,
    customer.apartment,
    [customer.city, customer.state].filter(Boolean).join(", "),
    customer.pinCode,
  ]
    .filter(Boolean)
    .join(", ");

  const html = emailLayout(
    subject,
    emailEyebrow("New order") +
      emailLead(
        `Placed by <strong>${esc(customer.name || "Customer")}</strong>.`
      ) +
      emailMetricRow([
        { label: "Order", value: orderId },
        {
          label: "Payment",
          value: PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod || "—",
        },
        { label: "Total", value: `₹${rupees(total)}` },
        ...(shipping
          ? [{ label: "Shipping", value: `₹${rupees(shipping)}` }]
          : []),
      ]) +
      couponText +
      itemsHtml +
      emailNote(
        `<strong style="letter-spacing:1px;text-transform:uppercase;font-size:11px;color:#6b6560;">Ship to</strong><br/>${esc(customer.name || "—")}<br/>${esc(addressLine || "—")}<br/>${esc(customer.phone || "—")}<br/>${esc(customer.email || "")}`
      ) +
      `<p style="margin:20px 0 0;">${emailButton("Print invoice", invoiceLink)}${"&nbsp;".repeat(2)}${emailButton("Manage order", adminOrderLink, "outline")}</p>`,
    {
      kind: "staff",
      hideDefaultCtas: true,
      primaryCta: { label: "Open in admin", href: adminOrderLink },
      preheader: `${orderId} · ₹${rupees(total)} · ${customer.name || "Customer"}`,
    }
  );

  for (const email of emails) {
    try {
      await sendEmail({
        to: email,
        subject,
        html,
        type: "orders",
      });
    } catch (err) {
      console.error("[admin_alert] Failed to send to", email, err);
    }
  }
}

export async function sendOrderConfirmed(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  orderId: string;
  total: number;
  customerId?: string;
}) {
  const name = input.name || "there";
  const subject = `Order ${input.orderId} is confirmed`;
  const intro =
    emailEyebrow("Confirmed") +
    `Hi ${escHtml(name)},<br/><br/>Good news — we have confirmed your order <strong>${escHtml(input.orderId)}</strong> (₹${rupees(input.total)}). We will pack it next.`;
  const nextStep =
    "You will receive tracking details by email after we hand it to the courier.";
  const bodyHtml = await buildOrderEmailHtml(
    input.orderId,
    "Confirmed",
    intro,
    nextStep
  );
  const wa = `Your order ${input.orderId} is confirmed. Total ₹${input.total}. We will share tracking once it ships.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml, {
      preheader: `Confirmed · ${input.orderId}`,
      primaryCta: { label: "Track order", href: `${SITE()}/account/orders` },
    }),
    text: `Order ${input.orderId} confirmed. Total ₹${input.total}.`,
    waMessage: wa,
    emailType: "orders",
  });
  return { sent: true, detail: result.detail };
}

export async function sendOrderOnHold(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  orderId: string;
  reason?: string;
  customerId?: string;
}) {
  const name = input.name || "there";
  const subject = `Order ${input.orderId} is on hold`;
  const body =
    emailEyebrow("On hold") +
    emailLead(
      `Hi ${escHtml(name)},<br/><br/>Your order <strong>${escHtml(input.orderId)}</strong> is temporarily on hold.`
    ) +
    emailNote(
      input.reason
        ? `<strong>Reason:</strong> ${escHtml(input.reason)}`
        : "Our team is reviewing a few details before we continue."
    ) +
    `<p style="margin:0;font-size:14px;color:#6b6560;">We will update you as soon as it moves forward.</p>`;
  const html = emailLayout(subject, body, {
    preheader: `Order ${input.orderId} paused`,
    primaryCta: { label: "View order", href: `${SITE()}/account/orders` },
  });
  const wa = `Your order ${input.orderId} is on hold${input.reason ? `: ${input.reason}` : ""}. We will update you shortly.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html,
    text: `Order ${input.orderId} is on hold. ${input.reason || ""}`.trim(),
    waMessage: wa,
    emailType: "orders",
  });
  return { sent: true, detail: result.detail };
}

export async function sendOrderShipped(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  orderId: string;
  trackingUrl?: string | null;
  courier?: string | null;
  awb?: string | null;
  customerId?: string;
}) {
  if (!(await isFlowEnabled("order_shipped"))) return { sent: false, reason: "disabled" };
  const key = `${input.orderId}:shipped`;
  const claimed = await claimAutomationSend({
    flow: "order_shipped",
    stage: "default",
    recipientKey: key,
    channel: "both",
    customerId: input.customerId,
    orderId: input.orderId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const track =
    input.trackingUrl ||
    (input.awb ? `AWB ${input.awb}` : `${SITE()}/account`);
  const courier = input.courier ? ` via ${input.courier}` : "";
  const subject = `Order ${input.orderId} has shipped`;
  const trackHref = input.trackingUrl || `${SITE()}/account/orders`;
  const intro =
    emailEyebrow("On the way") +
    `Great news — your order <strong>${escHtml(input.orderId)}</strong> has been shipped${escHtml(courier)}.`;
  const nextStep = `Track your package: <a href="${escHtml(trackHref)}" style="color:#1a1a1a;font-weight:600;">${escHtml(String(track))}</a>`;
  const bodyHtml = await buildOrderEmailHtml(input.orderId, "Shipped", intro, nextStep);

  const wa = `Your order ${input.orderId} has shipped${courier}! Track: ${track}`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml, {
      preheader: `Shipped${courier} · ${input.orderId}`,
      primaryCta: { label: "Track shipment", href: trackHref },
      secondaryCta: { label: "Your account", href: `${SITE()}/account` },
    }),
    text: `Order ${input.orderId} shipped${courier}. Track: ${track}`,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_ORDER_SHIPPED,
    waParams: [input.orderId, input.courier || "courier", track],
    emailType: "orders",
  });
  return { sent: true, detail: result.detail };
}

export async function sendOrderDelivered(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  orderId: string;
  customerId?: string;
}) {
  if (!(await isFlowEnabled("order_delivered"))) return { sent: false, reason: "disabled" };
  const key = `${input.orderId}:delivered`;
  const claimed = await claimAutomationSend({
    flow: "order_delivered",
    stage: "instant",
    recipientKey: key,
    channel: "both",
    customerId: input.customerId,
    orderId: input.orderId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const subject = `Order ${input.orderId} delivered`;
  const intro =
    emailEyebrow("Delivered") +
    `Your order <strong>${escHtml(input.orderId)}</strong> has been delivered. We hope you love it.`;
  const nextStep = `When you are ready, <a href="${SITE()}/account" style="color:#1a1a1a;font-weight:600;">leave a review</a> — it helps other shoppers and earns love for your next order.`;
  const bodyHtml = await buildOrderEmailHtml(input.orderId, "Delivered", intro, nextStep);

  const wa = `Your order ${input.orderId} has been delivered! Enjoy — leave a review from your account when ready.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml, {
      preheader: `Delivered · ${input.orderId}`,
      primaryCta: { label: "Leave a review", href: `${SITE()}/account` },
      secondaryCta: { label: "Shop again", href: SITE() },
    }),
    text: `Order ${input.orderId} delivered. Leave a review from your account.`,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_ORDER_DELIVERED,
    waParams: [input.orderId],
    emailType: "orders",
  });
  return { sent: true, detail: result.detail };
}

export async function sendOrderCancelled(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  orderId: string;
  total: number;
  customerId?: string;
  paymentMethod?: string | null;
  /** Amount actually refunded / recorded in this cancel flow */
  refundAmount?: number | null;
  refundChannel?: "razorpay" | "manual" | "cod_note" | null;
}) {
  const name = input.name || "there";
  const subject = `Order ${input.orderId} Cancelled`;
  const method = String(input.paymentMethod || "").toLowerCase();
  const refundAmt = Number(input.refundAmount || 0);
  const channel = input.refundChannel || null;

  let moneyHtml: string;
  let textExtra: string;
  let waExtra: string;

  if (method === "cod") {
    moneyHtml = emailNote(
      "This was cash on delivery. No online payment was collected, so <strong>there is no bank refund</strong> — only the order is cancelled."
    );
    textExtra = "COD order — no bank refund (status only).";
    waExtra = "COD order cancelled — no online payment to refund.";
  } else if (channel === "razorpay" && refundAmt > 0) {
    moneyHtml = emailNote(
      `We started a refund of <strong>₹${rupees(refundAmt)}</strong> via Razorpay to your original payment method. It usually appears in 5–7 business days.`
    );
    textExtra = `Refund of ₹${rupees(refundAmt)} started via Razorpay (5–7 days).`;
    waExtra = `Refund of ₹${rupees(refundAmt)} started to your original payment method.`;
  } else if (channel === "manual" && refundAmt > 0) {
    moneyHtml = emailNote(
      `Staff recorded a refund of <strong>₹${rupees(refundAmt)}</strong> outside Razorpay (cash, UPI, or bank). Write to support if you do not see it.`
    );
    textExtra = `Refund of ₹${rupees(refundAmt)} recorded by staff (outside Razorpay).`;
    waExtra = `Refund of ₹${rupees(refundAmt)} recorded by our team.`;
  } else if (method === "prepaid" || method === "partial") {
    moneyHtml = emailNote(
      "If you paid online, our team will process the refund. Amounts usually return in 5–7 business days."
    );
    textExtra = "If you paid online, a refund will be processed in 5–7 days.";
    waExtra = "If you prepaid, your refund will be processed shortly.";
  } else {
    moneyHtml = emailNote("If you paid for this order, our team will handle any refund separately.");
    textExtra = "Any refund will be handled by our team.";
    waExtra = "Any refund will be handled separately.";
  }

  const bodyHtml =
    emailEyebrow("Cancelled") +
    emailLead(
      `Hi ${esc(name)},<br/><br/>Your order <strong>${esc(input.orderId)}</strong> has been cancelled.`
    ) +
    moneyHtml +
    `<p style="margin:0;font-size:13px;color:#6b6560;">If you did not ask for this, reply to this email or write to support.</p>`;

  const text = `Order ${input.orderId} cancelled. ${textExtra}`;
  const wa = `Your order ${input.orderId} has been cancelled. ${waExtra}`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml, {
      preheader: `Order ${input.orderId} cancelled`,
      primaryCta: { label: "Continue shopping", href: SITE() },
      secondaryCta: { label: "Your account", href: `${SITE()}/account` },
    }),
    text,
    waMessage: wa,
    emailType: "orders",
  });
  return { sent: true, detail: result.detail };
}

async function staffAlertRecipients(): Promise<string[]> {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  try {
    const { getStoreSettings } = await import("@/lib/store-settings");
    const store = await getStoreSettings();
    const support = String(store.supportEmail || "").trim();
    if (support && support.includes("@")) fromEnv.push(support);
  } catch {
    /* ignore */
  }
  return [...new Set(fromEnv.map((e) => e.toLowerCase()))];
}

/** Email staff when a customer requests prepaid/partial cancellation */
export async function sendAdminCancelRequestAlert(input: {
  orderId: string;
  reason: string;
  customerName?: string | null;
  customerEmail?: string | null;
  total: number;
  paymentMethod?: string | null;
}) {
  const emails = await staffAlertRecipients();
  if (emails.length === 0) {
    console.info("[cancel-request] no ADMIN_EMAILS / supportEmail — skip staff alert");
    return { sent: false, reason: "no_recipients" as const };
  }

  const subject = `Cancel request: ${input.orderId}`;
  const adminLink = `${SITE()}/admin/orders/${encodeURIComponent(input.orderId)}`;
  const html = emailLayout(
    subject,
    emailEyebrow("Action needed") +
      emailLead(
        `A customer asked to cancel a <strong>${esc(input.paymentMethod || "prepaid")}</strong> order.`
      ) +
      emailMetricRow([
        { label: "Order", value: input.orderId },
        { label: "Total", value: `₹${rupees(input.total)}` },
        {
          label: "Customer",
          value: `${input.customerName || "—"} ${input.customerEmail || ""}`.trim(),
        },
      ]) +
      emailNote(`<strong>Reason:</strong> ${esc(input.reason)}`),
    {
      kind: "staff",
      hideDefaultCtas: true,
      primaryCta: { label: "Review in admin", href: adminLink },
      preheader: `Cancel request · ${input.orderId}`,
    }
  );

  const results = await Promise.all(
    emails.map((to) =>
      sendEmail({ to, subject, html, type: "orders" }).catch((e) => {
        console.error("[cancel-request] staff email", to, e);
        return { ok: false as const };
      })
    )
  );
  return { sent: results.some((r) => r.ok), count: emails.length };
}

export async function sendCancelRequestDeclined(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  orderId: string;
  reason: string;
  customerId?: string;
}) {
  const name = input.name || "there";
  const subject = `Cancellation request declined — ${input.orderId}`;
  const bodyHtml =
    emailEyebrow("Still active") +
    emailLead(
      `Hi ${esc(name)},<br/><br/>We reviewed your request to cancel order <strong>${esc(input.orderId)}</strong> and cannot cancel it at this time.`
    ) +
    emailNote(`<strong>Reason:</strong> ${esc(input.reason)}`) +
    `<p style="margin:0;font-size:14px;color:#6b6560;">Your order is still active. Reply to this email if you need help.</p>`;
  const text = `Cancellation of ${input.orderId} was declined. Reason: ${input.reason}`;
  const wa = `We could not cancel order ${input.orderId}. Reason: ${input.reason}`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml, {
      preheader: `We could not cancel ${input.orderId}`,
      primaryCta: { label: "View order", href: `${SITE()}/account/orders` },
    }),
    text,
    waMessage: wa,
    emailType: "orders",
  });
  return { sent: true, detail: result.detail };
}

export async function sendCartAbandoned(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  stage: "1h" | "24h" | "72h";
  cartId: string;
  customerId?: string;
  itemSummary?: string;
}) {
  if (!(await isFlowEnabled("cart_abandoned"))) return { sent: false, reason: "disabled" };
  const key = (input.email || input.phone || input.cartId).toLowerCase();
  const claimed = await claimAutomationSend({
    flow: "cart_abandoned",
    stage: input.stage,
    recipientKey: key,
    channel: "both",
    customerId: input.customerId,
    cartId: input.cartId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const cartUrl = `${SITE()}/checkout`;
  const items = escHtml(input.itemSummary || "your items");
  const name = escHtml(input.name || "there");

  const copy = {
    "1h": {
      subject: "You left something behind",
      body:
        emailEyebrow("Your cart") +
        emailLead(
          `Hi ${name},<br/><br/>Your bag is still waiting with ${items}.`
        ) +
        emailNote("Complete checkout before sizes sell out."),
      wa: `You left something behind! Your cart is waiting — ${cartUrl}`,
    },
    "24h": {
      subject: "Still thinking?",
      body:
        emailEyebrow("Still available") +
        emailLead(
          `Hi ${name},<br/><br/>Your items are still available: ${items}.`
        ),
      wa: `Still thinking? Your items are selling fast — ${cartUrl}`,
    },
    "72h": {
      subject: "Last chance — 5% off",
      body:
        emailEyebrow("A little nudge") +
        emailLead(
          `Hi ${name},<br/><br/>Complete your order with 5% off.`
        ) +
        emailPromoCode("COMEBACK5", "Use this code at checkout"),
      wa: `Last chance! Use COMEBACK5 for 5% off — ${cartUrl}`,
    },
  }[input.stage];

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject: copy.subject,
    html: emailLayout(copy.subject, copy.body, {
      kind: "marketing",
      preheader: copy.subject,
      primaryCta: { label: "Return to cart", href: cartUrl },
      secondaryCta: { label: "Keep browsing", href: SITE() },
    }),
    text: copy.wa,
    waMessage: copy.wa,
    waTemplate: process.env.WA_TEMPLATE_CART_ABANDONED,
    waParams: [input.stage, cartUrl],
    emailType: "marketing",
  });
  return { sent: true, detail: result.detail };
}

export async function sendReviewReminder(input: {
  email?: string | null;
  phone?: string | null;
  orderId: string;
  customerId?: string;
}) {
  if (!(await isFlowEnabled("post_purchase_review")))
    return { sent: false, reason: "disabled" };
  const key = `${input.orderId}:review_3d`;
  const claimed = await claimAutomationSend({
    flow: "post_purchase_review",
    stage: "3d",
    recipientKey: key,
    channel: "email",
    customerId: input.customerId,
    orderId: input.orderId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const subject = "How was your experience?";
  const body =
    emailEyebrow("A quick ask") +
    emailLead(
      `Order <strong>${escHtml(input.orderId)}</strong> — we would love a short review.`
    ) +
    emailNote("Leave one from your account and enjoy ₹100 off your next order.");
  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, body, {
      kind: "marketing",
      preheader: "Share a review · ₹100 off next order",
      primaryCta: { label: "Leave a review", href: `${SITE()}/account` },
    }),
    text: `How was order ${input.orderId}? Leave a review from your account.`,
    waMessage: `How was your Duti Heritage order ${input.orderId}? Leave a review from your account.`,
    emailType: "marketing",
  });
  return { sent: true, detail: result.detail };
}

export async function sendWinback(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  stage: "30d" | "60d";
  customerId: string;
}) {
  if (!(await isFlowEnabled("winback"))) return { sent: false, reason: "disabled" };
  const key = input.customerId;
  const claimed = await claimAutomationSend({
    flow: "winback",
    stage: input.stage,
    recipientKey: key,
    channel: "both",
    customerId: input.customerId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const name = escHtml(input.name || "there");
  const copy =
    input.stage === "30d"
      ? {
          subject: "We miss you at Duti Heritage",
          body:
            emailEyebrow("Come say hello") +
            emailLead(
              `Hi ${name}, it has been a while — the latest pieces are waiting.`
            ),
          wa: `We miss you! Here's what's new at Duti Heritage — ${SITE()}`,
          code: undefined as string | undefined,
        }
      : {
          subject: "Come back with 15% off",
          body:
            emailEyebrow("A gift for you") +
            emailLead(`Hi ${name}, it has been a while. Enjoy <strong>15% off</strong>.`) +
            emailPromoCode("MISSYOU15", "Your win-back code"),
          wa: `It's been a while! Come back with 15% off — code MISSYOU15 ${SITE()}`,
          code: "MISSYOU15",
        };

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject: copy.subject,
    html: emailLayout(copy.subject, copy.body, {
      kind: "marketing",
      preheader: copy.subject,
      primaryCta: { label: "Explore the latest", href: SITE() },
    }),
    text: copy.wa,
    waMessage: copy.wa,
    waTemplate: process.env.WA_TEMPLATE_WINBACK,
    waParams: [input.name || "friend", copy.code || ""],
    emailType: "marketing",
  });
  return { sent: true, detail: result.detail };
}

// ─── Email HTML Helpers ──────────────────────────────────────────────

async function buildOrderEmailHtml(
  orderId: string,
  highlightStep: "Confirmed" | "Shipped" | "Delivered",
  introText: string,
  nextStepText: string
): Promise<string> {
  await connectDB();
  const order = await Order.findOne({ orderId }).lean() as any;
  if (!order) return introText;

  const steps = ["Confirmed", "Shipped", "Delivered"];
  const currentIndex = steps.indexOf(highlightStep);

  let trackerHtml = `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 28px;"><tr>`;
  steps.forEach((step, idx) => {
    const isCompleted = idx <= currentIndex;
    const isCurrent = idx === currentIndex;
    const color = isCompleted ? "#1a1a1a" : "#e8e4df";
    const textColor = isCompleted ? "#1a1a1a" : "#6b6560";
    const icon = isCompleted ? "●" : "○";
    const weight = isCurrent ? "700" : "400";

    trackerHtml += `
      <td align="center" style="font-family:Georgia,Helvetica,Arial,sans-serif;font-size:11px;width:33.33%;">
        <div style="font-size:18px;margin-bottom:8px;color:${color};line-height:1;">${icon}</div>
        <div style="font-weight:${weight};text-transform:uppercase;letter-spacing:1.5px;color:${textColor};">${step}</div>
      </td>`;
  });
  trackerHtml += `</tr></table>`;

  const nextStepHtml = nextStepText
    ? `<div style="background:#f0ebe3;padding:16px 18px;border-left:3px solid #8b6914;font-family:Georgia,Helvetica,Arial,sans-serif;font-size:14px;margin-bottom:28px;line-height:1.55;color:#1a1a1a;">
        <strong style="text-transform:uppercase;font-size:11px;letter-spacing:2px;color:#6b6560;display:block;margin-bottom:6px;font-weight:600;">Next step</strong>
        ${nextStepText}
       </div>`
    : "";

  let itemsHtml = `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:Outfit,Helvetica,Arial,sans-serif;font-size:14px;margin-bottom:24px;border-top:1px solid #e0e0e0;">`;
  
  if (order.items && order.items.length) {
    order.items.forEach((item: { name?: string; image?: string; quantity?: number; size?: string; price?: number; salePrice?: number | null }) => {
      const qty = Number(item.quantity) || 0;
      const line = lineUnit(item) * qty;
      const img = item.image ? `<img src="${esc(item.image)}" width="60" height="80" alt="" style="object-fit:cover;display:block;background:#f5f5f5;" />` : "";
      itemsHtml += `
        <tr>
          <td width="70" style="padding:16px 0;border-bottom:1px solid #e0e0e0;vertical-align:top;">${img}</td>
          <td style="padding:16px 12px;border-bottom:1px solid #e0e0e0;vertical-align:top;">
            <div style="font-family:'Times New Roman',Times,Georgia,serif;font-size:15px;letter-spacing:0.5px;margin-bottom:4px;color:#000000;">${esc(item.name)}</div>
            <div style="color:#6b6b6b;font-size:12px;font-weight:300;">Qty: ${qty}${item.size ? ` · Size: ${esc(item.size)}` : ""}</div>
          </td>
          <td align="right" style="padding:16px 0;border-bottom:1px solid #e0e0e0;vertical-align:top;font-weight:500;color:#000000;">₹${rupees(line)}</td>
        </tr>
      `;
    });
  }
  itemsHtml += `</table>`;

  const c = order.customer || {};
  const addressHtml = [
    esc(c.name),
    esc(c.address),
    c.apartment ? esc(c.apartment) : "",
    esc([c.city, c.state, c.pinCode].filter(Boolean).join(", ")),
    c.phone ? esc(c.phone) : "",
  ].filter(Boolean).join("<br/>");

  const subtotal = Number(order.subtotal ?? order.total ?? 0);
  const shipping = Number(order.shipping ?? 0);
  const discount = Number(order.discount ?? 0);
  const total = Number(order.total ?? 0);

  return `
    <div style="font-family:Outfit,Helvetica,Arial,sans-serif;font-weight:300;line-height:1.65;font-size:15px;color:#333333;">
      ${introText}
    </div>
    
    ${trackerHtml}
    ${nextStepHtml}
    
    <div style="background:#ffffff;padding:0;border:1px solid #e0e0e0;">
      <div style="padding:18px 20px;border-bottom:1px solid #e0e0e0;">
        <h3 style="font-family:Outfit,Helvetica,Arial,sans-serif;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:2px;margin:0;color:#6b6b6b;">Order summary</h3>
      </div>
      <div style="padding:0 20px;">
        ${itemsHtml}
      </div>
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family:Outfit,Helvetica,Arial,sans-serif;font-size:14px;border-top:1px solid #e0e0e0;">
        <tr>
          <td width="50%" valign="top" style="padding:18px 20px;border-right:1px solid #e0e0e0;">
            <strong style="text-transform:uppercase;font-size:11px;letter-spacing:2px;color:#6b6b6b;display:block;margin-bottom:8px;font-weight:500;">Shipping to</strong>
            <div style="color:#333333;line-height:1.55;font-weight:300;">${addressHtml || "—"}</div>
          </td>
          <td width="50%" valign="top" style="padding:18px 20px;">
             <table width="100%" border="0" cellpadding="0" cellspacing="0">
               <tr>
                 <td align="right" style="padding-bottom:8px;color:#6b6b6b;font-weight:300;">Subtotal</td>
                 <td align="right" width="80" style="color:#000000;">₹${rupees(subtotal)}</td>
               </tr>
               ${discount > 0 ? `<tr>
                 <td align="right" style="padding-bottom:8px;color:#6b6b6b;font-weight:300;">Discount</td>
                 <td align="right" width="80" style="color:#000000;">−₹${rupees(discount)}</td>
               </tr>` : ""}
               <tr>
                 <td align="right" style="padding-bottom:8px;color:#6b6b6b;font-weight:300;">Shipping</td>
                 <td align="right" width="80" style="color:#000000;">${shipping > 0 ? `₹${rupees(shipping)}` : "Free"}</td>
               </tr>
               <tr>
                 <td align="right" style="padding-top:10px;border-top:1px solid #e0e0e0;font-weight:500;letter-spacing:1px;text-transform:uppercase;font-size:12px;">Total</td>
                 <td align="right" width="80" style="padding-top:10px;border-top:1px solid #e0e0e0;font-weight:600;">₹${rupees(total)}</td>
               </tr>
             </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendWishlistReminder(input: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  stage: "3d" | "7d";
  productId: string;
  productName: string;
  productSlug: string;
  customerId?: string;
}) {
  if (!(await isFlowEnabled("wishlist_reminder"))) return { sent: false, reason: "disabled" };
  const key = (input.email || input.phone || input.productId).toLowerCase();
  const claimed = await claimAutomationSend({
    flow: "wishlist_reminder",
    stage: input.stage,
    recipientKey: key,
    channel: "both",
    customerId: input.customerId,
  });
  if (!claimed) return { sent: false, reason: "already_sent" };

  const url = `${SITE()}/products/${input.productSlug}`;

  const pname = escHtml(input.productName);
  const copy = {
    "3d": {
      subject: `Still eyeing ${input.productName}?`,
      body:
        emailEyebrow("Wishlist") +
        emailLead(`Your saved piece <strong>${pname}</strong> is still waiting.`) +
        emailNote("Sizes move quickly — claim it while it is in stock."),
      wa: `Still eyeing ${input.productName}? It's waiting for you — ${url}`,
    },
    "7d": {
      subject: `Your wishlist is running low`,
      body:
        emailEyebrow("Almost gone") +
        emailLead(`Your wishlisted <strong>${pname}</strong> is selling fast.`) +
        emailNote("Grab it before the last sizes go."),
      wa: `Your wishlisted ${input.productName} is running low — ${url}`,
    },
  }[input.stage];

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject: copy.subject,
    html: emailLayout(copy.subject, copy.body, {
      kind: "marketing",
      preheader: copy.subject,
      primaryCta: { label: "View product", href: url },
      secondaryCta: { label: "Wishlist", href: `${SITE()}/account/wishlist` },
    }),
    text: copy.wa,
    waMessage: copy.wa,
    waTemplate: process.env.WA_TEMPLATE_WISHLIST_REMINDER,
    waParams: [input.stage, url],
    emailType: "marketing",
  });
  return { sent: true, detail: result.detail };
}
