const fs = require('fs');

// Patch Orders
let orders = fs.readFileSync('src/app/account/orders/page.tsx', 'utf8');
orders = orders.replace(/<div className="py-8">\s*<SkeletonTable \/>\s*<\/div>/, '<SkeletonOrderList />');
orders = orders.replace(/import \{ SkeletonTable \}/, 'import { SkeletonOrderList }');
fs.writeFileSync('src/app/account/orders/page.tsx', orders, 'utf8');

// Patch Coupons
let coupons = fs.readFileSync('src/app/account/coupons/page.tsx', 'utf8');
coupons = coupons.replace(/<div className="py-8">\s*<SkeletonCardGrid \/>\s*<\/div>/, '<SkeletonCouponGrid />');
coupons = coupons.replace(/import \{ SkeletonCardGrid \}/, 'import { SkeletonCouponGrid }');
fs.writeFileSync('src/app/account/coupons/page.tsx', coupons, 'utf8');

console.log("Updated layouts");
