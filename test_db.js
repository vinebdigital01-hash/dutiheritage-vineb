const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  if(!uri) {
      console.error("NO MONGODB URI");
      return;
  }
  
  try {
    await mongoose.connect(uri);
    
    // Check if we have orders
    const orderCount = await mongoose.connection.collection('orders').countDocuments();
    console.log(`Total Orders: ${orderCount}`);
    
    // Check if we have events
    const eventCount = await mongoose.connection.collection('events').countDocuments();
    console.log(`Total Events: ${eventCount}`);
    
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.error);
