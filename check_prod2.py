with open("src/app/products/[slug]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("".join(lines[130:155]))
