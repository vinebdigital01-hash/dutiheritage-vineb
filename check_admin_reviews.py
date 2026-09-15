import sys
sys.stdout.reconfigure(encoding='utf-8')
with open("src/app/admin/reviews/page.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "createdAt" in line or "Date" in line or "date" in line:
            print(f"Line {i+1}: {line.strip()}")
