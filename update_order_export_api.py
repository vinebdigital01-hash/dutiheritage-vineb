with open("src/app/api/orders/export/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const status = searchParams.get("status");',
    'const status = searchParams.get("status");\n    const paymentMethod = searchParams.get("paymentMethod");'
)

content = content.replace(
    'if (status) {\n      query.status = status;\n    }',
    'if (status) {\n      query.status = status;\n    }\n    if (paymentMethod) {\n      query.paymentMethod = paymentMethod;\n    }'
)

with open("src/app/api/orders/export/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated API to support paymentMethod filter")
