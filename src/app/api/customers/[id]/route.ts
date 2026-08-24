import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { requireAuth } from "@/lib/auth";
import {
  getCustomerProfile,
  refreshCustomerStats,
  toCustomerDTO,
} from "@/lib/analytics";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  isValidObjectId,
} from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/customers/[id] — 360° profile
 * PATCH /api/customers/[id] — update tags
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(_request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid customer id", 400);

    await refreshCustomerStats(id);
    const profile = await getCustomerProfile(id);
    if (!profile) return jsonError("Customer not found", 404);

    return jsonOk(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid customer id", 400);

    const body = await request.json();
    await connectDB();
    const customer = await Customer.findById(id);
    if (!customer) return jsonError("Customer not found", 404);

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return jsonError("tags must be an array", 400);
      }
      customer.tags = body.tags
        .map((t: unknown) => String(t).trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 20);
    }

    if (body.addTags && Array.isArray(body.addTags)) {
      const set = new Set([...(customer.tags || []), ...body.addTags.map(String)]);
      customer.tags = [...set].slice(0, 20);
    }

    if (body.removeTags && Array.isArray(body.removeTags)) {
      const remove = new Set(body.removeTags.map(String));
      customer.tags = (customer.tags || []).filter((t) => !remove.has(t));
    }

    await customer.save();
    return jsonOk({ customer: toCustomerDTO(customer) });
  } catch (error) {
    return handleApiError(error);
  }
}
