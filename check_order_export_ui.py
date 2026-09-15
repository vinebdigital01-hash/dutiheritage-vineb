with open("src/app/admin/orders/page.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "Export" in line or "export" in line:
            print(f"Line {i+1}: {line.strip()}")
