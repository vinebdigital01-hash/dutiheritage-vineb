with open("src/app/api/products/[id]/route.ts", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "revalidate" in line:
            print(f"Line {i+1}: {line.strip()}")
