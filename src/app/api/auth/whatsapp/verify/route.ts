import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OtpSession } from "@/models/OtpSession";
import { Customer } from "@/models/Customer";
import { getAdminApp } from "@/lib/auth";
import { getAuth } from "firebase-admin/auth";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    await connectDB();

    // Clean phone number
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;
    if (!formattedPhone.startsWith("+")) formattedPhone = "+" + formattedPhone;

    // Check OTP
    const session = await OtpSession.findOne({
      phone: formattedPhone,
      otp: otp,
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // OTP is valid. Delete it so it can't be reused.
    await OtpSession.deleteOne({ _id: session._id });

    const auth = getAuth(getAdminApp());

    // ─── ACCOUNT MERGING LOGIC ───
    // Check if a Customer already exists in MongoDB with this phone number.
    // If that customer was created via email login, they already have a firebaseUid.
    // We reuse that Firebase account so orders, wishlist, etc. stay merged.
        // Also check the 10-digit version without +91 in case it was saved earlier
    const phoneNoPlus = formattedPhone.replace("+", "");
    const phone10Digit = phoneNoPlus.length === 12 && phoneNoPlus.startsWith("91") ? phoneNoPlus.slice(2) : phoneNoPlus;
    
    const existingCustomer = await Customer.findOne({
      $or: [
        { phone: formattedPhone },
        { phone: phone10Digit }
      ]
    });

    let uid: string;

    if (existingCustomer?.firebaseUid) {
      // Customer already exists (e.g. signed up via email before).
      // Link phone number to their existing Firebase account if not already linked.
      uid = existingCustomer.firebaseUid;
      try {
        const existingUser = await auth.getUser(uid);
        if (!existingUser.phoneNumber) {
          await auth.updateUser(uid, { phoneNumber: formattedPhone });
        }
      } catch (e: any) {
        // If the Firebase user was somehow deleted, fall through to create/find by phone
        if (e.code === "auth/user-not-found") {
          uid = await findOrCreateFirebaseUser(auth, formattedPhone);
        } else {
          throw e;
        }
      }
    } else {
      // No existing customer with this phone — find or create Firebase user by phone
      uid = await findOrCreateFirebaseUser(auth, formattedPhone);
    }

    // Generate Custom Token
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({ success: true, token: customToken });
  } catch (error: any) {
    console.error("[WhatsApp OTP Verify]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

async function findOrCreateFirebaseUser(auth: ReturnType<typeof getAuth>, phone: string): Promise<string> {
  try {
    const userRecord = await auth.getUserByPhoneNumber(phone);
    return userRecord.uid;
  } catch (e: any) {
    if (e.code === "auth/user-not-found") {
      const newUser = await auth.createUser({ phoneNumber: phone });
      return newUser.uid;
    }
    throw e;
  }
}
