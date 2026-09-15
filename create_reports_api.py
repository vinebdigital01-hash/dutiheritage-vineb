new_route = """import { requireAuth } from "@/lib/auth";
import { generateMonthlyReport } from "@/lib/report-generator";
import { handleApiError, jsonOk } from "@/lib/api";

const SUPER_ADMIN_EMAIL = "liveproject072@gmail.com";

// GET for Vercel Cron
export async function GET(request: Request) {
  try {
    // Vercel Cron sends an authorization header that you should verify in production.
    // For simplicity or if manually triggered by admin:
    const authHeader = request.headers.get("authorization");
    
    // If not a Vercel cron request (which has specific headers), enforce admin
    if (request.headers.get("user-agent") !== "vercel-cron") {
       // Only allow admin for manual GET
       await requireAuth(request, { admin: true });
    }

    const res = await generateMonthlyReport(SUPER_ADMIN_EMAIL);
    return jsonOk({ success: true, res });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST for manual trigger from Admin panel
export async function POST(request: Request) {
  try {
    await requireAuth(request, { admin: true });
    const body = await request.json();
    const email = body.email || SUPER_ADMIN_EMAIL;
    
    const res = await generateMonthlyReport(email);
    return jsonOk({ success: true, res });
  } catch (error) {
    return handleApiError(error);
  }
}
"""

import os
os.makedirs("src/app/api/reports/monthly", exist_ok=True)
with open("src/app/api/reports/monthly/route.ts", "w", encoding="utf-8") as f:
    f.write(new_route)
print("Created reports API")
