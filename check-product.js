const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const mongoose = require('mongoose');

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.db.collection('products').find({ price: 1899 }).toArray();
  products.forEach(p => console.log(`${p.name} | slug: ${p.slug} | salePrice: ${p.salePrice} | colors:`, p.colors));
  process.exit(0);
}
checkData().catch(console.error);
