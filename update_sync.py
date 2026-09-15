with open("src/app/api/auth/sync/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_return = """    const role = await getStaffRole(authUser.email || customer.email);

    return jsonOk({
      customer: serializeCustomer(customer),
      profile: serializeCustomer(customer).profile,
      isAdmin: !!role,
      adminRole: role,"""

new_return = """    const role = await getStaffRole(authUser.email || customer.email);

    let isFrozen = false;
    if (!role && (authUser.email || customer.email)) {
      const email = (authUser.email || customer.email || "").toLowerCase();
      const { Staff } = await import("@/models/Staff");
      const staffDoc = await Staff.findOne({ email });
      if (staffDoc && staffDoc.active === false) {
        isFrozen = true;
      }
    }

    return jsonOk({
      customer: serializeCustomer(customer),
      profile: serializeCustomer(customer).profile,
      isAdmin: !!role,
      adminRole: role,
      isFrozen,"""

content = content.replace(old_return, new_return)

with open("src/app/api/auth/sync/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated auth sync API")
