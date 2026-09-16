import { requireAuth } from "@/lib/auth";
import { getRecentMovements } from "@/services/inventory";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;
    const limit = Number(searchParams.get("limit") || "50");
    const movements = await getRecentMovements({ productId, limit });
    return jsonOk({ movements });
  } catch (error) {
    return handleApiError(error);
  }
}
