const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(0, 0, 0, 0);

  try {
    const orders = await mongoose.connection.collection('orders').find({
      createdAt: { $gte: startDate },
      status: { $ne: "Cancelled" }
    }).project({ createdAt: 1, total: 1, paymentMethod: 1 }).toArray();
    
    console.log("orders length:", orders.length);

  } catch(e) {
      console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.error);
