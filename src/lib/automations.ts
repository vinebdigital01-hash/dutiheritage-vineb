import { connectDB } from "@/lib/mongodb";
import {
  AutomationLog,
  AutomationSettings,
  Order,
  type AutomationFlowKey,
} from "@/models";
import { sendEmail, emailLayout, isEmailConfigured } from "@/lib/email";
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp";

const SITE = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://dutiheritage.co.in";

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
      const link = await auth.generatePasswordResetLink(input.email);
      loginHtml = `<br/><br/>To access your account and track orders, please <a href="${link}">click here to set your password</a>.`;
    } catch (err) {
      console.error("[sendWelcome] Failed to generate auth link", err);
    }
  }

  const subject = "Welcome to Duti Heritage";
  const body = `Hi ${name},<br/><br/>Welcome to Duti Heritage! Enjoy <strong>10% off</strong> your first order with code <strong>WELCOME10</strong>.${loginHtml}`;
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
    emailType: "auth", // Use auth Resend key
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
  const subject = `Order ${input.orderId} Confirmed`;
  const intro = `Hi ${name},<br/><br/>Your order <strong>${input.orderId}</strong> is confirmed (₹${input.total}). We're preparing it with care.`;
  const nextStep = "We are currently packing your items. You will receive another email with tracking details once your order has been shipped.";
  const bodyHtml = await buildOrderEmailHtml(input.orderId, "Confirmed", intro, nextStep);

  const text = `Order ${input.orderId} confirmed. Total ₹${input.total}. Track at ${SITE()}/account`;
  const wa = `Your order ${input.orderId} is confirmed! ✅ Total ₹${input.total}. Track anytime from your account.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml),
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

  const subject = `🚨 New Order Received: ${orderId} (₹${order.totalAmount})`;
  const invoiceLink = `${SITE()}/admin/orders/${orderId}/invoice`;
  const adminOrderLink = `${SITE()}/admin/orders/${orderId}`;
  
  let itemsHtml = `<table width="100%" border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; border-color: #ddd; font-family: sans-serif; font-size: 14px;">
    <tr style="background: #f9f9f9;">
      <th align="left">Item</th>
      <th align="center">Qty</th>
      <th align="right">Price</th>
    </tr>`;
  
  order.items.forEach((item: any) => {
    itemsHtml += `
      <tr>
        <td>${item.name} ${item.size ? `(Size: ${item.size})` : ""}</td>
        <td align="center">${item.quantity}</td>
        <td align="right">₹${item.price * item.quantity}</td>
      </tr>`;
  });
  itemsHtml += `</table>`;

  const couponText = order.discountAmount > 0 
    ? `<div style="color: #059669; font-weight: bold; margin-top: 10px;">Coupon Applied! Discount: ₹${order.discountAmount}</div>`
    : "";

  const html = emailLayout(subject, `
    <div style="font-family: sans-serif;">
      <p>A new order has just been placed by <strong>${order.customer.name}</strong>.</p>
      
      <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Order Summary</h2>
        <p><strong>Order ID:</strong> ${orderId}<br/>
        <strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}<br/>
        <strong>Total Amount:</strong> ₹${order.totalAmount}
        </p>
        
        ${couponText}
        <br/>
        
        ${itemsHtml}
        
        <h3 style="margin-top: 30px;">Customer Details</h3>
        <p>
          Name: ${order.customer.name}<br/>
          Email: ${order.customer.email || "N/A"}<br/>
          Phone: ${order.customer.phone}<br/>
          Address: ${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pinCode}
        </p>
      </div>

      <div style="margin-top: 30px;">
        <a href="${invoiceLink}" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">📄 View / Print Invoice</a>
        <a href="${adminOrderLink}" style="display: inline-block; border: 1px solid #1a1a1a; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Manage Order</a>
      </div>
    </div>
  `);

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
  const subject = `Order ${input.orderId} Has Shipped`;
  
  const intro = `Great news! Your order <strong>${input.orderId}</strong> has been shipped${courier}.`;
  const nextStep = `Your order is on its way to you! You can track your package here: <a href="${input.trackingUrl || SITE() + "/account"}">${track}</a>`;
  const bodyHtml = await buildOrderEmailHtml(input.orderId, "Shipped", intro, nextStep);

  const wa = `Your order ${input.orderId} has shipped${courier}! 📦 Track: ${track}`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml),
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

  const subject = `Order ${input.orderId} Delivered`;
  const intro = `Your order <strong>${input.orderId}</strong> has been delivered. We hope you love it!`;
  const nextStep = `Enjoy your purchase! <a href="${SITE()}/account">Leave a review</a> when you're ready and get rewarded for your next purchase.`;
  const bodyHtml = await buildOrderEmailHtml(input.orderId, "Delivered", intro, nextStep);

  const wa = `Your order ${input.orderId} has been delivered! 🎁 Enjoy — and leave a review from your account when ready.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml),
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
}) {
  const name = input.name || "there";
  const subject = `Order ${input.orderId} Cancelled`;
  
  // Create a simpler cancelled email template
  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="font-size: 24px; font-weight: normal; margin-bottom: 24px;">Order Cancelled</h2>
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
        Hi ${name},<br/><br/>
        We're writing to let you know that your order <strong>${input.orderId}</strong> has been cancelled.
      </p>
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
        If you have already paid for this order, the refund process will be initiated shortly and the amount (₹${input.total}) will reflect in your original payment method within 5-7 business days.
      </p>
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
        If you did not request this cancellation or have any questions, please reply to this email or contact our support team.
      </p>
      <a href="${SITE()}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 12px; border-radius: 4px;">Return to Store</a>
    </div>
  `;

  const text = `Order ${input.orderId} cancelled. If prepaid, refund will be processed in 5-7 days.`;
  const wa = `Your order ${input.orderId} has been cancelled. If you prepaid, your refund will be processed shortly.`;

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject,
    html: emailLayout(subject, bodyHtml),
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

  let trackerHtml = `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 30px 0;"><tr>`;
  steps.forEach((step, idx) => {
    const isCompleted = idx <= currentIndex;
    const isCurrent = idx === currentIndex;
    const color = isCompleted ? "#059669" : "#e5e7eb";
    const textColor = isCompleted ? "#064e3b" : "#9ca3af";
    const icon = isCompleted ? "✔" : "○";
    const weight = isCurrent ? "bold" : "normal";
    
    trackerHtml += `
      <td align="center" style="font-family: sans-serif; font-size: 11px; width: 33.33%;">
        <div style="font-size: 24px; margin-bottom: 8px; color: ${color};">${icon}</div>
        <div style="font-weight: ${weight}; text-transform: uppercase; letter-spacing: 1px; color: ${textColor};">${step}</div>
      </td>`;
  });
  trackerHtml += `</tr></table>`;

  const nextStepHtml = nextStepText 
    ? `<div style="background: #f7f5f2; padding: 16px; border-left: 4px solid #d4af37; font-family: sans-serif; font-size: 14px; margin-bottom: 30px; line-height: 1.5;">
        <strong style="text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #666; display: block; margin-bottom: 4px;">Next Step</strong>
        ${nextStepText}
       </div>` 
    : "";

  let itemsHtml = `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: sans-serif; font-size: 14px; margin-bottom: 30px; border-top: 1px solid #e5e7eb;">`;
  
  if (order.items && order.items.length) {
    order.items.forEach((item: any) => {
      const img = item.image ? `<img src="${item.image}" width="60" style="border-radius: 4px; object-fit: cover;" />` : "";
      itemsHtml += `
        <tr>
          <td width="70" style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">${img}</td>
          <td style="padding: 15px 10px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: bold; margin-bottom: 4px;">${item.name}</div>
            <div style="color: #666; font-size: 12px;">Qty: ${item.quantity} ${item.size ? `| Size: ${item.size}` : ""}</div>
          </td>
          <td align="right" style="padding: 15px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">₹${item.price * item.quantity}</td>
        </tr>
      `;
    });
  }
  itemsHtml += `</table>`;

  const addr = order.customer.address;
  const addressHtml = `${addr.firstName || ""} ${addr.lastName || ""}<br/>${addr.address}<br/>${addr.apartment ? addr.apartment + "<br/>" : ""}${addr.city}, ${addr.state} ${addr.pinCode}<br/>${addr.phone}`;

  return `
    <div style="font-family: Georgia, serif; line-height: 1.6; font-size: 16px;">
      ${introText}
    </div>
    
    ${trackerHtml}
    ${nextStepHtml}
    
    <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h3 style="font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 15px 0; color: #374151;">Order Summary</h3>
      ${itemsHtml}
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: sans-serif; font-size: 14px;">
        <tr>
          <td width="50%" valign="top" style="padding-right: 15px; border-right: 1px solid #e5e7eb;">
            <strong style="text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #6b7280; display: block; margin-bottom: 8px;">Shipping To</strong>
            <div style="color: #374151; line-height: 1.5;">${addressHtml}</div>
          </td>
          <td width="50%" valign="top" align="right" style="padding-left: 15px;">
             <table width="100%" border="0" cellpadding="0" cellspacing="0">
               <tr>
                 <td align="right" style="padding-bottom: 8px; color: #6b7280;">Subtotal:</td>
                 <td align="right" width="80" style="color: #374151;">₹${order.totalAmount}</td>
               </tr>
               <tr>
                 <td align="right" style="padding-bottom: 8px; color: #6b7280;">Shipping:</td>
                 <td align="right" width="80" style="color: #374151;">₹0</td>
               </tr>
               <tr>
                 <td align="right" style="padding-top: 8px; border-top: 1px solid #e5e7eb;"><strong>Total:</strong></td>
                 <td align="right" width="80" style="padding-top: 8px; border-top: 1px solid #e5e7eb;"><strong>₹${order.totalAmount}</strong></td>
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

  const copy = {
    "3d": {
      subject: `Still eyeing ${input.productName}?`,
      body: `Your wishlisted ${input.productName} is waiting for you! <a href="${url}">Grab it now</a>`,
      wa: `Still eyeing ${input.productName}? It's waiting for you 👀 – ${url}`,
    },
    "7d": {
      subject: `Your wishlist is running low`,
      body: `Your wishlisted ${input.productName} is selling fast. <a href="${url}">Grab it before it's gone</a>`,
      wa: `Your wishlisted ${input.productName} is running low! Grab it before it's gone! 🏃‍♀️💨 – ${url}`,
    },
  }[input.stage];

  const result = await notifyChannels({
    email: input.email,
    phone: input.phone,
    subject: copy.subject,
    html: emailLayout(copy.subject, copy.body),
    text: copy.wa,
    waMessage: copy.wa,
    waTemplate: process.env.WA_TEMPLATE_WISHLIST_REMINDER,
    waParams: [input.stage, url],
    emailType: "marketing",
  });
  return { sent: true, detail: result.detail };
}
