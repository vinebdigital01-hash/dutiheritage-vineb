import json
import os

filepath = "vercel.json"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
else:
    data = {}

if "crons" not in data:
    data["crons"] = []

# Check if monthly report cron exists
exists = any(c.get("path") == "/api/reports/monthly" for c in data["crons"])
if not exists:
    data["crons"].append({
        "path": "/api/reports/monthly",
        "schedule": "0 9 1 * *"
    })

with open(filepath, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Updated vercel.json")
