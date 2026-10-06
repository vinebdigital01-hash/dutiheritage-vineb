import { applyRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { requireAuth } from "@/lib/auth";
import { customerToProfile } from "@/lib/customers";
import { sendEmail, isEmailConfigured, emailLayout } from "@/lib/email";
import { getStoreIdentity } from "@/lib/store-identity";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

/**
 * POST /api/account/delete-request
 * Queue a deletion request. Staff finish the delete by hand.
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 3, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    const auth = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const note = String(body.note || "").trim().slice(0, 500);

    await connectDB();
    const customer = await Customer.findOne({ firebaseUid: auth.uid });
    if (!customer) throw new ApiError("Customer not found", 404);

    customer.set("deleteRequestedAt", new Date());
    if (note) customer.set("deleteRequestNote", note);
    await customer.save();

    const identity = getStoreIdentity();
    const staffTo = identity.supportEmail;
    if (isEmailConfigured() && staffTo) {
      const inner = `<p>${customer.name || auth.email || auth.uid} asked to delete their account.</p>
        <p>Email: ${customer.email || "—"}<br/>Phone: ${customer.phone || "—"}<br/>UID: ${auth.uid}</p>
        ${note ? `<p>Note: ${note}</p>` : ""}
        <p>Finish this by hand in admin (freeze / delete). Do not auto-wipe orders.</p>`;
      await sendEmail({
        to: staffTo,
        subject: `Account delete request — ${customer.email || auth.uid}`,
        html: emailLayout("Account delete request", inner),
        type: "orders",
      });
    }

    return jsonOk({
      ok: true,
      message: "We've logged your request. Staff will finish the deletion by hand.",
      profile: customerToProfile(customer),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
