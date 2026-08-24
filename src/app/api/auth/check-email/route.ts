import { findCustomerByEmail } from "@/lib/customers";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";

/**
 * POST /api/auth/check-email
 * Body: { email: string }
 *
 * Used before forgot-password / magic-link so we don't email unknown addresses
 * when Firebase Email Enumeration Protection is on.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return jsonError("A valid email is required", 400);
    }

    // Local/dev without Mongo: don't block auth flows
    if (!process.env.MONGODB_URI) {
      return jsonOk({ exists: true, skipped: true });
    }

    const customer = await findCustomerByEmail(email);

    return jsonOk({
      exists: Boolean(customer),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
