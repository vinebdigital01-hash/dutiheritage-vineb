with open("src/models/Coupon.ts", "r", encoding="utf-8") as f:
    content = f.read()

import re

old_type = 'enum: ["PERCENT", "FLAT"],'
new_type = 'enum: ["PERCENT", "FLAT", "BUY_X_PERCENT", "BUY_X_GET_Y_FREE"],'

content = content.replace(old_type, new_type)

old_schema_fields = """    targetIds: { type: [String], default: [] },
    usageLimit: { type: Number },"""
new_schema_fields = """    targetIds: { type: [String], default: [] },
    minQuantity: { type: Number, default: 0 },
    freeQuantity: { type: Number, default: 0 },
    usageLimit: { type: Number },"""

content = content.replace(old_schema_fields, new_schema_fields)

with open("src/models/Coupon.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Coupon.ts")
