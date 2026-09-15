import { requireAuth } from "@/lib/auth";
import { generateMonthlyReport } from "@/lib/report-generator";
import { handleApiError, jsonOk } from "@/lib/api";

const SUPER_ADMIN_EMAIL = "liveproject072@gmail.com";

// GET for Vercel Cron
export async function GET(request: Request) {
  try {
    // Vercel Cron sends an authorization header that you should verify in production.
    // For simplicity or if manually triggered by admin:
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Check if it's a valid CRON request (Vercel or GitHub Action with Bearer token)
    const isCronRequest = 
      request.headers.get("user-agent") === "vercel-cron" || 
      (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronRequest) {
       // Only allow admin for manual GET if not a valid cron request
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
