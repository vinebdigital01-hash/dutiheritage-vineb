const fs = require('fs');
const file = 'src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Partial COD label className
content = content.replace(
  /\$\{codAvailable === false \|\| codChecking \? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"\}\s*\$\{paymentMethod === "partial"/,
  '${isFinalCodAvailable === false || codChecking ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"} ${paymentMethod === "partial"'
);

// Partial COD onChange
content = content.replace(
  /onChange=\{\(\) => \{ if \(codAvailable !== false\) setPaymentMethod\("partial"\); \}\}/,
  'onChange={() => { if (isFinalCodAvailable !== false) setPaymentMethod("partial"); }}'
);

// Partial COD paragraph text dynamicAdvance
content = content.replace(
  'Pay just ₹{settings.partialCodAdvance} today',
  'Pay just ₹{dynamicAdvance} today'
);

// COD label className
content = content.replace(
  /\$\{codAvailable === false \|\| codChecking \? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"\}\s*\$\{paymentMethod === "cod"/,
  '${isFinalCodAvailable === false || codChecking || isPartialCodRequired ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"} ${paymentMethod === "cod"'
);

// COD paragraph text
content = content.replace(
  /\{codAvailable === false \? "COD is not available for your pincode"/,
  '{isFinalCodAvailable === false ? (!productsAllowCod ? "COD is not available for one or more items in your cart" : "COD is not available for your pincode") : isPartialCodRequired ? "Full COD is disabled because one or more items require an advance payment"'
);


fs.writeFileSync(file, content, 'utf8');
console.log('Checkout UI fixed');
