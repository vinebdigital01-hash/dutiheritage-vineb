with open("src/app/api/orders/[id]/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_cancel_logic = """    if (order.status === "Cancelled" && prevStatus !== "Cancelled") {
      void sendOrderCancelled({
        ...notifyBase,
        total: order.total,
      }).catch((e) => console.error("[order_cancelled]", e));
    }"""

new_cancel_logic = """    if (order.status === "Cancelled" && prevStatus !== "Cancelled") {
      const { adjustInventory } = await import("@/services/inventory");
      await adjustInventory(order.items.map(l => ({ productId: l.productId, size: l.size, quantity: l.quantity })), true);
      void sendOrderCancelled({
        ...notifyBase,
        total: order.total,
      }).catch((e) => console.error("[order_cancelled]", e));
    }
    
    if (order.status === "Returned" && prevStatus !== "Returned") {
      const { adjustInventory } = await import("@/services/inventory");
      await adjustInventory(order.items.map(l => ({ productId: l.productId, size: l.size, quantity: l.quantity })), true);
    }"""
content = content.replace(old_cancel_logic, new_cancel_logic)

with open("src/app/api/orders/[id]/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated orders id route with inventory logic")
