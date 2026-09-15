with open("src/services/inventory.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("await Product.bulkWrite(operations);", "await Product.bulkWrite(operations as any);")

with open("src/services/inventory.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed inventory.ts TS error")
