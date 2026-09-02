const fs = require('fs');
const file = 'src/components/admin/ProductForm.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /codAvailable:\s*true,\s*isActive:\s*true,/,
  'codAvailable: true,\n    isPartialCOD: false,\n    partialCODAdvance: "0",\n    isActive: true,'
);

fs.writeFileSync(file, content, 'utf8');
console.log('emptyForm updated');
