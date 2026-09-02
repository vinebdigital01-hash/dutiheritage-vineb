const fs = require('fs');
const file = 'src/app/admin/products/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const escapeStr = \(str\) => {/g,
    'const escapeStr = (str: any) => {'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed typescript error');
