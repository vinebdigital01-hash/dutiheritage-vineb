with open("src/app/api/products/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("await Product.create(body);", 'await Product.create({ ...body, lastEditedBy: authUser.name || authUser.email?.split("@")[0] || "Admin" });')

with open("src/app/api/products/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated product POST API for lastEditedBy")
