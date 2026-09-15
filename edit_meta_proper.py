import re

def update_metadata(path, title, desc):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace existing metadata title
    content = re.sub(
        r'title: ".*?"',
        f'title: "{title}"',
        content,
        count=1
    )
    
    # Replace existing metadata description
    content = re.sub(
        r'description: ".*?"',
        f'description: "{desc}"',
        content,
        count=1
    )
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

update_metadata(
    "src/app/return-exchange/page.tsx", 
    "Exchange Policy | Duti Heritage", 
    "Exchange policy for Duti Heritage. No returns accepted. Size exchange and defective product exchange available within 24 hours of delivery."
)
update_metadata(
    "src/app/shipping/page.tsx", 
    "Delivery & Shipping Policy | Duti Heritage", 
    "Free shipping on prepaid orders. Pan India delivery in 3-7 working days. COD available with partial advance. Dispatch within 48-72 hours."
)
