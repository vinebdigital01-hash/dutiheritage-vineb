import sys
sys.stdout.reconfigure(encoding='utf-8')
with open("src/app/admin/reviews/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("".join(lines[120:170]))
