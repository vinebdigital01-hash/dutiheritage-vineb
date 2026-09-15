with open("src/app/api/orders/export/route.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("".join(lines[:60]))
