with open("src/app/api/checkout/place-order/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_cancel = """await adjustInventory(lines.map(l => ({ productId: l.productId, size: l.size, quantity: l.quantity })), false);"""
new_cancel = """await adjustInventory(lines.map(l => ({ productId: l.productId, size: l.size || undefined, quantity: l.quantity })), false);"""
content = content.replace(old_cancel, new_cancel)

with open("src/app/api/checkout/place-order/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS error in place-order")
