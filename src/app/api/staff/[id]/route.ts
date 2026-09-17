import { requireAuth } from "@/lib/auth";
import { Staff } from "@/models/Staff";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";
import { STAFF_WRITE } from "@/lib/rbac";
import { logAdminAction } from "@/lib/admin-audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request, { admin: true, roles: STAFF_WRITE });
    const body = await request.json();
    await connectDB();
    
    const staff = await Staff.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    
    if (!staff) return jsonError("Staff not found", 404);
    await logAdminAction({
      request,
      actor: authUser,
      action: "update",
      resource: "staff",
      resourceId: id,
      message: `${staff.email} ${staff.active === false ? "deactivated" : staff.role}`,
    });
    return jsonOk(staff);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request, { admin: true, roles: STAFF_WRITE });
    await connectDB();
    
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) return jsonError("Staff not found", 404);
    await logAdminAction({
      request,
      actor: authUser,
      action: "delete",
      resource: "staff",
      resourceId: id,
      message: staff.email,
    });
    
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
