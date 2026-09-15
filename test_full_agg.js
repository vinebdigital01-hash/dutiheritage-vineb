const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
require('./src/models/Order.ts');
require('./src/models/Event.ts');
require('./src/models/Cart.ts');
require('./src/models/Customer.ts');
require('./src/models/Product.ts');
require('./src/models/Collection.ts');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const { Order, Event, Cart, Customer, Product, Collection } = require('./src/models');
  
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  try {
    const funnelEvents = await Event.aggregate([
      { $match: { createdAt: { $gte: startDate }, event: { $in: ["product_view", "add_to_cart", "checkout_start", "purchase"] } } },
      { $group: { _id: "$event", count: { $sum: 1 } } }
    ]);
    console.log("funnelEvents:", funnelEvents);

    const abandoned = await Cart.aggregate([
      { $match: { status: "abandoned", lastUpdated: { $gte: startDate } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    const productIds = abandoned.map(a => a._id);
    const cartProducts = await Product.find({ _id: { $in: productIds.map(id => id.toString()) } } as any).select("collectionId").lean();
    console.log("cartProducts", cartProducts);

  } catch(e) {
      console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.error);
