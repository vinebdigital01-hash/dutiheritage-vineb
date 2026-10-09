import { requireAuth } from "@/lib/auth";
import {
  generateMonthlyReport,
  buildMonthlyReportData,
} from "@/lib/report-generator";
import { getStoreSettings } from "@/lib/store-settings";
import { handleApiError, jsonOk, ApiError } from "@/lib/api";

async function defaultReportEmail(): Promise<string> {
  const store = await getStoreSettings();
  const fromStore = String(store.supportEmail || "").trim();
  if (fromStore && !fromStore.includes("liveproject072")) return fromStore;
  const fromEnv =
    process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
    process.env.SUPER_ADMIN_EMAIL?.trim() ||
    "";
  if (fromEnv) return fromEnv;
  return fromStore || "";
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronRequest = Boolean(
      cronSecret && authHeader === `Bearer ${cronSecret}`
    );
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get("preview") === "1";

    if (!isCronRequest) {
      await requireAuth(request, { admin: true });
    }

    if (preview && !isCronRequest) {
      const { snapshot } = await buildMonthlyReportData();
      return jsonOk({ success: true, snapshot });
    }

    const email = await defaultReportEmail();
    if (!email) {
      throw new ApiError(
        "No report inbox set. Add support email in Settings, or set ADMIN_EMAILS.",
        400
      );
    }

    const res = await generateMonthlyReport(email);
    return jsonOk({ success: true, email, res });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth(request, { admin: true });
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim() || (await defaultReportEmail());
    if (!email) {
      throw new ApiError(
        "No report inbox set. Add support email in Settings, or type an email here.",
        400
      );
    }

    const res = await generateMonthlyReport(email);
    return jsonOk({ success: true, email, res });
  } catch (error) {
    return handleApiError(error);
  }
}
