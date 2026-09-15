path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import_suspense = 'import { Suspense } from "react";\nimport { useSearchParams, useRouter } from "next/navigation";\nimport { Product } from "@/types";\n'

if "useSearchParams" not in content:
    content = content.replace(
        'import React, { useState, useEffect, useMemo } from "react";\n',
        'import React, { useState, useEffect, useMemo } from "react";\n' + import_suspense
    )

handler_code = """
function CheckoutUrlHandler({ onAutoApplyCoupon }: { onAutoApplyCoupon: (code: string) => void }) {
  const searchParams = useSearchParams();
  const { addToCart } = useAppContext();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    
    const productSlug = searchParams?.get("product");
    const couponCode = searchParams?.get("coupon");
    const size = searchParams?.get("size") || "M";

    const applyData = async () => {
      try {
        if (productSlug) {
          const res = await fetch(`/api/products/${productSlug}`);
          if (res.ok) {
            const product = await res.json();
            addToCart(product, size);
          }
        }
        if (couponCode) {
          onAutoApplyCoupon(couponCode);
        }
        
        if (productSlug || couponCode) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("product");
          newUrl.searchParams.delete("size");
          newUrl.searchParams.delete("coupon");
          window.history.replaceState({}, "", newUrl.toString());
        }
      } catch (err) {
        console.error("Direct checkout link error:", err);
      } finally {
        setProcessed(true);
      }
    };
    
    applyData();
  }, [searchParams, addToCart, processed, onAutoApplyCoupon]);

  return null;
}
"""

if "CheckoutUrlHandler" not in content:
    content = content.replace(
        'export default function CheckoutPage() {',
        handler_code + '\nexport default function CheckoutPage() {'
    )

# Now, we need to pass the onAutoApplyCoupon handler to it. We must ensure the component handles it when cart is ready.
# Wait, handleApplyDiscount needs the latest cart. 
# We can just set discountCode and trigger validation in a useEffect if cart is > 0.
if "const [autoApplyTrigger, setAutoApplyTrigger] = useState<string | null>(null);" not in content:
    content = content.replace(
        'const [validatingCoupon, setValidatingCoupon] = useState(false);',
        'const [validatingCoupon, setValidatingCoupon] = useState(false);\n  const [autoApplyTrigger, setAutoApplyTrigger] = useState<string | null>(null);'
    )

# Inject useEffect for autoApplyTrigger
auto_apply_effect = """
  useEffect(() => {
    if (autoApplyTrigger && cart.length > 0) {
      setDiscountCode(autoApplyTrigger);
      // Wait for React to update the state before calling handleApplyDiscount
      setTimeout(() => {
        handleApplyDiscount(new Event("submit") as any, autoApplyTrigger);
        setAutoApplyTrigger(null);
      }, 500);
    }
  }, [autoApplyTrigger, cart]);

  // Modified handleApplyDiscount to accept an optional code override
  const handleApplyDiscount = async (e: React.FormEvent, overrideCode?: string) => {
    if (e?.preventDefault) e.preventDefault();
"""
if "const handleApplyDiscount = async (e: React.FormEvent, overrideCode?: string) =>" not in content:
    content = content.replace(
        'const handleApplyDiscount = async (e: React.FormEvent) => {\n    e.preventDefault();',
        auto_apply_effect
    )
    # Fix the reference inside handleApplyDiscount
    content = content.replace(
        'const code = discountCode.trim().toUpperCase();',
        'const code = (overrideCode || discountCode).trim().toUpperCase();'
    )

# Add the Suspense boundary around the handler at the top of the form
if "<CheckoutUrlHandler" not in content:
    content = content.replace(
        '<form onSubmit={handleCheckoutSubmit} className="space-y-8">',
        '<Suspense fallback={null}><CheckoutUrlHandler onAutoApplyCoupon={(code) => setAutoApplyTrigger(code)} /></Suspense>\n            <form onSubmit={handleCheckoutSubmit} className="space-y-8">'
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
