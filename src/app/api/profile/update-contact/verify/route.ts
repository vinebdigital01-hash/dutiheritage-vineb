import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OtpSession } from "@/models/OtpSession";
import { Customer } from "@/models/Customer";
import { getAdminApp, verifyIdToken } from "@/lib/auth";
import { getAuth } from "firebase-admin/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(authHeader);
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { target, type, otp } = await req.json();
    if (!target || !type || !otp) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await connectDB();

    let formattedTarget = target;
    if (type === "phone") {
      formattedTarget = target.replace(/\D/g, "");
      if (formattedTarget.length === 10) formattedTarget = "91" + formattedTarget;
      if (!formattedTarget.startsWith("+")) formattedTarget = "+" + formattedTarget;
    } else {
      formattedTarget = target.trim().toLowerCase();
    }

    const session = await OtpSession.findOne({ phone: formattedTarget, otp });
    if (!session) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    await OtpSession.deleteOne({ _id: session._id });

    const auth = getAuth(getAdminApp());
    const uid = decodedToken.uid;

    try {
      if (type === "email") {
        try {
          await auth.updateUser(uid, { email: formattedTarget, emailVerified: true });
        } catch (e: any) {
          if (e.code === "auth/email-already-exists") {
            const oldUser = await auth.getUserByEmail(formattedTarget);
            // Free up the email
            await auth.updateUser(oldUser.uid, { email: null as any });
            await auth.updateUser(uid, { email: formattedTarget, emailVerified: true });
            // Merge MongoDB
            await Customer.deleteMany({ firebaseUid: oldUser.uid });
          } else throw e;
        }
      } else {
        try {
          await auth.updateUser(uid, { phoneNumber: formattedTarget });
        } catch (e: any) {
          if (e.code === "auth/phone-number-already-exists") {
            const oldUser = await auth.getUserByPhoneNumber(formattedTarget);
            // Free up the phone number
            await auth.updateUser(oldUser.uid, { phoneNumber: null as any });
            await auth.updateUser(uid, { phoneNumber: formattedTarget });
            // Cleanup old MongoDB records that just held this phone
            const oldCustomer = await Customer.findOne({ firebaseUid: oldUser.uid });
            if (oldCustomer && !oldCustomer.email) {
              await Customer.deleteOne({ _id: oldCustomer._id });
            } else if (oldCustomer) {
              oldCustomer.phone = undefined;
              await oldCustomer.save();
            }
          } else throw e;
        }
      }
    } catch (e: any) {
      console.error("Firebase Update Error:", e);
      return NextResponse.json({ error: "Failed to link contact. " + e.message }, { status: 400 });
    }

    // Update MongoDB current customer
    const customer = await Customer.findOne({ firebaseUid: uid });
    if (customer) {
      if (type === "email") customer.email = formattedTarget;
      if (type === "phone") customer.phone = formattedTarget;
      await customer.save();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Contact Update Verify]", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}
