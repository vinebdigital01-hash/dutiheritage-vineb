const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const prod = await db.collection('products').findOne({ trackInventory: true });
    console.log(JSON.stringify(prod, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.error);
