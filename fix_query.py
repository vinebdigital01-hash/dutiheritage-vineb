path = "src/app/api/auth/whatsapp/verify/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_search = "const existingCustomer = await Customer.findOne({ phone: formattedPhone });"
new_search = """    // Also check the 10-digit version without +91 in case it was saved earlier
    const phoneNoPlus = formattedPhone.replace("+", "");
    const phone10Digit = phoneNoPlus.length === 12 && phoneNoPlus.startsWith("91") ? phoneNoPlus.slice(2) : phoneNoPlus;
    
    const existingCustomer = await Customer.findOne({
      $or: [
        { phone: formattedPhone },
        { phone: phone10Digit }
      ]
    });"""

if old_search in content:
    content = content.replace(old_search, new_search)
else:
    print("Could not find old_search")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
