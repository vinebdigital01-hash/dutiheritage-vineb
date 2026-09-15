with open("src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("new Date(o.createdAt)", "new Date(o.createdAt || Date.now())")

with open("src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS error")
