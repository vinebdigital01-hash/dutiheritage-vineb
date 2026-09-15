for file in ["src/app/api/checkout/create-razorpay-order/route.ts", "src/app/api/checkout/place-order/route.ts"]:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    old_call = """const coupon = await resolveCouponDiscount(body.couponCode, subtotalPreview, {
      productIds: lines.map((l) => l.productId),
      collectionIds: lines.map((l) => l.collectionId),
    });"""
    
    new_call = """const coupon = await resolveCouponDiscount(body.couponCode, subtotalPreview, {
      productIds: lines.map((l) => l.productId),
      collectionIds: lines.map((l) => l.collectionId).filter(Boolean) as string[],
      items: lines.map((l) => ({
        productId: l.productId,
        collectionId: l.collectionId,
        price: l.salePrice ?? l.price,
        quantity: l.quantity,
      })),
    });"""
    
    content = content.replace(old_call, new_call)
    
    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
print("Updated route.ts files")
