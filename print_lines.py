with open("src/app/api/checkout/place-order/route.ts", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "razorpay" in line.lower() or "verify" in line.lower():
            print(f"Line {i+1}: {line.strip()}")
