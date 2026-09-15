import re

path = 'src/app/api/checkout/place-order/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "import { waitUntil }" not in content:
    content = content.replace('import { connectDB }', 'import { waitUntil } from "@vercel/functions";\nimport { connectDB }')

# The logic is basically a set of void function calls.
# I will use a simple find and replace.

old = """    void sendOrderPlaced({
      email: c.email || orderDto.customer.email,
      phone: c.phone || orderDto.customer.phone,
      name,
      orderId,
      total: totals.total,
    }).catch(console.error);

    void sendAdminNewOrderAlert({
      orderId,
      name,
      total: totals.total,
    }).catch(console.error);

    if (isNewCustomer && c.email) {
      void sendWelcome({ email: c.email, name }).catch(console.error);
    }"""

new = """    waitUntil(Promise.all([
      sendOrderPlaced({
        email: c.email || orderDto.customer.email,
        phone: c.phone || orderDto.customer.phone,
        name,
        orderId,
        total: totals.total,
      }).catch(console.error),

      sendAdminNewOrderAlert({
        orderId,
        name,
        total: totals.total,
      }).catch(console.error),

      ...(isNewCustomer && c.email ? [sendWelcome({ email: c.email, name }).catch(console.error)] : [])
    ]));"""

content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
