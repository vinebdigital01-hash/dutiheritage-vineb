with open("src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('status={o.paymentStatus === "paid" ? "success" : o.paymentStatus === "failed" ? "error" : "warning"}', 'tone={o.paymentStatus === "paid" ? "success" : o.paymentStatus === "failed" ? "danger" : "warning"}')
content = content.replace('status={["Shipped", "Delivered"].includes(o.status) ? "success" : ["Cancelled", "Returned"].includes(o.status) ? "error" : "info"}', 'tone={["Shipped", "Delivered"].includes(o.status) ? "success" : ["Cancelled", "Returned"].includes(o.status) ? "danger" : "info"}')

with open("src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed Badge props")
