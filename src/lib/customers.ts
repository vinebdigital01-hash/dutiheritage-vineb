import { connectDB } from "@/lib/mongodb";
import { Customer, type CustomerDocument } from "@/models";
import type { AuthUser } from "@/lib/auth";
import type { UserProfile } from "@/types";

export type SyncPayload = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
};

export function customerToProfile(customer: CustomerDocument): UserProfile {
  const addr = customer.address as
    | {
        address?: string;
        apartment?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        country?: string;
        phone?: string;
      }
    | undefined;

  return {
    phone: customer.phone || addr?.phone || undefined,
    address: addr?.address || undefined,
    apartment: addr?.apartment || undefined,
    city: customer.city || addr?.city || undefined,
    state: customer.state || addr?.state || undefined,
    pinCode: customer.pincode || addr?.pinCode || undefined,
    country: addr?.country || undefined,
  };
}

export function serializeCustomer(customer: CustomerDocument) {
  return {
    id: customer._id.toString(),
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    name: customer.name ?? null,
    firebaseUid: customer.firebaseUid ?? null,
    source: customer.source,
    profile: customerToProfile(customer),
    totalOrders: customer.totalOrders ?? 0,
    totalSpent: customer.totalSpent ?? 0,
  };
}

/**
 * Upsert a Customer from a verified Firebase user.
 * Returns { customer, isNew } so callers can fire welcome automations.
 */
export async function upsertCustomerFromAuth(
  authUser: AuthUser,
  payload: SyncPayload = {}
): Promise<{ customer: CustomerDocument; isNew: boolean }> {
  await connectDB();

  const email = (
    payload.email ||
    authUser.email ||
    ""
  )
    .trim()
    .toLowerCase() || undefined;

  const phone =
    (payload.phone || authUser.token.phone_number || "").trim() || undefined;

  const name =
    (payload.name || authUser.name || "").trim() ||
    (email ? email.split("@")[0] : undefined);

  const now = new Date();

  let customer =
    (await Customer.findOne({ firebaseUid: authUser.uid })) ||
    (email ? await Customer.findOne({ email }) : null) ||
    (phone ? await Customer.findOne({ phone }) : null);

  const addressUpdate =
    payload.address ||
    payload.apartment ||
    payload.city ||
    payload.state ||
    payload.pinCode
      ? {
          address: payload.address,
          apartment: payload.apartment,
          city: payload.city,
          state: payload.state,
          pinCode: payload.pinCode,
          country: payload.country || "IN",
          phone,
        }
      : undefined;

  if (customer) {
    customer.firebaseUid = authUser.uid;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (name) customer.name = name;
    if (addressUpdate) {
      customer.address = { ...(customer.address || {}), ...addressUpdate };
      if (payload.city) customer.city = payload.city;
      if (payload.state) customer.state = payload.state;
      if (payload.pinCode) customer.pincode = payload.pinCode;
    }
    customer.lastVisit = now;
    if (!customer.firstVisit) customer.firstVisit = now;
    if (!customer.source || customer.source === "checkout") {
      customer.source = "firebase";
    }
    await customer.save();
    return { customer, isNew: false };
  }

  customer = await Customer.create({
    firebaseUid: authUser.uid,
    email,
    phone,
    name,
    source: "firebase",
    address: addressUpdate,
    city: payload.city,
    state: payload.state,
    pincode: payload.pinCode,
    firstVisit: now,
    lastVisit: now,
  });

  return { customer, isNew: true };
}

export async function findCustomerByEmail(email: string) {
  await connectDB();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return Customer.findOne({ email: normalized }).lean();
}
