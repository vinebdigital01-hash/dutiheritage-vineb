const fs = require('fs');
const file = 'src/app/api/products/[id]/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'if (body.codAvailable !== undefined) existing.codAvailable = Boolean(body.codAvailable);',
  'if (body.codAvailable !== undefined) existing.codAvailable = Boolean(body.codAvailable);\n    if (body.isPartialCOD !== undefined) existing.isPartialCOD = Boolean(body.isPartialCOD);\n    if (body.partialCODAdvance !== undefined) existing.partialCODAdvance = Number(body.partialCODAdvance);'
);

fs.writeFileSync(file, content, 'utf8');
console.log('PUT api updated');
