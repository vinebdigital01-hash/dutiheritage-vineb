import { connectDB } from "@/lib/mongodb";
import { AdminAudit } from "@/models";
import type { AuthUser } from "@/lib/auth";
import type { StaffRole } from "@/models/Staff";

export async function logAdminAction(input: {
  request?: Request;
  actor?: (AuthUser & { role?: StaffRole | null }) | null;
  action: string;
  resource: string;
  resourceId?: string;
  message?: string;
}) {
  try {
    await connectDB();
    const ip =
      input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      input.request?.headers.get("x-real-ip") ||
      "";
    await AdminAudit.create({
      actor: input.actor?.email || input.actor?.uid || "unknown",
      role: input.actor?.role || "",
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId || "",
      message: (input.message || "").slice(0, 500),
      path: input.request ? new URL(input.request.url).pathname : "",
      ip,
    });
  } catch (err) {
    console.error("[admin-audit]", err);
  }
}
