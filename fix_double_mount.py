path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove from empty cart
content = content.replace('<Suspense fallback={null}><CheckoutUrlHandler onAutoApplyCoupon={(code) => setAutoApplyTrigger(code)} /></Suspense>\n', '')

# Remove from main form
content = content.replace('<Suspense fallback={null}><CheckoutUrlHandler onAutoApplyCoupon={(code) => setAutoApplyTrigger(code)} /></Suspense>\n            <form', '<form')

# Wrap the WHOLE component return in a fragment, or just add it to both and use a module-level variable to prevent double-execution
# Actually, module-level variable is safest.
module_var = """
let hasProcessedCheckoutUrl = false;

function CheckoutUrlHandler({ onAutoApplyCoupon }: { onAutoApplyCoupon: (code: string) => void }) {
"""
content = content.replace('function CheckoutUrlHandler({ onAutoApplyCoupon }: { onAutoApplyCoupon: (code: string) => void }) {', module_var)

# inside CheckoutUrlHandler, use hasProcessedCheckoutUrl
handler_body_find = '    if (processed) return;'
handler_body_replace = '    if (hasProcessedCheckoutUrl) return;\n    hasProcessedCheckoutUrl = true;'
content = content.replace(handler_body_find, handler_body_replace)

# Put the JSX back into BOTH places (since module level var protects it)
empty_cart_main = '<main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">'
content = content.replace(empty_cart_main, empty_cart_main + '\n        <Suspense fallback={null}><CheckoutUrlHandler onAutoApplyCoupon={(code) => setAutoApplyTrigger(code)} /></Suspense>')

main_form = '<form onSubmit={handleCheckoutSubmit} className="space-y-8">'
content = content.replace(main_form, '<Suspense fallback={null}><CheckoutUrlHandler onAutoApplyCoupon={(code) => setAutoApplyTrigger(code)} /></Suspense>\n            ' + main_form)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
