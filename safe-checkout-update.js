const fs = require('fs');
const file = 'src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert logic block just before "const codCharge = paymentMethod === 'cod'"
const logicBlock = `
  const productsAllowCod = cart.every(item => item.codAvailable !== false);
  const isFinalCodAvailable = codAvailable !== false && productsAllowCod;
  
  const productAdvanceAmount = cart.reduce((sum, item) => sum + (item.isPartialCOD ? (item.partialCODAdvance || 0) * item.quantity : 0), 0);
  const isPartialCodRequired = productAdvanceAmount > 0;
  
  React.useEffect(() => {
    if (isFinalCodAvailable === false && (paymentMethod === "cod" || paymentMethod === "partial")) {
      setPaymentMethod("prepaid");
    } else if (isPartialCodRequired && paymentMethod === "cod") {
      setPaymentMethod("partial");
    }
  }, [isFinalCodAvailable, isPartialCodRequired, paymentMethod]);

  const codCharge = paymentMethod === "cod" ? settings.codExtraCharge : 0;`;
content = content.replace('const codCharge = paymentMethod === "cod" ? settings.codExtraCharge : 0;', logicBlock);


// 2. Update advanceAmount logic
const advanceLogicOld = `const advanceAmount = Math.min(settings.partialCodAdvance, total);\n  const amountToPayNow = paymentMethod === "partial" ? advanceAmount : (paymentMethod === "cod" ? 0 : total);`;
const advanceLogicNew = `const dynamicAdvance = isPartialCodRequired ? productAdvanceAmount : settings.partialCodAdvance;
  const advanceAmount = Math.min(dynamicAdvance, total);
  const amountToPayNow = paymentMethod === "partial" ? advanceAmount : (paymentMethod === "cod" ? 0 : total);`;
content = content.replace(advanceLogicOld, advanceLogicNew);


// 3. Update COD indicator box
const oldIndicator = `codAvailable ? (
                      <><span>✅</span> COD &amp; Prepaid both available for {formData.pinCode}</>
                    ) : (
                      <><span>⚠️</span> Only Prepaid available for {formData.pinCode}. COD not serviceable.</>
                    )`;
const newIndicator = `(codAvailable !== false && productsAllowCod) ? (
                      <><span>✅</span> COD &amp; Prepaid both available</>
                    ) : (
                      <><span>⚠️</span> {!productsAllowCod ? "COD is disabled for one or more items in your cart." : \`Only Prepaid available for \${formData.pinCode}. COD not serviceable.\`}</>
                    )`;
content = content.replace(oldIndicator, newIndicator);


// 4. Update Partial COD UI
content = content.replace(
  /\$\{codAvailable === false \|\| codChecking \? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"\}[\s\S]*?\$\{paymentMethod === "partial"/,
  '${isFinalCodAvailable === false || codChecking ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"}\n${paymentMethod === "partial"'
);
content = content.replace(
  /onChange=\{\(\) => \{ if \(codAvailable !== false\) setPaymentMethod\("partial"\); \}\}/,
  'onChange={() => { if (isFinalCodAvailable !== false) setPaymentMethod("partial"); }}'
);
content = content.replace(/Pay ₹\{settings\.partialCodAdvance\} Advance/, 'Pay ₹{dynamicAdvance} Advance');
content = content.replace(/Pay just ₹\{settings\.partialCodAdvance\} today/, 'Pay just ₹{dynamicAdvance} today');
content = content.replace(
  /disabled=\{codAvailable === false \|\| codChecking\}/,
  'disabled={isFinalCodAvailable === false || codChecking}'
);
content = content.replace(
  /\{codAvailable === false \? "COD is not available for your pincode"/,
  '{isFinalCodAvailable === false ? (!productsAllowCod ? "COD is not available for one or more items in your cart" : "COD is not available for your pincode")'
);


// 5. Update Full COD UI
content = content.replace(
  /\$\{codAvailable === false \|\| codChecking \? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"\}[\s\S]*?\$\{paymentMethod === "cod"/,
  '${isFinalCodAvailable === false || codChecking || isPartialCodRequired ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"}\n${paymentMethod === "cod"'
);
content = content.replace(
  /onChange=\{\(\) => \{ if \(codAvailable !== false\) setPaymentMethod\("cod"\); \}\}/,
  'onChange={() => { if (isFinalCodAvailable !== false && !isPartialCodRequired) setPaymentMethod("cod"); }}'
);
content = content.replace(
  /disabled=\{codAvailable === false \|\| codChecking\}/,
  'disabled={isFinalCodAvailable === false || codChecking || isPartialCodRequired}'
);
content = content.replace(
  /\{codAvailable === false \? "COD is not available for your pincode"/,
  '{isFinalCodAvailable === false ? (!productsAllowCod ? "COD is not available for one or more items in your cart" : "COD is not available for your pincode") : isPartialCodRequired ? "Full COD is disabled because one or more items require an advance payment"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Checkout UI fixed completely and safely');
