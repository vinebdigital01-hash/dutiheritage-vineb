import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  AutomationSettings,
  AutomationLog,
} from "@/models";
import { getAutomationSettings } from "@/lib/automations";
import {
  handleApiError,
  jsonOk,
  requireMongo,
} from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";

/**
 * GET /api/settings/automations — admin: toggles + recent logs
 * PUT /api/settings/automations — admin: update flow enabled flags
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const settings = await getAutomationSettings();
    const logs = await AutomationLog.find()
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    return jsonOk({
      settings: {
        welcome: settings.welcome,
        order_placed: settings.order_placed,
        order_shipped: settings.order_shipped,
        order_delivered: settings.order_delivered,
        cart_abandoned: settings.cart_abandoned,
        post_purchase_review: settings.post_purchase_review,
        winback: settings.winback,
      },
      logs: logs.map((l) => ({
        id: l._id.toString(),
        flow: l.flow,
        stage: l.stage,
        recipientKey: l.recipientKey,
        channel: l.channel,
        status: l.status,
        detail: l.detail,
        orderId: l.orderId,
        cartId: l.cartId,
        createdAt: (l as { createdAt?: Date }).createdAt,
      })),
      providers: {
        email: isEmailConfigured(),
        whatsapp: Boolean(
          process.env.WHATSAPP_PROVIDER &&
            process.env.WHATSAPP_PROVIDER !== "none"
        ),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();
    const settings =
      (await AutomationSettings.findById("automations")) ||
      (await AutomationSettings.create({ _id: "automations" }));

    if (body.welcome?.enabled !== undefined)
      settings.welcome = { enabled: Boolean(body.welcome.enabled) };
    if (body.order_placed?.enabled !== undefined)
      settings.order_placed = { enabled: Boolean(body.order_placed.enabled) };
    if (body.order_shipped?.enabled !== undefined)
      settings.order_shipped = { enabled: Boolean(body.order_shipped.enabled) };
    if (body.order_delivered?.enabled !== undefined)
      settings.order_delivered = {
        enabled: Boolean(body.order_delivered.enabled),
      };
    if (body.cart_abandoned?.enabled !== undefined)
      settings.cart_abandoned = {
        enabled: Boolean(body.cart_abandoned.enabled),
      };
    if (body.post_purchase_review?.enabled !== undefined)
      settings.post_purchase_review = {
        enabled: Boolean(body.post_purchase_review.enabled),
      };
    if (body.winback?.enabled !== undefined)
      settings.winback = { enabled: Boolean(body.winback.enabled) };

    await settings.save();
    return jsonOk({
      settings: {
        welcome: settings.welcome,
        order_placed: settings.order_placed,
        order_shipped: settings.order_shipped,
        order_delivered: settings.order_delivered,
        cart_abandoned: settings.cart_abandoned,
        post_purchase_review: settings.post_purchase_review,
        winback: settings.winback,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
