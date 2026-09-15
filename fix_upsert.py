path = "src/lib/customers.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """  let customer =
    (await Customer.findOne({ firebaseUid: authUser.uid })) ||
    (email ? await Customer.findOne({ email }) : null) ||
    (phone ? await Customer.findOne({ phone }) : null);"""

new_logic = """  let phone10Digit: string | undefined;
  if (phone) {
    const p = phone.replace("+", "");
    phone10Digit = p.length === 12 && p.startsWith("91") ? p.slice(2) : p;
  }

  let customer =
    (await Customer.findOne({ firebaseUid: authUser.uid })) ||
    (email ? await Customer.findOne({ email }) : null) ||
    (phone ? await Customer.findOne({ $or: [{ phone }, { phone: phone10Digit }] }) : null);"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
else:
    print("Could not find old_logic")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
