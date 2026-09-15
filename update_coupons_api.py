with open("src/app/api/coupons/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_validation = """    const discountType = body.discountType as "PERCENT" | "FLAT";
    if (!["PERCENT", "FLAT"].includes(discountType)) {
      throw new ApiError("discountType must be PERCENT or FLAT");
    }

    const discountValue = Number(body.discountValue);
    if (Number.isNaN(discountValue) || discountValue < 0) {
      throw new ApiError("Valid discountValue is required");
    }"""

new_validation = """    const discountType = body.discountType;
    if (!["PERCENT", "FLAT", "BUY_X_PERCENT", "BUY_X_GET_Y_FREE"].includes(discountType)) {
      throw new ApiError("Invalid discountType");
    }

    const discountValue = Number(body.discountValue) || 0;
    const minQuantity = Number(body.minQuantity) || 0;
    const freeQuantity = Number(body.freeQuantity) || 0;"""
    
content = content.replace(old_validation, new_validation)

old_create = """      code,
      discountType,
      discountValue,
      scope: body.scope || "ALL_PRODUCTS","""
      
new_create = """      code,
      discountType,
      discountValue,
      minQuantity,
      freeQuantity,
      scope: body.scope || "ALL_PRODUCTS","""
      
content = content.replace(old_create, new_create)

with open("src/app/api/coupons/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated coupons API POST")
