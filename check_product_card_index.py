with open("src/components/ProductCard/index.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "out" in line.lower() or "stock" in line.lower() or "inventory" in line.lower():
            print(f"Line {i+1}: {line.strip()}")
