with open("src/app/admin/collections/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add editDiscountBanner state
content = content.replace("const [editName, setEditName] = useState(\"\");", "const [editName, setEditName] = useState(\"\");\n  const [editDiscountBanner, setEditDiscountBanner] = useState(\"\");")

# Update create payload - actually I'll just leave create as is, or add discountBanner. Let's not complicate create. Let's just add it to edit.
content = content.replace("body: JSON.stringify({ name: editName }),", "body: JSON.stringify({ name: editName, discountBanner: editDiscountBanner }),")

# Find the edit mode logic to setEditDiscountBanner
# Look for `setEditId(c.id); setEditName(c.name);`
content = content.replace("setEditName(c.name);", "setEditName(c.name);\n                          setEditDiscountBanner(c.discountBanner || \"\");")

# Add input for discount banner in the edit mode
old_edit_ui = """                          <AdminInput
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Collection Name"
                          />"""

new_edit_ui = """                          <div className="flex flex-col gap-2 w-full">
                            <AdminInput
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Collection Name"
                            />
                            <AdminInput
                              value={editDiscountBanner}
                              onChange={(e) => setEditDiscountBanner(e.target.value)}
                              placeholder="Banner Text (e.g. Buy 2, Get 15% Off)"
                            />
                          </div>"""

content = content.replace(old_edit_ui, new_edit_ui)

with open("src/app/admin/collections/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Collection Admin Page UI")
