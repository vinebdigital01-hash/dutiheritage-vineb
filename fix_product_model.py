with open("src/models/Product.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'isActive: { type: Boolean, default: true },',
    'isActive: { type: Boolean, default: true },\n    lastEditedBy: { type: String },'
)

with open("src/models/Product.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed Product model")
