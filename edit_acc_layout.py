path = "src/app/account/layout.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'description: "Manage your account, orders, addresses, and more.",',
    'description: "Manage your account, orders, addresses, and more.",\n  robots: { index: false, follow: false },'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
