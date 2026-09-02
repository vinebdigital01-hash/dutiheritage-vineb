const fs = require('fs');
const file = 'src/app/api/products/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'codAvailable: body.codAvailable !== false,',
  'codAvailable: body.codAvailable !== false,\n        isPartialCOD: Boolean(body.isPartialCOD),\n        partialCODAdvance: Number(body.partialCODAdvance) || 0,'
);

fs.writeFileSync(file, content, 'utf8');
console.log('POST api updated');
