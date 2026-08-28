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

    return jsonOk({
      isAdmin: !!role,
      adminRole: role,
      email: authUser.email,
      uid: authUser.uid,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
