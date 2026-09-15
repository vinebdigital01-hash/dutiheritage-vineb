const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  startDate.setHours(0, 0, 0, 0);

  try {
    const colViews = await mongoose.connection.collection('events').aggregate([
      { $match: { createdAt: { $gte: startDate }, event: "collection_view" } },
      { $group: { _id: "$collectionId", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]).toArray();
    console.log("colViews:", colViews);

    const mapped = colViews.map(c => new mongoose.Types.ObjectId(c._id.toString()));
    console.log("Mapped IDs:", mapped);

  } catch(e) {
      console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.error);
