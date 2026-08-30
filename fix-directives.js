const fs = require('fs');
const glob = require('glob'); // Not available natively, let's just loop over known files
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
    let content = fs.readFileSync(file, 'utf8');
    const hasUseClient = content.includes('"use client"');
    const hasUseServer = content.includes('"use server"');
    
    let needsFix = false;
    let directive = null;
    
    if (hasUseClient && !content.trim().startsWith('"use client"')) {
      content = content.replace(/["']use client["'];?\s*/g, '');
      directive = '"use client";';
      needsFix = true;
    }
    
    if (hasUseServer && !content.trim().startsWith('"use server"')) {
      content = content.replace(/["']use server["'];?\s*/g, '');
      directive = '"use server";';
      needsFix = true;
    }
    
    if (needsFix && directive) {
      // Remove any UTF-8 BOM if present so directive is absolute first char
      content = content.replace(/^\uFEFF/, '');
      content = directive + "\n" + content;
      fs.writeFileSync(file, content, 'utf8');
      console.log("Fixed directive in", file);
    }
  }
}
