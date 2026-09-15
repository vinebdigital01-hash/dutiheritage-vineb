with open("src/models/Product.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "inventory: [",
    "lastEditedBy: { type: String },\n    inventory: ["
)

with open("src/models/Product.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Added lastEditedBy to Product model")
