import { connectDB } from "@/lib/mongodb";
import { ChatMessage } from "@/models/ChatMessage";
import { ChatSession } from "@/models/ChatSession";
import { Order } from "@/models";
import { handleApiError, jsonOk, jsonCreated, ApiError } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await validateBotApiKey(request);
    await connectDB();

    const { phone } = await params;
    const digits = phone.replace(/\D/g, "");
    const tail = digits.slice(-10);

    const phoneFilters = [
      { phone },
      ...(digits ? [{ phone: digits }] : []),
      ...(tail ? [{ phone: tail }, { phone: `91${tail}` }, { phone: `+91${tail}` }] : []),
    ];

    const [session, messages, order] = await Promise.all([
      ChatSession.findOne({ $or: phoneFilters }),
      ChatMessage.find({ $or: phoneFilters }).sort({ createdAt: 1 }),
      tail
        ? Order.findOne({ "customer.phone": new RegExp(`${tail}$`) })
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve(null),
    ]);

    return jsonOk({
      session,
      messages: messages.map((m) => ({
        id: m._id.toString(),
        direction: m.direction,
        body: m.body,
        createdAt: (m as { createdAt?: Date }).createdAt,
        messageType: m.messageType,
        sentBy: m.sentBy,
      })),
      order: order
        ? {
            orderId: order.orderId,
            status: order.status,
            total: order.total,
            paymentMethod: order.paymentMethod,
            name: order.customer?.name,
            href: `/admin/orders/${order.orderId}`,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await validateBotApiKey(request);
    await connectDB();

    const { phone } = await params;
    const body = await request.json();
    const { mode, markAsRead, assignedTo, assignedName } = body;

    const updateData: Record<string, unknown> = {};
    if (mode) {
      updateData.mode = mode;
    }
    if (assignedTo !== undefined) {
      updateData.assignedTo = String(assignedTo || "");
      updateData.assignedName = String(assignedName || assignedTo || "");
    }
    
    if (markAsRead) {
      updateData.unreadCount = 0;
      await ChatMessage.updateMany(
        { phone, isRead: false },
        { $set: { isRead: true } }
      );
    }

    const session = await ChatSession.findOneAndUpdate(
      { phone },
      { $set: updateData },
      { new: true }
    );

    // Sync bot mode if mode changed
    if (mode) {
      const botUrl = (
        process.env.BOT_SERVER_URL ||
        process.env.WHATSAPP_BOT_API_URL ||
        process.env.BOT_API_URL ||
        "https://dutiheritage-bot.onrender.com"
      ).trim().replace(/\/$/, "");
      const botApiKey =
        process.env.BOT_API_KEY ||
        process.env.WHATSAPP_BOT_API_KEY ||
        "duti_bot_secret_key_2026";
      fetch(`${botUrl}/api/bot-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-api-key": botApiKey,
        },
        body: JSON.stringify({ phone, mode }),
      }).catch(() => undefined);
    }

    return jsonOk(session);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await validateBotApiKey(request);
    await connectDB();
    const { phone } = await params;
    const body = await request.json();
    const text = String(body.body || body.message || "").trim();
    if (!text) throw new ApiError("message is required");

    const message = await ChatMessage.create({
      phone,
      direction: "admin",
      body: text,
      messageType: "text",
      sentBy: "admin",
    });

    await ChatSession.findOneAndUpdate(
      { phone },
      { $set: { lastMessageAt: new Date(), mode: "human", unreadCount: 0 } },
      { upsert: true }
    );

    // Dispatch message via bot server or WhatsApp provider
    let delivered = false;
    const botUrl = (
      process.env.BOT_SERVER_URL ||
      process.env.WHATSAPP_BOT_API_URL ||
      process.env.BOT_API_URL ||
      "https://dutiheritage-bot.onrender.com"
    ).trim().replace(/\/$/, "");

    const botApiKey =
      process.env.BOT_API_KEY ||
      process.env.WHATSAPP_BOT_API_KEY ||
      "duti_bot_secret_key_2026";

    try {
      const res = await fetch(`${botUrl}/internal/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-api-key": botApiKey,
        },
        body: JSON.stringify({ phone, message: text }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) delivered = true;
    } catch {
      // internal send endpoint not reachable
    }

    if (!delivered) {
      try {
        const res = await sendWhatsApp({ phone, message: text });
        if (res.ok) delivered = true;
      } catch (err) {
        console.error("[whatsapp-send]", err);
      }
    }

    return jsonCreated({
      id: message._id.toString(),
      direction: message.direction,
      body: message.body,
      delivered,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

