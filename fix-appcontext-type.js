const fs = require('fs');
const file = 'src/context/AppContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'addToCart: (product: Product, size: string) => void;',
  'addToCart: (product: Product, size: string, color?: string) => void;'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed AppContext Interface');
