import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth";
import { runPostPurchase } from "../jobs/post-purchase";
import { runWinback } from "../jobs/winback";
import { runWishlistReminders } from "../jobs/wishlist-reminders";

export const maxDuration = 60; // 60s max for Vercel Hobby

export async function GET(request: Request) {
  try {
    requireCronSecret(request);
    
    const results: Record<string, any> = {};
    
    try {
      results.postPurchase = await runPostPurchase();
    } catch (e: any) {
      results.postPurchase = { error: e.message };
    }
    
    try {
      results.winback = await runWinback();
    } catch (e: any) {
      results.winback = { error: e.message };
    }

    try {
      results.wishlist = await runWishlistReminders();
    } catch (e: any) {
      results.wishlist = { error: e.message };
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
