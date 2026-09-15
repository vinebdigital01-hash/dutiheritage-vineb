import { requireAuth, getStaffRole } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

/**
 * GET /api/admin/check
 * Header: Authorization: Bearer <Firebase ID token>
 */
export async function GET(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const role = await getStaffRole(authUser.email);
    
    // Check if the user is frozen
    let isFrozen = false;
    if (!role && authUser.email) {
      const { Staff } = await import("@/models/Staff");
      const { connectDB } = await import("@/lib/mongodb");
      await connectDB();
      const staffDoc = await Staff.findOne({ email: authUser.email.toLowerCase() });
      if (staffDoc && staffDoc.active === false) {
        isFrozen = true;
      }
    }

    return jsonOk({
      isAdmin: !!role,
      adminRole: role,
      isFrozen,
      email: authUser.email,
      uid: authUser.uid,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
