with open("src/app/api/coupons/[id]/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_discount = """    if (body.discountType !== undefined) {
      if (!["PERCENT", "FLAT"].includes(body.discountType)) {
        throw new ApiError("discountType must be PERCENT or FLAT");
      }
      coupon.discountType = body.discountType;
    }"""

new_discount = """    if (body.discountType !== undefined) {
      if (!["PERCENT", "FLAT", "BUY_X_PERCENT", "BUY_X_GET_Y_FREE"].includes(body.discountType)) {
        throw new ApiError("Invalid discountType");
      }
      coupon.discountType = body.discountType;
    }"""
content = content.replace(old_discount, new_discount)

old_target = """    if (body.targetIds !== undefined) coupon.targetIds = body.targetIds;"""
new_target = """    if (body.targetIds !== undefined) coupon.targetIds = body.targetIds;
    if (body.minQuantity !== undefined) coupon.minQuantity = Number(body.minQuantity) || 0;
    if (body.freeQuantity !== undefined) coupon.freeQuantity = Number(body.freeQuantity) || 0;"""
content = content.replace(old_target, new_target)

with open("src/app/api/coupons/[id]/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated coupon id route")
