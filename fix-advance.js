const fs = require('fs');
const file = 'src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const advanceAmount = Math\.min\(settings\.partialCodAdvance, total\);[\s\S]*?const amountToPayNow =[\s\S]*?;/;

const newLogic = `const dynamicAdvance = isPartialCodRequired ? productAdvanceAmount : settings.partialCodAdvance;
  const advanceAmount = Math.min(dynamicAdvance, total);
  const payOnDeliveryAmount = paymentMethod === "partial" ? total - advanceAmount : 0;
  const amountToPayNow = paymentMethod === "partial" ? advanceAmount : (paymentMethod === "cod" ? 0 : total);`;

if (content.match(regex)) {
  content = content.replace(regex, newLogic);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated advance logic');
} else {
  console.log('Regex did not match');
}
