with open("src/app/products/[slug]/ProductClient.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "mainActionsRef" in line or "Add to Cart" in line:
            print(f"Line {i+1}: {line.strip()}")
