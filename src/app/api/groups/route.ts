import { connectDB } from "@/lib/mongodb";
import { CustomerGroup } from "@/models";
import { requireAuth } from "@/lib/auth";
import {
  resolveGroupMembers,
  updateGroupMemberCount,
} from "@/lib/analytics";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

function serializeGroup(doc: {
  _id: { toString(): string };
  name: string;
  description?: string | null;
  type: string;
  filters?: unknown[];
  memberIds?: { toString(): string }[];
  memberCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? undefined,
    type: doc.type,
    filters: doc.filters || [],
    memberIds: (doc.memberIds || []).map((id) => id.toString()),
    memberCount: doc.memberCount ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /api/groups
 * POST /api/groups — create smart or manual group
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();
    const docs = await CustomerGroup.find().sort({ updatedAt: -1 }).lean();
    return jsonOk({
      groups: docs.map((d) => serializeGroup(d)),
      count: docs.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) throw new ApiError("name is required");

    const type = body.type === "smart" ? "smart" : "manual";
    const doc = await CustomerGroup.create({
      name,
      description: body.description?.trim(),
      type,
      filters: type === "smart" ? body.filters || [] : [],
      memberIds: type === "manual" ? body.memberIds || [] : [],
    });

    await updateGroupMemberCount(doc._id.toString());

    const fresh = await CustomerGroup.findById(doc._id).lean();
    return jsonCreated({ group: serializeGroup(fresh!) });
  } catch (error) {
    return handleApiError(error);
  }
}
