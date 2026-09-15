with open("src/app/products/[slug]/ProductClient.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "size" in line.lower() or "stock" in line.lower() or "inventory" in line.lower() or "trackinventory" in line.lower():
            print(f"Line {i+1}: {line.strip()}")
