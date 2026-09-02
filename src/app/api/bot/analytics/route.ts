import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatSession } from "@/models/ChatSession";
import { ChatMessage } from "@/models/ChatMessage";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const [
      totalConversations,
      activeBots,
      messagesSent,
      messagesReceived
    ] = await Promise.all([
      ChatSession.countDocuments(),
      ChatSession.countDocuments({ mode: "bot" }),
      ChatMessage.countDocuments({ direction: { $in: ["outgoing", "admin"] } }),
      ChatMessage.countDocuments({ direction: "incoming" })
    ]);

    return jsonOk({
      totalConversations,
      activeBots,
      messagesSent,
      messagesReceived
    });
  } catch (error) {
    return handleApiError(error);
  }
}
