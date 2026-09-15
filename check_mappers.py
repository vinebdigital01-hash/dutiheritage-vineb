import sys
sys.stdout.reconfigure(encoding='utf-8')
with open("src/lib/mappers.ts", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "inventory" in line or "trackInventory" in line:
            print(f"Line {i+1}: {line.strip()}")
