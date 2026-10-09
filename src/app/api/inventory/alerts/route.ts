import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { getInventoryAlerts } from "@/services/inventory";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    const data = await getInventoryAlerts();
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}
