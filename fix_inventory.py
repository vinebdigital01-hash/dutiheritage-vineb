with open("src/services/inventory.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'await Product.find({ _id: { $in: productIds } }).lean();',
    'await Product.find({ _id: { $in: productIds } } as any).lean();'
)

with open("src/services/inventory.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed inventory.ts type error")
