with open("src/app/api/coupons/validate/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_call = """    const result = await validateCouponCode({
      code,
      subtotal,
      productIds: body.productIds,
      collectionIds: body.collectionIds,
    });"""

new_call = """    const result = await validateCouponCode({
      code,
      subtotal,
      productIds: body.productIds,
      collectionIds: body.collectionIds,
      items: body.items,
    });"""

content = content.replace(old_call, new_call)

with open("src/app/api/coupons/validate/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated validate/route.ts")
