const fs = require('fs');
const file = 'src/components/CartDrawer/CartDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /className="fixed top-0 right-0 h-full w-full/g,
  'className="fixed top-0 right-0 h-[100dvh] w-full'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated CartDrawer.tsx');
