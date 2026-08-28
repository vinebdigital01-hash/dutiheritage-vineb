import { updateProfileSchema } from "@/lib/validators";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { verifyIdToken } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await req.json(); updateProfileSchema.parse(body);

    const customer = await Customer.findOne({ firebaseUid: uid });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (body.name !== undefined) customer.name = body.name;
    if (body.phone !== undefined) customer.phone = body.phone;
    
    if (body.address) {
      customer.address = {
        ...customer.address,
        ...body.address
      };
    }

    await customer.save();

    return NextResponse.json({ success: true, profile: customer });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
