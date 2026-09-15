with open("src/app/api/admin/check/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_code = """    const role = await getStaffRole(authUser.email);

    return jsonOk({
      isAdmin: !!role,
      adminRole: role,
      email: authUser.email,
      uid: authUser.uid,
    });"""

new_code = """    const role = await getStaffRole(authUser.email);
    
    // Check if the user is frozen
    let isFrozen = false;
    if (!role && authUser.email) {
      const { Staff } = await import("@/models/Staff");
      const { connectDB } = await import("@/lib/mongodb");
      await connectDB();
      const staffDoc = await Staff.findOne({ email: authUser.email.toLowerCase() });
      if (staffDoc && staffDoc.active === false) {
        isFrozen = true;
      }
    }

    return jsonOk({
      isAdmin: !!role,
      adminRole: role,
      isFrozen,
      email: authUser.email,
      uid: authUser.uid,
    });"""

content = content.replace(old_code, new_code)

with open("src/app/api/admin/check/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated admin check API")
