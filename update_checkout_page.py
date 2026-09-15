with open("src/app/checkout/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_body = """        body: JSON.stringify({
          code,
          subtotal,
          productIds: cart.map((i) => i.id),
          collectionIds: cart.map((i) => i.collectionId),
        }),"""

new_body = """        body: JSON.stringify({
          code,
          subtotal,
          productIds: cart.map((i) => i.id),
          collectionIds: cart.map((i) => i.collectionId),
          items: cart.map(i => ({
            productId: i.id,
            collectionId: i.collectionId,
            price: i.salePrice ?? i.price,
            quantity: i.quantity
          })),
        }),"""

content = content.replace(old_body, new_body)

with open("src/app/checkout/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated checkout page")
