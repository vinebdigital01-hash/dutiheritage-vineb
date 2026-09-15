with open("src/components/admin/charts/RevenueChart.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("formatter={(value: number)", "formatter={(value: any)")

with open("src/components/admin/charts/RevenueChart.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS error in RevenueChart")
