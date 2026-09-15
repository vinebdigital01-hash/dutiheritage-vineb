with open("src/components/admin/AdminShell.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "role" in line or "auth" in line or "fetch" in line:
            print(f"Line {i+1}: {line.strip()}")
