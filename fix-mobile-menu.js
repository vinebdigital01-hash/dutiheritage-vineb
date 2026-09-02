const fs = require('fs');
const file = 'src/components/Header/MobileMenu.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'className="fixed top-0 left-0 w-screen h-screen bg-[var(--color-overlay)] z-[200] flex"',
  'className="fixed top-0 left-0 w-screen h-[100dvh] bg-[var(--color-overlay)] z-[200] flex"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated MobileMenu.tsx');
