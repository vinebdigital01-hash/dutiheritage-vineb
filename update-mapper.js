const fs = require('fs');
const file = 'src/lib/mappers.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'codAvailable: (doc.codAvailable as boolean | undefined) ?? true,',
  'codAvailable: (doc.codAvailable as boolean | undefined) ?? true,\n    isPartialCOD: (doc.isPartialCOD as boolean | undefined) ?? false,\n    partialCODAdvance: (doc.partialCODAdvance as number | undefined) ?? 0,'
);

fs.writeFileSync(file, content, 'utf8');
console.log('mapper updated');
