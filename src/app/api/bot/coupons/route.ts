import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { handleApiError, jsonOk, jsonCreated } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(request: Request) {
  try {
    await await validateBotApiKey(request);
    await connectDB();
    
    const now = new Date();
    const coupons = await Coupon.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });
    
    return jsonOk(coupons);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await await validateBotApiKey(request);
    await connectDB();
    
    const body = await request.json();
    const { code, discountType, discountValue, maxUses, expiresAt, productIds, scope } = body;
    
    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      usageLimit: maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      targetIds: productIds,
      scope,
      active: true
    });
    
    return jsonCreated(coupon);
  } catch (error) {
    return handleApiError(error);
  }
}
