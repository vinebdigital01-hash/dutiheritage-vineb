const fs = require('fs');
const file = 'src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexVars = /const codCharge = paymentMethod === "cod" \? settings\.codExtraCharge : 0;[\s\S]*?const amountToPayNow = paymentMethod === "partial" \? advanceAmount : \(paymentMethod === "cod" \? 0 : total\);/;

const newVars = `
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

  const codCharge = paymentMethod === "cod" ? settings.codExtraCharge : 0;
  const total = Math.max(0, subtotal + shipping - discountAmount + codCharge - prepaidDiscount);
  
  const dynamicAdvance = isPartialCodRequired ? productAdvanceAmount : settings.partialCodAdvance;
  const advanceAmount = Math.min(dynamicAdvance, total);
  const amountToPayNow = paymentMethod === "partial" ? advanceAmount : (paymentMethod === "cod" ? 0 : total);`;

content = content.replace(regexVars, newVars);

// Now update the COD Availability Indicator UI
const regexIndicator = /\{codAvailable \? \([\s\S]*?COD &amp; Prepaid both available for \{formData\.pinCode\}<\/>[^<]*\) : \([\s\S]*?Only Prepaid available for \{formData\.pinCode\}\. COD not serviceable\.[^<]*\)<\/div>/;

const newIndicator = `{codAvailable && productsAllowCod ? (
                      <><span>✅</span> COD &amp; Prepaid both available</>
                    ) : (
                      <><span>⚠️</span> {!productsAllowCod ? "COD is disabled for one or more items in your cart." : \`Only Prepaid available for \${formData.pinCode}. COD not serviceable.\`}</>
                    )}</div>`;

// Wait, the original was:
/*
{codChecking ? (
  <><span className="animate-pulse">⏳</span> Checking delivery options...</>
) : codAvailable ? (
  <><span>✅</span> COD &amp; Prepaid both available for {formData.pinCode}</>
) : (
  <><span>⚠️</span> Only Prepaid available for {formData.pinCode}. COD not serviceable.</>
)}
*/

content = content.replace(
  'codAvailable ? (\n                      <><span>✅</span> COD &amp; Prepaid both available for {formData.pinCode}</>\n                    ) : (\n                      <><span>⚠️</span> Only Prepaid available for {formData.pinCode}. COD not serviceable.</>\n                    )',
  '(codAvailable && productsAllowCod) ? (\n                      <><span>✅</span> COD &amp; Prepaid both available</>\n                    ) : (\n                      <><span>⚠️</span> {!productsAllowCod ? "COD is disabled for one or more items in your cart." : `Only Prepaid available for ${formData.pinCode}. COD not serviceable.`}</>\n                    )'
);

// Update Partial COD UI
content = content.replace(
  'Pay ₹{settings.partialCodAdvance} Advance',
  'Pay ₹{dynamicAdvance} Advance'
);
content = content.replace(
  'Pay just ₹{settings.partialCodAdvance} today',
  'Pay just ₹{dynamicAdvance} today'
);

content = content.replace(
  'disabled={codAvailable === false || codChecking}',
  'disabled={isFinalCodAvailable === false || codChecking}'
);
content = content.replace(
  'codAvailable === false ? "COD is not available for your pincode"',
  'isFinalCodAvailable === false ? (!productsAllowCod ? "COD is not available for one or more items in your cart" : "COD is not available for your pincode")'
);

// Update COD UI (it is below Partial COD, so we can do a global replace for the disabled state, but we need to specifically disable COD if isPartialCodRequired is true)
content = content.replace(
  'name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => { if (codAvailable !== false) setPaymentMethod("cod"); }} disabled={codAvailable === false || codChecking}',
  'name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => { if (isFinalCodAvailable !== false && !isPartialCodRequired) setPaymentMethod("cod"); }} disabled={isFinalCodAvailable === false || codChecking || isPartialCodRequired}'
);

// Also update the class for COD label to gray it out
content = content.replace(
  '${codAvailable === false || codChecking ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"}\n${paymentMethod === "cod" ?',
  '${(isFinalCodAvailable === false || codChecking || isPartialCodRequired) ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"}\n${paymentMethod === "cod" ?'
);
content = content.replace(
  '${codAvailable === false || codChecking ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"} \n${paymentMethod === "cod" ? "border-black bg-gray-50"',
  '${(isFinalCodAvailable === false || codChecking || isPartialCodRequired) ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"} \n${paymentMethod === "cod" ? "border-black bg-gray-50"'
);


fs.writeFileSync(file, content, 'utf8');
console.log('Checkout updated');
