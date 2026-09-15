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
    const orders = await Order.find({
      createdAt: { $gte: startDate },
      status: { $ne: "Cancelled" }
    }).select("createdAt total paymentMethod").lean();
    
    console.log("Found orders:", orders.length);

    const trendMap = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      trendMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0 });
    }

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split("T")[0];
      if (trendMap.has(dateStr)) {
        const t = trendMap.get(dateStr);
        t.revenue += o.total || 0;
        t.orders += 1;
      } else {
        console.log("Date not in map:", dateStr);
      }
    });

    const trends = Array.from(trendMap.values());
    const totalRev = trends.reduce((sum, t) => sum + t.revenue, 0);
    const totalOrd = trends.reduce((sum, t) => sum + t.orders, 0);
    
    console.log("Total Revenue calculated:", totalRev);
    console.log("Total Orders calculated:", totalOrd);

  } catch(e) {
      console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.error);
