import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

files_to_fix = [
    'src/app/account/orders/page.tsx',
    'src/components/AccountOrders.tsx'
]

replacements = {
    'â‚¹': '₹',
    'â€”': '—',
    'â€¢': '•',
    'â†’': '→',
    'âœ“': '✓',
    'â€™': '’'
}

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for corrupted, correct in replacements.items():
        content = content.replace(corrupted, correct)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
