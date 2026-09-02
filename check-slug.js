const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const mongoose = require('mongoose');

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  const p = await mongoose.connection.db.collection('products').findOne({ name: 'Mauve Meher' });
  console.log("SLUG:", p.slug);
  process.exit(0);
}
checkData().catch(console.error);
