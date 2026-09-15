import json
import os

filepath = "vercel.json"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if "crons" in data:
        data["crons"] = [c for c in data["crons"] if c.get("path") != "/api/reports/monthly"]
        
        # If no crons left, remove the key entirely
        if len(data["crons"]) == 0:
            del data["crons"]
            
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("Cleaned vercel.json")
else:
    print("No vercel.json found")
