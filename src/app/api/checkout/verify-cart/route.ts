import { requireMongo, jsonOk, handleApiError, ApiError } from "@/lib/api";
import { priceCartLines, type CartLineInput } from "@/services/checkout";

export async function POST(request: Request) {
  try {
    requireMongo();
    const body = await request.json();
    const items = body.items as CartLineInput[];
    if (!items || !items.length) {
      return jsonOk({ valid: true, lines: [] });
    }

    try {
      const lines = await priceCartLines(items);
      return jsonOk({ valid: true, lines });
    } catch (err: any) {
      return jsonOk({ valid: false, error: err.message });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
