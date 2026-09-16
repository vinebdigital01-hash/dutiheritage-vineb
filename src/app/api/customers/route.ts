import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toCustomerDTO } from "@/lib/analytics";
import { buildCustomerListFilter } from "@/lib/customers";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

/**
 * GET /api/customers?q=&limit=&offset=&ltv=&segment=
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
    const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);
    const filter = buildCustomerListFilter(searchParams);

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
