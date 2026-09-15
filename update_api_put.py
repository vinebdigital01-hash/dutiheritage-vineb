with open("src/app/api/products/[id]/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_update = """    const updateData = {
      ...body,
      updatedAt: new Date(),
    };"""

new_update = """    const updateData = {
      ...body,
      lastEditedBy: authUser.name || authUser.email?.split("@")[0] || "Admin",
      updatedAt: new Date(),
    };"""

if old_update in content:
    content = content.replace(old_update, new_update)
else:
    # If the exact string isn't found, just do a simpler replace
    content = content.replace("const updateData = {", "const updateData = {\n      lastEditedBy: authUser.name || authUser.email?.split(\"@\")[0] || \"Admin\",")

with open("src/app/api/products/[id]/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated product PUT API for lastEditedBy")
