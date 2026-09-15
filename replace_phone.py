import os

replacements = {
    "src/app/layout.tsx": [
        ('"+916901080808"', '"+917017194982"')
    ],
    "src/components/Footer/Footer.tsx": [
        ('"6901080808"', '"+91 7017 194982"')
    ],
    "src/app/privacy-policy/page.tsx": [
        ('+91 69010 80808', '+91 7017 194982')
    ],
    "src/app/return-exchange/page.tsx": [
        ('+91 69010 80808', '+91 7017 194982')
    ],
    "src/app/shipping/page.tsx": [
        ('+91 69010 80808', '+91 7017 194982')
    ]
}

for filepath, reps in replacements.items():
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        for old_str, new_str in reps:
            content = content.replace(old_str, new_str)
            
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Missing {filepath}")
