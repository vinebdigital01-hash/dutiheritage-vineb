with open("src/services/db.ts", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "inventory" in line or "toProduct" in line:
            print(f"Line {i+1}: {line.strip()}")
