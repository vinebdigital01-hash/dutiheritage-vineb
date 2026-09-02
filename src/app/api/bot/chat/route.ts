import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatMessage } from "@/models/ChatMessage";
import { ChatSession } from "@/models/ChatSession";
import { handleApiError, jsonOk, jsonCreated } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(request: Request) {
  try {
    await await validateBotApiKey(request);
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    await connectDB();

    if (phone) {
      const messages = await ChatMessage.find({ phone }).sort({ createdAt: 1 });
      return jsonOk(messages);
    } else if (searchParams.get("logs") === "true") {
      const logs = await ChatMessage.find().sort({ createdAt: -1 }).limit(100);
      return jsonOk({ logs });
    } else {
      const sessions = await ChatSession.find().sort({ lastMessageAt: -1 });
      return jsonOk({ sessions });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await await validateBotApiKey(request);
    await connectDB();

    const body = await request.json();
    const { phone, direction, body: messageBody, messageType, sentBy, metadata, conversationState } = body;

    const message = await ChatMessage.create({
      phone,
      direction,
      body: messageBody,
      messageType,
      sentBy,
      metadata,
      conversationState
    });

    const updateData: any = {
      lastMessageAt: new Date(),
    };
    
    if (conversationState) {
      updateData.currentState = conversationState;
    }

    const session = await ChatSession.findOneAndUpdate(
      { phone },
      { 
        $set: updateData,
        $inc: { unreadCount: direction === "incoming" ? 1 : 0 }
      },
      { upsert: true, new: true }
    );

    return jsonCreated(message);
  } catch (error) {
    return handleApiError(error);
  }
}
