const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const mongoose = require('mongoose');

async function checkData() {
  if (!process.env.MONGODB_URI) { console.log("NO URI"); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);
  
  const collections = await mongoose.connection.db.collection('collections').find({}).toArray();
  console.log("COLLECTIONS:");
  collections.forEach(c => console.log(` - ${c.name} (slug: ${c.slug}, active: ${c.isActive}, id: ${c._id})`));
  
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  console.log("\nPRODUCTS in the-cotton-suit:");
  const targetCol = collections.find(c => c.slug === 'the-cotton-suit');
  if (targetCol) {
    const colProducts = products.filter(p => p.collectionId === targetCol._id.toString());
    colProducts.forEach(p => console.log(` - ${p.name} (active: ${p.isActive}, collectionId: ${p.collectionId})`));
    console.log(`Total found: ${colProducts.length}`);
  } else {
    console.log("Collection 'the-cotton-suit' not found in DB!");
    // check if similar exists
    const similar = collections.filter(c => c.slug.includes('cotton'));
    console.log("Similar:", similar.map(c => c.slug));
  }
  
  process.exit(0);
}
checkData().catch(console.error);
