path = "src/models/Order.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Delete the bad indices at the top
bad_str = "OrderSchema.index({ orderNumber: 1 }, { unique: true });\nOrderSchema.index({ \"customer.email\": 1 });\n\nexport type OrderStatus"
content = content.replace(bad_str, "export type OrderStatus")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
