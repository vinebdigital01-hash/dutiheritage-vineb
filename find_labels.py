with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "label=" in line and ("name" in line.lower() or "title" in line.lower() or "description" in line.lower()):
            print(f"Line {i+1}: {line.strip()}")
