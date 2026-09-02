const fs = require('fs');
const file = 'src/models/Product.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'codAvailable: { type: Boolean, default: true },',
  'codAvailable: { type: Boolean, default: true },\n    isPartialCOD: { type: Boolean, default: false },\n    partialCODAdvance: { type: Number, default: 0 },'
);

fs.writeFileSync(file, content, 'utf8');
console.log('model updated');
