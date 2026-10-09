import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth";
import { runAbandonedCarts } from "../jobs/abandoned-carts";
import { runWhatsappAbandoned } from "../jobs/whatsapp-abandoned";

export const maxDuration = 60; // 60s max for Vercel Hobby

export async function GET(request: Request) {
  try {
    requireCronSecret(request);
    
    const results: Record<string, any> = {};
    
    try {
      results.abandonedCarts = await runAbandonedCarts();
    } catch (e: any) {
      results.abandonedCarts = { error: e.message };
    }
    
    try {
      results.whatsappAbandoned = await runWhatsappAbandoned();
    } catch (e: any) {
      results.whatsappAbandoned = { error: e.message };
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
