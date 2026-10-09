import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth";
import { runPostPurchase } from "../jobs/post-purchase";
import { runWinback } from "../jobs/winback";
import { runWishlistReminders } from "../jobs/wishlist-reminders";
import { generateMonthlyReport } from "@/lib/report-generator";
import { defaultReportEmail } from "../../reports/monthly/route";

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

    // Run Monthly Report if it is the 1st of the month
    if (new Date().getDate() === 1) {
      try {
        const email = await defaultReportEmail();
        if (email) {
          results.monthlyReport = await generateMonthlyReport(email);
        } else {
          results.monthlyReport = { skipped: true, reason: "No default admin email found" };
        }
      } catch (e: any) {
        results.monthlyReport = { error: e.message };
      }
    }


    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
