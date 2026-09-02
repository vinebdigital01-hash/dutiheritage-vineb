const fs = require('fs');
const file = 'src/components/CartDrawer/CartDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<p className="text-[12px] text-[var(--color-text-muted)] mt-1">Size: {item.selectedSize}</p>',
  '<p className="text-[12px] text-[var(--color-text-muted)] mt-1">Size: {item.selectedSize}{item.selectedColor ?  | Color:  : ""}</p>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('CartDrawer updated!');
