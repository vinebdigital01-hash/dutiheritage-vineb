const fs = require('fs');

// orders
let orders = fs.readFileSync('src/app/account/orders/page.tsx', 'utf8');
orders = orders.replace(
  /\{loading \? \([\s\S]*?\) \: error \? \(/,
  '{loading ? (\n        <div className="py-8"><SkeletonOrderList /></div>\n      ) : error ? ('
);
fs.writeFileSync('src/app/account/orders/page.tsx', orders, 'utf8');

// coupons
let coupons = fs.readFileSync('src/app/account/coupons/page.tsx', 'utf8');
coupons = coupons.replace(
  /\{loading \? \([\s\S]*?\) \: coupons\.length === 0 \? \(/,
  '{loading ? (\n        <div className="py-8"><SkeletonCouponGrid /></div>\n      ) : coupons.length === 0 ? ('
);
fs.writeFileSync('src/app/account/coupons/page.tsx', coupons, 'utf8');

// wishlist
let wishlist = fs.readFileSync('src/app/account/wishlist/page.tsx', 'utf8');
wishlist = wishlist.replace(
  /\{loading \? \([\s\S]*?\) \: products\.length === 0 \? \(/,
  '{loading ? (\n        <div className="py-8"><SkeletonProductGrid /></div>\n      ) : products.length === 0 ? ('
);
fs.writeFileSync('src/app/account/wishlist/page.tsx', wishlist, 'utf8');
