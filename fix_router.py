path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# I injected:
# import { Suspense } from "react";
# import { useSearchParams, useRouter } from "next/navigation";
# import { Product } from "@/types";

content = content.replace('import { useSearchParams, useRouter } from "next/navigation";', 'import { useSearchParams } from "next/navigation";')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
