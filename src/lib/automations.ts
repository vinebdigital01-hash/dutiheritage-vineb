import { connectDB } from "@/lib/mongodb";
import {
  AutomationLog,
  AutomationSettings,
  type AutomationFlowKey,
} from "@/models";
import { sendEmail, emailLayout, isEmailConfigured } from "@/lib/email";
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp";

const SITE = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://dutiheritage.com";

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
    });
    emailOk = r.ok;
    parts.push(r.skipped ? "email:skipped" : r.ok ? "email:sent" : `email:${r.error}`);
  } else if (input.email) {
    const r = await sendEmail({
      to: input.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
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
  const subject = "Welcome to Duti Heritage";
  const body = `Hi ${name},<br/><br/>Welcome to Duti Heritage. Enjoy <strong>10% off</strong> your first order with code <strong>WELCOME10</strong>.`;
  const text = `Hi ${name}, Welcome to Duti Heritage. Use code WELCOME10 for 10% off your first order.`;
  const wa = `Welcome to Duti Heritage! Use code WELCOME10 for 10% off your first order. Shop: ${SITE()}`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, body),
    text,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_WELCOME,
    waParams: [name, "WELCOME10"],
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
  const subject = `Order ${input.orderId} confirmed`;
  const body = `Hi ${name},<br/><br/>Your order <strong>${input.orderId}</strong> is confirmed (₹${input.total}). We're preparing it with care.<br/><br/><a href="${SITE()}/account">Track your order</a>`;
  const text = `Order ${input.orderId} confirmed. Total ₹${input.total}. Track at ${SITE()}/account`;
  const wa = `Your order ${input.orderId} is confirmed! ✅ Total ₹${input.total}. Track anytime from your account.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, body),
    text,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_ORDER_PLACED,
    waParams: [name, input.orderId, String(input.total)],
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
  const body = `Your order <strong>${input.orderId}</strong> is on the way${courier}.<br/><br/>Track: <a href="${input.trackingUrl || SITE() + "/account"}">${track}</a>`;
  const wa = `Your order ${input.orderId} has shipped${courier}! 📦 Track: ${track}`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, body),
    text: `Order ${input.orderId} shipped${courier}. Track: ${track}`,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_ORDER_SHIPPED,
    waParams: [input.orderId, input.courier || "courier", track],
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
  const body = `Your order <strong>${input.orderId}</strong> has been delivered. We hope you love it!<br/><br/><a href="${SITE()}/account">Leave a review</a> when you're ready.`;
  const wa = `Your order ${input.orderId} has been delivered! 🎁 Enjoy — and leave a review from your account when ready.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, body),
    text: `Order ${input.orderId} delivered. Leave a review from your account.`,
    waMessage: wa,
    waTemplate: process.env.WA_TEMPLATE_ORDER_DELIVERED,
    waParams: [input.orderId],
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
  const items = input.itemSummary || "your items";

  const copy = {
    "1h": {
      subject: "You left something behind",
      body: `Your cart is waiting with ${items}. <a href="${cartUrl}">Complete your order</a>`,
      wa: `You left something behind! Your cart is waiting 🛒 ${cartUrl}`,
    },
    "24h": {
      subject: "Still thinking?",
      body: `Your items are still available: ${items}. <a href="${cartUrl}">Checkout now</a>`,
      wa: `Still thinking? Your items are selling fast ⚡ ${cartUrl}`,
    },
    "72h": {
      subject: "Last chance — 5% off",
      body: `Complete your order with code <strong>COMEBACK5</strong> for 5% off. <a href="${cartUrl}">Return to cart</a>`,
      wa: `Last chance! Use COMEBACK5 for 5% off — ${cartUrl}`,
    },
  }[input.stage];

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject: copy.subject,
    html: emailLayout(copy.subject, copy.body),
    text: copy.wa,
    waMessage: copy.wa,
    waTemplate: process.env.WA_TEMPLATE_CART_ABANDONED,
    waParams: [input.stage, cartUrl],
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
  const body = `Order <strong>${input.orderId}</strong> — we'd love a review. Leave one from your account and enjoy ₹100 off your next order.`;
  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, body),
    text: `How was order ${input.orderId}? Leave a review from your account.`,
    waMessage: `How was your Duti Heritage order ${input.orderId}? Leave a review from your account 💫`,
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

  const copy =
    input.stage === "30d"
      ? {
          subject: "We miss you at Duti Heritage",
          body: `Hi ${input.name || "there"}, it's been a while — here's what's new. <a href="${SITE()}">Explore the latest</a>`,
          wa: `We miss you! Here's what's new at Duti Heritage 🌟 ${SITE()}`,
          code: undefined as string | undefined,
        }
      : {
          subject: "Come back with 15% off",
          body: `It's been a while. Enjoy <strong>15% off</strong> with code <strong>MISSYOU15</strong>. <a href="${SITE()}">Shop now</a>`,
          wa: `It's been a while! Come back with 15% off — code MISSYOU15 ${SITE()}`,
          code: "MISSYOU15",
        };

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject: copy.subject,
    html: emailLayout(copy.subject, copy.body),
    text: copy.wa,
    waMessage: copy.wa,
    waTemplate: process.env.WA_TEMPLATE_WINBACK,
    waParams: [input.name || "friend", copy.code || ""],
  });
  return { sent: true, detail: result.detail };
}
