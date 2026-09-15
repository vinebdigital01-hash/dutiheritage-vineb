with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "inventory" in line.lower() or "trackinventory" in line.lower() or "handleSubmit" in line:
            print(f"Line {i+1}: {line.strip()}")
