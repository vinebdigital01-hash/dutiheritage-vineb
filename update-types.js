const fs = require('fs');
const file = 'src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'codAvailable?: boolean;',
  'codAvailable?: boolean;\n  isPartialCOD?: boolean;\n  partialCODAdvance?: number;'
);

fs.writeFileSync(file, content, 'utf8');
console.log('types updated');
