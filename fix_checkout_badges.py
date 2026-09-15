path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'className="border-none py-0 grid-cols-2 lg:grid-cols-4 gap-y-6"', 
    'className="!border-none !py-0 !border-transparent grid-cols-2 lg:grid-cols-4 gap-y-6"'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
