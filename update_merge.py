path = "src/app/api/profile/update-contact/verify/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the Firebase update logic to handle conflicts by merging
old_logic = """    try {
      if (type === "email") {
        await auth.updateUser(uid, { email: formattedTarget, emailVerified: true });
      } else {
        await auth.updateUser(uid, { phoneNumber: formattedTarget });
      }
    } catch (e: any) {
      if (e.code === "auth/email-already-exists" || e.code === "auth/phone-number-already-exists") {
        return NextResponse.json({ error: "This contact is already used by another account" }, { status: 400 });
      }
      throw e;
    }

    // Update MongoDB
    const customer = await Customer.findOne({ firebaseUid: uid });
    if (customer) {
      if (type === "email") customer.email = formattedTarget;
      if (type === "phone") customer.phone = formattedTarget;
      await customer.save();
    }"""

new_logic = """    try {
      if (type === "email") {
        try {
          await auth.updateUser(uid, { email: formattedTarget, emailVerified: true });
        } catch (e: any) {
          if (e.code === "auth/email-already-exists") {
            const oldUser = await auth.getUserByEmail(formattedTarget);
            // Free up the email
            await auth.updateUser(oldUser.uid, { email: null });
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
            await auth.updateUser(oldUser.uid, { phoneNumber: null });
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
    }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
else:
    print("Could not find old logic block")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
