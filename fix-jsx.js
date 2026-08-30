const fs = require('fs');

// Fix Orders Page
let orders = fs.readFileSync('src/app/account/orders/page.tsx', 'utf8');
orders = orders.replace(
  /<div className="w-full py-12 flex flex-col items-center justify-center">[\s\S]*?<\/div>/,
  '<SkeletonOrderList />'
);
fs.writeFileSync('src/app/account/orders/page.tsx', orders, 'utf8');

// Fix Coupons Page
let coupons = fs.readFileSync('src/app/account/coupons/page.tsx', 'utf8');
coupons = coupons.replace(
  /<div className="w-full py-12 flex flex-col items-center justify-center">[\s\S]*?<\/div>/,
  '<SkeletonCouponGrid />'
);
fs.writeFileSync('src/app/account/coupons/page.tsx', coupons, 'utf8');

// Fix Wishlist Page
let wishlist = fs.readFileSync('src/app/account/wishlist/page.tsx', 'utf8');
wishlist = wishlist.replace(
  /<div className="w-full py-12 flex flex-col items-center justify-center">[\s\S]*?<\/div>/,
  '<SkeletonProductGrid />'
);
fs.writeFileSync('src/app/account/wishlist/page.tsx', wishlist, 'utf8');

console.log("Fixed JSX replacements");
