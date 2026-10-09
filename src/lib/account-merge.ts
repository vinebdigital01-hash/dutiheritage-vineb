import { connectDB } from "@/lib/mongodb";
import { Customer, Order, Wishlist, Cart } from "@/models";
import {
  sendEmail,
  emailLayout,
  isEmailConfigured,
  emailEyebrow,
  emailLead,
  emailOtpBlock,
  escHtml,
} from "@/lib/email";
import { ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  return digits;
}

export async function sendMergeOtpEmail(to: string, otp: string) {
  const html = emailLayout(
    "Link your account",
    emailEyebrow("Security code") +
      emailLead(
        `Use this code to prove you own <strong>${escHtml(to)}</strong> and merge past guest orders into your signed-in account.`
      ) +
      emailOtpBlock(otp, 10) +
      `<p style="margin:0;font-size:13px;color:#6b6560;">If you did not ask for this, ignore the email.</p>`,
    {
      hideDefaultCtas: true,
      preheader: `Your code is ${otp}`,
      kind: "transactional",
    }
  );

  if (!isEmailConfigured()) {
    console.info("[merge-otp] email not configured — OTP for", to, otp);
    return { ok: true as const, skipped: true };
  }

  return sendEmail({
    to,
    subject: `${otp} — link your Duti Heritage account`,
    html,
    type: "auth",
  });
}

export async function startAccountMerge(opts: {
  authUser: AuthUser;
  target: string;
  type: "email" | "phone";
}) {
  await connectDB();
  const primary = await Customer.findOne({ firebaseUid: opts.authUser.uid });
  if (!primary) throw new ApiError("Your account profile was not found. Place an order or save your profile first.", 404);

  let target = opts.target.trim();
  if (opts.type === "email") {
    target = normalizeEmail(target);
    if (!target.includes("@")) throw new ApiError("Enter a valid email", 400);
    if (primary.email && normalizeEmail(primary.email) === target) {
      throw new ApiError("That email is already on this account", 400);
    }
  } else {
    target = normalizePhone(target);
    if (target.length < 10) throw new ApiError("Enter a valid phone number", 400);
    const primaryPhone = primary.phone ? normalizePhone(primary.phone) : "";
    if (primaryPhone && primaryPhone === target) {
      throw new ApiError("That phone is already on this account", 400);
    }
  }

  const other =
    opts.type === "email"
      ? await Customer.findOne({ email: target, _id: { $ne: primary._id } })
      : await Customer.findOne({
          phone: { $in: [target, `+${target}`, target.slice(-10)] },
          _id: { $ne: primary._id },
        });

  if (!other) {
    throw new ApiError(
      opts.type === "email"
        ? "No guest orders found for that email. Check the spelling, or it may already be on this account."
        : "No guest orders found for that phone.",
      404
    );
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  primary.mergeOtp = otp;
  primary.mergeOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  primary.mergeOtpTarget = target;
  primary.mergeOtpType = opts.type;
  await primary.save();

  if (opts.type === "email") {
    const sent = await sendMergeOtpEmail(target, otp);
    if (!sent.ok && !sent.skipped) {
      throw new ApiError(sent.error || "Could not send OTP email", 502);
    }
  } else {
    const botUrl =
      process.env.WHATSAPP_BOT_API_URL ||
      "http://localhost:4000/internal/send-message";
    const botKey = process.env.WHATSAPP_BOT_API_KEY || "duti_bot_secret_key_2026";
    await fetch(botUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-api-key": botKey,
      },
      body: JSON.stringify({
        phone: target.replace(/^\+/, ""),
        message: `*Duti Heritage*\n\nYour code to link accounts is: *${otp}*\n\n_Valid for 10 minutes._`,
      }),
    }).catch((err) => console.error("[merge-otp] whatsapp", err));
  }

  return {
    sent: true,
    masked:
      opts.type === "email"
        ? target.replace(/(.{2}).+(@.+)/, "$1***$2")
        : `******${target.slice(-4)}`,
  };
}

export async function verifyAccountMerge(opts: {
  authUser: AuthUser;
  otp: string;
}) {
  await connectDB();
  const primary = await Customer.findOne({ firebaseUid: opts.authUser.uid });
  if (!primary) throw new ApiError("Account not found", 404);
  if (!primary.mergeOtp || !primary.mergeOtpExpiry || !primary.mergeOtpTarget) {
    throw new ApiError("No merge in progress. Send a code first.", 400);
  }
  if (new Date(primary.mergeOtpExpiry) < new Date()) {
    throw new ApiError("That code has expired. Send a new one.", 400);
  }
  if (String(opts.otp).trim() !== String(primary.mergeOtp)) {
    throw new ApiError("Incorrect code", 400);
  }

  const type = primary.mergeOtpType === "phone" ? "phone" : "email";
  const target = primary.mergeOtpTarget;
  const other =
    type === "email"
      ? await Customer.findOne({ email: target, _id: { $ne: primary._id } })
      : await Customer.findOne({
          phone: { $in: [target, `+${target}`, target.slice(-10)] },
          _id: { $ne: primary._id },
        });

  if (!other) throw new ApiError("The other profile was not found anymore", 404);

  // Attach contact onto primary if missing
  if (type === "email" && !primary.email) primary.email = target;
  if (type === "phone" && !primary.phone) primary.phone = target.startsWith("+") ? target : `+${target}`;

  // Merge addresses (cap 8)
  const existingAddrs = Array.isArray(primary.addresses) ? [...primary.addresses] : [];
  for (const a of other.addresses || []) {
    if (existingAddrs.length >= 8) break;
    existingAddrs.push(a);
  }
  primary.addresses = existingAddrs as typeof primary.addresses;
  if (!primary.address && other.address) primary.address = other.address;
  if (!primary.name && other.name) primary.name = other.name;

  // Point guest orders at this Firebase user
  const orderFilter: Record<string, unknown>[] = [{ customerId: other._id }];
  if (other.firebaseUid) orderFilter.push({ firebaseUid: other.firebaseUid });
  if (other.email) orderFilter.push({ "customer.email": other.email });
  if (other.phone) {
    orderFilter.push({ "customer.phone": other.phone });
    orderFilter.push({ "customer.phone": other.phone.replace(/\D/g, "") });
  }
  await Order.updateMany(
    { $or: orderFilter },
    {
      $set: {
        customerId: primary._id,
        firebaseUid: opts.authUser.uid,
      },
    }
  );

  // Wishlists
  if (other.firebaseUid) {
    const otherWish = (await Wishlist.find({
      firebaseUid: other.firebaseUid,
    } as Record<string, string>).lean()) as { productId?: string }[];
    for (const w of otherWish) {
      const productId = String(w.productId || "");
      if (!productId) continue;
      await Wishlist.updateOne(
        { firebaseUid: opts.authUser.uid, productId } as Record<string, string>,
        {
          $setOnInsert: {
            firebaseUid: opts.authUser.uid,
            productId,
          },
        },
        { upsert: true }
      );
    }
    await Wishlist.deleteMany({
      firebaseUid: other.firebaseUid,
    } as Record<string, string>);
  }

  // Carts
  const cartOr: Record<string, unknown>[] = [{ customerId: other._id }];
  if (other.firebaseUid) cartOr.push({ firebaseUid: other.firebaseUid });
  if (other.email) cartOr.push({ email: other.email });
  await Cart.updateMany(
    { $or: cartOr } as Record<string, unknown>,
    {
      $set: {
        customerId: primary._id,
        firebaseUid: opts.authUser.uid,
        email: primary.email || other.email,
        phone: primary.phone || other.phone,
      },
    }
  );

  primary.mergeOtp = undefined;
  primary.mergeOtpExpiry = undefined;
  primary.mergeOtpTarget = undefined;
  primary.mergeOtpType = undefined;
  primary.markModified("addresses");
  await primary.save();

  // Drop secondary customer if it has no Firebase login (pure guest), else clear duplicate contact
  if (!other.firebaseUid || other.firebaseUid === opts.authUser.uid) {
    await Customer.deleteOne({ _id: other._id });
  } else {
    // Another Firebase user owns that profile — only clear the linked contact field we proved
    if (type === "email") other.email = undefined;
    else other.phone = undefined;
    await other.save();
  }

  return {
    merged: true,
    email: primary.email || null,
    phone: primary.phone || null,
  };
}
