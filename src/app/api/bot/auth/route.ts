import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { handleApiError, jsonOk } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone, phoneMatchOr } from "@/lib/bot-phone";

export async function POST(request: Request) {
  try {
    await validateBotApiKey(request);

    const body = await request.json();
    const { phone, name } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const normalized = normalizeBotPhone(phone);
    await connectDB();

    let customer = await Customer.findOne({ $or: phoneMatchOr("phone", phone) });
    if (!customer) {
      customer = await Customer.create({
        phone: normalized,
        name: name || "WhatsApp Customer",
        source: "manual",
      });
    }

    return jsonOk(customer);
  } catch (error) {
    return handleApiError(error);
  }
}
