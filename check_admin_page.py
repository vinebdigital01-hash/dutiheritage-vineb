with open("src/app/admin/reviews/page.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "Add Marketing Review" in line or "Bulk CSV" in line or "csvData.map" in line or "setForm" in line:
            print(f"Line {i+1}: {line.strip()}")
