import sys
sys.stdout.reconfigure(encoding='utf-8')
with open("src/app/api/orders/export/route.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("".join(lines[30:]))
