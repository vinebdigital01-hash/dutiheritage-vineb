import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatMessage } from "@/models/ChatMessage";
import { ChatSession } from "@/models/ChatSession";
import { handleApiError, jsonOk } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await validateBotApiKey(request);
    await connectDB();

    const { phone } = await params;
    
    const [session, messages] = await Promise.all([
      ChatSession.findOne({ phone }),
      ChatMessage.find({ phone }).sort({ createdAt: 1 })
    ]);

    return jsonOk({ session, messages });
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
    const { mode, markAsRead } = body;

    const updateData: any = {};
    if (mode) {
      updateData.mode = mode;
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

    return jsonOk(session);
  } catch (error) {
    return handleApiError(error);
  }
}
