import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { handleApiError, jsonOk } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function POST(request: Request) {
  try {
    await await validateBotApiKey(request);
    
    const body = await request.json();
    const { phone, name } = body;
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    await connectDB();
    
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({
        phone,
        name: name || "WhatsApp Customer",
        source: "manual",
      });
    }

    return jsonOk(customer);
  } catch (error) {
    return handleApiError(error);
  }
}
