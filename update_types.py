with open("src/types/index.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "inventory?: { size?: string; stock: number; sku?: string }[];",
    "inventory?: { size?: string; stock: number; sku?: string }[];\n  lastEditedBy?: string;\n  updatedAt?: string;"
)

with open("src/types/index.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Product type")
