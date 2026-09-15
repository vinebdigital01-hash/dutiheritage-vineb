path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

handler_jsx = '<Suspense fallback={null}><CheckoutUrlHandler onAutoApplyCoupon={(code) => setAutoApplyTrigger(code)} /></Suspense>'

empty_cart_main = '<main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">'

if handler_jsx not in content.split(empty_cart_main)[1]:
    content = content.replace(
        empty_cart_main,
        empty_cart_main + '\n        ' + handler_jsx
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
