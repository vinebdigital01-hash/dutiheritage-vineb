import { connectDB } from "@/lib/mongodb";
import { ChatMessage } from "@/models/ChatMessage";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

/**
 * GET /api/bot/logs — staff WhatsApp send history (bot key or admin session).
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await validateBotApiKey(request);
    await connectDB();

    const docs = await ChatMessage.find().sort({ createdAt: -1 }).limit(100).lean();
    return jsonOk({
      logs: docs.map((m) => ({
        id: m._id.toString(),
        phone: m.phone,
        direction: m.direction,
        sentBy: m.sentBy || (m.direction === "incoming" ? "customer" : "admin"),
        body: m.body || "",
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
