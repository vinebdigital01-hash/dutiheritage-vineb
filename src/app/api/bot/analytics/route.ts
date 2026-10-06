import { connectDB } from "@/lib/mongodb";
import { ChatSession } from "@/models/ChatSession";
import { ChatMessage } from "@/models/ChatMessage";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    const [
      totalConversations,
      activeBots,
      messagesSent,
      messagesReceived,
    ] = await Promise.all([
      ChatSession.countDocuments(),
      ChatSession.countDocuments({ mode: "bot" }),
      ChatMessage.countDocuments({ direction: { $in: ["outgoing", "admin"] } }),
      ChatMessage.countDocuments({ direction: "incoming" }),
    ]);

    return jsonOk({
      totalConversations,
      activeBots,
      messagesSent,
      messagesReceived,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
