with open("src/app/api/orders/[id]/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_cancel = """await adjustInventory(order.items.map(l => ({ productId: l.productId, size: l.size, quantity: l.quantity })), true);"""
new_cancel = """await adjustInventory(order.items.map(l => ({ productId: l.productId, size: l.size || undefined, quantity: l.quantity })), true);"""
content = content.replace(old_cancel, new_cancel)

with open("src/app/api/orders/[id]/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS error in route.ts")
