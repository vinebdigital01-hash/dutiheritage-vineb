import { connectDB } from "@/lib/mongodb";
import { CustomerGroup } from "@/models";
import { requireAuth } from "@/lib/auth";
import {
  resolveGroupMembers,
  toCustomerDTO,
  updateGroupMemberCount,
} from "@/lib/analytics";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  isValidObjectId,
  ApiError,
} from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/groups/[id] — group + members
 * PUT /api/groups/[id] — update group
 * DELETE /api/groups/[id]
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(_request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid group id", 400);

    await connectDB();
    const group = await CustomerGroup.findById(id).lean();
    if (!group) return jsonError("Group not found", 404);

    const members = await resolveGroupMembers(group, 200);

    return jsonOk({
      group: {
        id: group._id.toString(),
        name: group.name,
        description: group.description,
        type: group.type,
        filters: group.filters,
        memberIds: (group.memberIds || []).map((m) => m.toString()),
        memberCount: members.length,
      },
      members: members.map((m) => toCustomerDTO(m)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid group id", 400);

    const body = await request.json();
    await connectDB();
    const group = await CustomerGroup.findById(id);
    if (!group) return jsonError("Group not found", 404);

    if (body.name !== undefined) group.name = String(body.name).trim();
    if (body.description !== undefined)
      group.description = String(body.description).trim();
    if (body.filters !== undefined && group.type === "smart")
      group.filters = body.filters;
    if (body.memberIds !== undefined && group.type === "manual")
      group.memberIds = body.memberIds;

    await group.save();
    await updateGroupMemberCount(id);

    return jsonOk({ group: { id: group._id.toString(), name: group.name } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(_request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid group id", 400);

    await connectDB();
    await CustomerGroup.findByIdAndDelete(id);
    return jsonOk({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
