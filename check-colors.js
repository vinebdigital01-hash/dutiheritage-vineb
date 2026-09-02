const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const mongoose = require('mongoose');

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  let foundColors = false;
  products.forEach(p => {
    if (p.colors && p.colors.length > 0) {
      console.log(`Product: ${p.name} - Colors:`, p.colors);
      foundColors = true;
    }
  });
  if (!foundColors) console.log("NO PRODUCTS HAVE COLORS SAVED!");
  process.exit(0);
}
checkData().catch(console.error);
