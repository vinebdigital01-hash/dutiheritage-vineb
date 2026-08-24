import { requireAuth, isAdminEmail } from "@/lib/auth";
import {
  upsertCustomerFromAuth,
  serializeCustomer,
  type SyncPayload,
} from "@/lib/customers";
import { sendWelcome } from "@/lib/automations";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";

/**
 * POST /api/auth/sync
 * Body (optional): { name, phone, email, address, city, state, pinCode, ... }
 * Header: Authorization: Bearer <Firebase ID token>
 *
 * Upserts the Firebase user into MongoDB `customers` and returns profile + isAdmin.
 * Fires welcome automation once for brand-new customers.
 */
export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return jsonError(
        "MongoDB is not configured. Set MONGODB_URI in .env.local.",
        503
      );
    }

    const authUser = await requireAuth(request);
    let payload: SyncPayload = {};

    try {
      const body = await request.json();
      if (body && typeof body === "object") {
        payload = body as SyncPayload;
      }
    } catch {
      // empty body is fine
    }

    const { customer, isNew } = await upsertCustomerFromAuth(authUser, payload);

    if (isNew) {
      // Fire-and-forget — don't block login on email/WhatsApp
      void sendWelcome({
        email: customer.email,
        phone: customer.phone,
        name: customer.name,
        customerId: customer._id.toString(),
      }).catch((e) => console.error("[welcome]", e));
    }

    return jsonOk({
      customer: serializeCustomer(customer),
      profile: serializeCustomer(customer).profile,
      isAdmin: isAdminEmail(authUser.email || customer.email),
      isNew,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
