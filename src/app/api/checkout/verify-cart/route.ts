import { requireMongo, jsonOk, handleApiError } from "@/lib/api";
import {
  inspectCartLines,
  type InspectableCartLine,
} from "@/services/checkout";

export async function POST(request: Request) {
  try {
    requireMongo();
    const body = await request.json();
    const items = (body.items || []) as InspectableCartLine[];
    if (!items.length) {
      return jsonOk({ valid: true, issues: [], lines: [] });
    }

    const result = await inspectCartLines(items);
    return jsonOk({
      valid: result.valid,
      issues: result.issues,
      lines: result.lines,
      error: result.issues.find((i) => i.type !== "price_changed")?.message,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
