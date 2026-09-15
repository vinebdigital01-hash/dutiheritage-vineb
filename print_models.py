for file in ["src/models/Order.ts", "src/models/Event.ts", "src/models/Cart.ts"]:
    try:
        with open(file, "r", encoding="utf-8") as f:
            print(f"--- {file} ---")
            lines = f.readlines()
            for line in lines[:30]:
                print(line.strip())
    except Exception as e:
        print(e)
