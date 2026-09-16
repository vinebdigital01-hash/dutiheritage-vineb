import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { logAdminAction } from "@/lib/admin-audit";
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
    const authUser = await requireAuth(request, { admin: true, roles: OPS_WRITE });
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

    if (body.notes !== undefined) customer.notes = String(body.notes || "").slice(0, 2000);
    if (body.frozen !== undefined) customer.frozen = Boolean(body.frozen);
    if (body.codBlocked !== undefined) customer.codBlocked = Boolean(body.codBlocked);
    if (body.blockReason !== undefined) {
      customer.blockReason = String(body.blockReason || "").slice(0, 400);
    }

    await customer.save();
    const flags: string[] = [];
    if (body.frozen !== undefined) flags.push(customer.frozen ? "frozen" : "unfrozen");
    if (body.codBlocked !== undefined) flags.push(customer.codBlocked ? "COD blocked" : "COD unblocked");
    await logAdminAction({
      request,
      actor: authUser,
      action: flags.length ? flags.join(",") : "update",
      resource: "customer",
      resourceId: id,
      message: flags.join("; ") || "Updated customer",
    });
    return jsonOk({ customer: toCustomerDTO(customer) });
  } catch (error) {
    return handleApiError(error);
  }
}
