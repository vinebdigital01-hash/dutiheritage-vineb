with open("src/lib/auth.ts", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "requireAuth" in line or "Staff" in line or "active" in line:
            print(f"Line {i+1}: {line.strip()}")
