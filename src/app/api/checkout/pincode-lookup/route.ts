import { NextResponse } from "next/server";
import { lookupPincode } from "@/lib/pincode-lookup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode") || searchParams.get("pin");

  if (!pincode || pincode.replace(/\D/g, "").length !== 6) {
    return NextResponse.json(
      { valid: false, error: "Please enter a valid 6-digit Indian PIN code" },
      { status: 400 }
    );
  }

  const result = await lookupPincode(pincode);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
