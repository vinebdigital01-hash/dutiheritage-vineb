const fs = require('fs');
const files = [
  "src/app/account/page.tsx",
  "src/app/admin/coupons/page.tsx",
  "src/app/admin/staff/page.tsx",
  "src/app/checkout/success/page.tsx",
  "src/components/admin/ProductForm.tsx",
  "src/components/admin/AdminShell.tsx",
  "src/app/account/AccountSidebarWrapper.tsx",
  "src/app/account/wishlist/page.tsx",
  "src/app/account/orders/page.tsx",
  "src/app/account/coupons/page.tsx"
];

for (const file of files) {
  if (fs.existsSync(file)) {
    const buf = fs.readFileSync(file);
    let str = buf.toString('utf8');
    
    // Explicitly replace literal characters just in case it was encoded weirdly
    str = str.replace(/\uFEFF/g, '');
    str = str.replace(/ï»¿/g, ''); 
    
    fs.writeFileSync(file, str, 'utf8');
    console.log("Cleaned", file);
  }
}
