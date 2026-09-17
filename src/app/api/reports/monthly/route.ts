import { requireAuth } from "@/lib/auth";
import { generateMonthlyReport } from "@/lib/report-generator";
import { handleApiError, jsonOk } from "@/lib/api";

const SUPER_ADMIN_EMAIL = "liveproject072@gmail.com";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronRequest = Boolean(
      cronSecret && authHeader === `Bearer ${cronSecret}`
    );

    if (!isCronRequest) {
      await requireAuth(request, { admin: true });
    }

    const res = await generateMonthlyReport(SUPER_ADMIN_EMAIL);
    return jsonOk({ success: true, res });
  } catch (error) {
    return handleApiError(error);
  }
}

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
