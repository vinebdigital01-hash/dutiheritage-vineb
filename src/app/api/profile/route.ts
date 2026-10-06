import { updateProfileSchema } from "@/lib/validators";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { verifyIdToken } from "@/lib/auth";
import { customerToProfile } from "@/lib/customers";
import type { SavedAddress } from "@/types";

function normalizeAddresses(input: unknown): SavedAddress[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 4)
    .map((raw, i) => {
      const a = raw as Record<string, unknown>;
      const label = String(a.label || (i === 0 ? "Home" : "Other")).trim() || "Home";
      return {
        id: String(a.id || ""),
        label,
        firstName: a.firstName ? String(a.firstName) : undefined,
        lastName: a.lastName ? String(a.lastName) : undefined,
        address: a.address ? String(a.address) : undefined,
        apartment: a.apartment ? String(a.apartment) : undefined,
        city: a.city ? String(a.city) : undefined,
        state: a.state ? String(a.state) : undefined,
        pinCode: a.pinCode ? String(a.pinCode) : undefined,
        phone: a.phone ? String(a.phone) : undefined,
        country: a.country ? String(a.country) : "IN",
      };
    })
    .filter((a) => a.address || a.pinCode || a.city);
}

function toLegacyAddress(primary: SavedAddress | undefined, phone?: string) {
  if (!primary) return undefined;
  return {
    firstName: primary.firstName || "",
    lastName: primary.lastName || "",
    address: primary.address || "",
    apartment: primary.apartment || "",
    city: primary.city || "",
    state: primary.state || "",
    pinCode: primary.pinCode || "",
    phone: primary.phone || phone || "",
    country: primary.country || "IN",
  };
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(authHeader);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await req.json();
    updateProfileSchema.parse(body);

    const customer = await Customer.findOne({ firebaseUid: uid });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (body.name !== undefined) customer.name = body.name;
    if (body.phone !== undefined) customer.phone = body.phone;

    if (Array.isArray(body.addresses)) {
      const addresses = normalizeAddresses(body.addresses);
      customer.set(
        "addresses",
        addresses.map((a) => ({
          label: a.label,
          firstName: a.firstName,
          lastName: a.lastName,
          address: a.address,
          apartment: a.apartment,
          city: a.city,
          state: a.state,
          pinCode: a.pinCode,
          phone: a.phone,
          country: a.country || "IN",
        }))
      );
      const primary = addresses.find((a) => a.label.toLowerCase() === "home") || addresses[0];
      const legacy = toLegacyAddress(primary, customer.phone || undefined);
      if (legacy) {
        customer.address = { ...(customer.address || {}), ...legacy };
        if (legacy.city) customer.city = legacy.city;
        if (legacy.state) customer.state = legacy.state;
        if (legacy.pinCode) customer.pincode = legacy.pinCode;
      }
    } else if (body.address) {
      customer.address = {
        ...customer.address,
        ...body.address,
      };
      if (body.address.city) customer.city = body.address.city;
      if (body.address.state) customer.state = body.address.state;
      if (body.address.pinCode) customer.pincode = body.address.pinCode;

      const current = Array.isArray(customer.addresses) ? [...customer.addresses] : [];
      if (current.length === 0) {
        customer.set("addresses", [
          { label: "Home", ...body.address, country: body.address.country || "IN" },
        ]);
      } else {
        const homeIdx = current.findIndex(
          (a) => String((a as { label?: string }).label || "").toLowerCase() === "home"
        );
        const idx = homeIdx >= 0 ? homeIdx : 0;
        current[idx] = { ...current[idx], ...body.address, label: current[idx]?.label || "Home" };
        customer.set("addresses", current);
      }
    }

    await customer.save();
    const profile = customerToProfile(customer);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
