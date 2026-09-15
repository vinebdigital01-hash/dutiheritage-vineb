import sys
sys.stdout.reconfigure(encoding='utf-8')
with open("src/app/products/[slug]/page.tsx", "r", encoding="utf-8") as f:
    print(f.read()[:500])
