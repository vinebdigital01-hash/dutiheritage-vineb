import sys
sys.stdout.reconfigure(encoding='utf-8')
with open("src/app/admin/orders/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("".join(lines[130:155]))
