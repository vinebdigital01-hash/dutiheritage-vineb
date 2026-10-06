import { connectDB } from "@/lib/mongodb";
import { Customer, type CustomerDocument } from "@/models";
import type { AuthUser } from "@/lib/auth";
import type { SavedAddress, UserProfile } from "@/types";

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

type AddrShape = {
  _id?: { toString(): string };
  id?: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  phone?: string;
  country?: string;
};

function mapSavedAddress(a: AddrShape, fallbackId: string): SavedAddress {
  return {
    id: a.id || (a._id ? a._id.toString() : fallbackId),
    label: a.label || "Home",
    firstName: a.firstName || undefined,
    lastName: a.lastName || undefined,
    address: a.address || undefined,
    apartment: a.apartment || undefined,
    city: a.city || undefined,
    state: a.state || undefined,
    pinCode: a.pinCode || undefined,
    phone: a.phone || undefined,
    country: a.country || "IN",
  };
}

export function addressesFromCustomer(customer: CustomerDocument): SavedAddress[] {
  const raw = (customer as CustomerDocument & { addresses?: AddrShape[] }).addresses;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((a, i) => mapSavedAddress(a, `addr-${i}`));
  }
  const addr = customer.address as AddrShape | undefined;
  if (addr && (addr.address || addr.pinCode || addr.city)) {
    return [mapSavedAddress({ ...addr, label: "Home" }, "home")];
  }
  return [];
}

export function customerToProfile(customer: CustomerDocument): UserProfile {
  const addresses = addressesFromCustomer(customer);
  const primary = addresses.find((a) => a.label.toLowerCase() === "home") || addresses[0];
  const addr = customer.address as AddrShape | undefined;
  const extra = customer as CustomerDocument & {
    deleteRequestedAt?: Date | null;
  };

  return {
    phone: customer.phone || addr?.phone || primary?.phone || undefined,
    address: primary?.address || addr?.address || undefined,
    apartment: primary?.apartment || addr?.apartment || undefined,
    city: customer.city || primary?.city || addr?.city || undefined,
    state: customer.state || primary?.state || addr?.state || undefined,
    pinCode: customer.pincode || primary?.pinCode || addr?.pinCode || undefined,
    country: primary?.country || addr?.country || undefined,
    addresses,
    deleteRequestedAt: extra.deleteRequestedAt
      ? new Date(extra.deleteRequestedAt).toISOString()
      : null,
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

  let phone10Digit: string | undefined;
  if (phone) {
    const p = phone.replace("+", "");
    phone10Digit = p.length === 12 && p.startsWith("91") ? p.slice(2) : p;
  }

  let customer =
    (await Customer.findOne({ firebaseUid: authUser.uid })) ||
    (email ? await Customer.findOne({ email }) : null) ||
    (phone ? await Customer.findOne({ $or: [{ phone }, { phone: phone10Digit }] }) : null);

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

export async function findCustomerByCheckoutIdentity(input: {
  phone?: string;
  email?: string;
  firebaseUid?: string;
}) {
  await connectDB();
  const or: Record<string, unknown>[] = [];
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const uid = input.firebaseUid?.trim();
  if (uid) or.push({ firebaseUid: uid });
  if (email) or.push({ email });
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    const phone10 =
      digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
    or.push({ phone });
    if (phone10) or.push({ phone: phone10 }, { phone: `+91${phone10}` });
  }
  if (!or.length) return null;
  return Customer.findOne({ $or: or });
}

export function buildCustomerListFilter(
  searchParams: URLSearchParams
): Record<string, unknown> {
  const q = searchParams.get("q")?.trim();
  const ltv = searchParams.get("ltv");
  const segment = searchParams.get("segment");
  const and: Record<string, unknown>[] = [];

  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    and.push({
      $or: [{ email: regex }, { phone: regex }, { name: regex }, { city: regex }],
    });
  }
  if (ltv && ["LOW", "MEDIUM", "HIGH"].includes(ltv)) {
    and.push({ ltvScore: ltv });
  }
  if (segment === "new") and.push({ totalOrders: { $lte: 1 } });
  if (segment === "repeat") and.push({ totalOrders: { $gte: 2 } });
  if (segment === "high_ltv") and.push({ ltvScore: "HIGH" });
  if (segment === "cod") and.push({ codOrderCount: { $gt: 0 } });
  if (segment === "blocked") {
    and.push({ $or: [{ frozen: true }, { codBlocked: true }] });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { $and: and };
}
