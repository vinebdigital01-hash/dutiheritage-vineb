import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatMessage } from "@/models/ChatMessage";
import { ChatSession } from "@/models/ChatSession";
import { handleApiError, jsonOk, jsonCreated } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(request: Request) {
  try {
    await validateBotApiKey(request);
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    await connectDB();

    if (phone) {
      const digits = phone.replace(/\D/g, "");
      const tail = digits.slice(-10);
      const phoneFilters = [
        { phone },
        ...(digits ? [{ phone: digits }] : []),
        ...(tail ? [{ phone: tail }, { phone: `91${tail}` }, { phone: `+91${tail}` }] : []),
      ];
      const messages = await ChatMessage.find({ $or: phoneFilters }).sort({ createdAt: 1 });
      return jsonOk(messages);
    } else if (searchParams.get("logs") === "true") {
      const logs = await ChatMessage.find().sort({ createdAt: -1 }).limit(100);
      return jsonOk({ logs });
    } else {
      let sessions = await ChatSession.find().sort({ lastMessageAt: -1 }).lean();

      // If no sessions exist yet, backfill from any existing ChatMessage records
      if (sessions.length === 0) {
        try {
          const distinctPhones = await ChatMessage.distinct("phone");
          for (const p of distinctPhones.slice(0, 50)) {
            const lastMsg = await ChatMessage.findOne({ phone: p }).sort({ createdAt: -1 });
            if (lastMsg) {
              await ChatSession.findOneAndUpdate(
                { phone: p },
                {
                  $setOnInsert: {
                    phone: p,
                    lastMessageAt: lastMsg.createdAt || new Date(),
                    mode: "bot",
                    unreadCount: lastMsg.direction === "incoming" ? 1 : 0,
                  },
                },
                { upsert: true }
              );
            }
          }
          sessions = await ChatSession.find().sort({ lastMessageAt: -1 }).lean();
        } catch {
          // ignore backfill error
        }
      }

      // Populate customer names from Customer collection if missing
      const { Customer } = await import("@/models");
      const enrichedSessions = await Promise.all(
        sessions.map(async (s) => {
          let name = s.customerName;
          if (!name) {
            const tail = String(s.phone || "").replace(/\D/g, "").slice(-10);
            if (tail) {
              const cust = await Customer.findOne({
                phone: new RegExp(`${tail}$`),
              }).select("name").lean();
              if (cust?.name) name = cust.name;
            }
          }
          return {
            phone: s.phone,
            customerName: name || "",
            unreadCount: s.unreadCount || 0,
            lastMessageAt: s.lastMessageAt,
            mode: s.mode || "bot",
            assignedTo: s.assignedTo || "",
            assignedName: s.assignedName || "",
          };
        })
      );

      return jsonOk({ sessions: enrichedSessions });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await validateBotApiKey(request);
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
