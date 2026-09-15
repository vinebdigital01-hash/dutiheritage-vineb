const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(0, 0, 0, 0);

  try {
    const abandoned = await mongoose.connection.collection('carts').aggregate([
      { $match: { status: "abandoned", lastUpdated: { $gte: startDate } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray();
    
    console.log("abandoned:", abandoned);
    
    const productIds = abandoned.map(a => a._id);
    const cartProducts = await mongoose.connection.collection('products').find({ _id: { $in: productIds.map(id => id.toString()) } }).project({ collectionId: 1 }).toArray();
    console.log("cartProducts:", cartProducts);

  } catch(e) {
      console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.error);
