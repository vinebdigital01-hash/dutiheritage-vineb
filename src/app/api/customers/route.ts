import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toCustomerDTO } from "@/lib/analytics";
import {
  handleApiError,
  jsonOk,
  requireMongo,
} from "@/lib/api";

/**
 * GET /api/customers?q=&limit=&offset=
 * Admin: paginated customer list with search.
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
    const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);
    const ltv = searchParams.get("ltv");

    const filter: Record<string, unknown> = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { email: regex },
        { phone: regex },
        { name: regex },
        { city: regex },
      ];
    }
    if (ltv && ["LOW", "MEDIUM", "HIGH"].includes(ltv)) {
      filter.ltvScore = ltv;
    }

    const [docs, count] = await Promise.all([
      Customer.find(filter)
        .sort({ lastVisit: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return jsonOk({
      customers: docs.map((d) => toCustomerDTO(d)),
      count,
      offset,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
