import re
import os

path = 'src/app/api/checkout/place-order/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "import { waitUntil }" not in content:
    content = content.replace('import { connectDB }', 'import { waitUntil } from "@vercel/functions";\nimport { connectDB }')

# We can replace the 3 void send* calls with waitUntil.
# Find the start of `void sendOrderPlaced`
start_idx = content.find('void sendOrderPlaced({')
if start_idx != -1:
    # Find the end of `void sendAdminNewOrderAlert`
    end_idx = content.find('void sendAdminNewOrderAlert', start_idx)
    if end_idx != -1:
        end_idx = content.find(';', end_idx) + 1
        
        old_block = content[start_idx:end_idx]
        
        new_block = """    waitUntil(Promise.all([
      sendOrderPlaced({
        email: c.email || orderDto.customer.email,
        phone: c.phone || orderDto.customer.phone,
        name,
        orderId,
        total: totals.total,
        customerId,
      }).catch((e) => console.error("[order_placed]", e)),
      
      ...(isNewGuest ? [
        sendWelcome({
          email: c.email || orderDto.customer.email,
          phone: c.phone || orderDto.customer.phone,
          name,
          customerId,
        }).catch((e) => console.error("[welcome]", e))
      ] : []),
      
      sendAdminNewOrderAlert(orderId).catch((e) => console.error("[admin_alert]", e))
    ]));"""
        
        # also remove the if (isNewGuest) block that was in between
        content = content.replace(old_block, new_block)
        
        # We need to remove the if (isNewGuest) block that was after sendOrderPlaced
        content = re.sub(r'    if \(isNewGuest\) \{\s*void sendWelcome\(\{.*?\n\s*\}\)\.catch\(\(e\) => console\.error\("\[welcome\]", e\)\);\s*\}\s*', '', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
