import { requireAuth } from "@/lib/auth";
import { Staff } from "@/models/Staff";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth(request, { admin: true, roles: ["SUPERADMIN"] });
    const body = await request.json();
    await connectDB();
    
    const staff = await Staff.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    
    if (!staff) return jsonError("Staff not found", 404);
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
    await requireAuth(request, { admin: true, roles: ["SUPERADMIN"] });
    await connectDB();
    
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) return jsonError("Staff not found", 404);
    
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}