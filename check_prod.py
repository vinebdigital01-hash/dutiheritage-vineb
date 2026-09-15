with open("src/app/products/[slug]/page.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "offers" in line:
            print(f"Found 'offers' at line {i+1}")
