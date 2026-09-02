import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Settings } from "@/models/Settings";
import { handleApiError, jsonOk } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(request: Request) {
  try {
    await await validateBotApiKey(request);
    await connectDB();
    
    let settings = await Settings.findById("cod");
    if (!settings) {
      settings = await Settings.create({ _id: "cod" });
    }
    
    // Add any static FAQ/policies text
    const extraContent = {
      faq: "1. How to track my order?\nYou can track your order using the order ID.\n\n2. What is the return policy?\nWe offer a 7-day return policy for unused items.",
      contactEmail: "support@dutiheritage.com",
      contactPhone: "+911234567890"
    };
    
    return jsonOk({ settings, content: extraContent });
  } catch (error) {
    return handleApiError(error);
  }
}
