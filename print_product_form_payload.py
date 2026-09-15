import sys
sys.stdout.reconfigure(encoding='utf-8')
with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("".join(lines[245:280]))
