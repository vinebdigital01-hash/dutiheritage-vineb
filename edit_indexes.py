import re

def add_index(path, index_code):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if index_code not in content:
        content = content.replace("export type ", index_code + "\nexport type ")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

add_index("src/models/Product.ts", "ProductSchema.index({ slug: 1 }, { unique: true });\n")
add_index("src/models/Order.ts", "OrderSchema.index({ orderNumber: 1 }, { unique: true });\nOrderSchema.index({ \"customer.email\": 1 });\n")
add_index("src/models/Collection.ts", "CollectionSchema.index({ slug: 1 }, { unique: true });\n")
