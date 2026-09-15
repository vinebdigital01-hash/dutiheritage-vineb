with open("src/services/checkout.ts", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "export async function validateCoupon" in line:
            print(f"Line {i+1}")
