with open("src/app/api/checkout/place-order/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_order_creation = """      const doc = await Order.create({
        orderId,
        firebaseUid: authUser?.uid,
        customerId: customerDoc?._id,
        customer: c,
        shippingAddress: c,
        items: lines.map((l) => ({
          productId: l.productId,
          slug: l.slug,
          name: l.name,
          image: l.image,
          size: l.size,
          color: l.color,
          quantity: l.quantity,
          price: l.price,
          salePrice: l.salePrice,
        })),
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        total: totals.total,
        amountToPayNow: totals.amountToPayNow,
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        couponCode: coupon?.code,
        status: "Confirmation Pending",
      });"""

new_order_creation = """      const doc = await Order.create({
        orderId,
        firebaseUid: authUser?.uid,
        customerId: customerDoc?._id,
        customer: c,
        shippingAddress: c,
        items: lines.map((l) => ({
          productId: l.productId,
          slug: l.slug,
          name: l.name,
          image: l.image,
          size: l.size,
          color: l.color,
          quantity: l.quantity,
          price: l.price,
          salePrice: l.salePrice,
        })),
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        total: totals.total,
        amountToPayNow: totals.amountToPayNow,
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        couponCode: coupon?.code,
        status: "Confirmation Pending",
      });
      
      // Auto-decrement inventory
      const { adjustInventory } = await import("@/services/inventory");
      await adjustInventory(lines.map(l => ({ productId: l.productId, size: l.size, quantity: l.quantity })), false);
"""
content = content.replace(old_order_creation, new_order_creation)

with open("src/app/api/checkout/place-order/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated place-order with inventory logic")
