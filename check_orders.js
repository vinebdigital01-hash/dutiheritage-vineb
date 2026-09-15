const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const orders = await db.collection("orders").find({ "customer.email": "kumarrneeraj791@gmail.com" }).toArray();
  console.log("Orders:", orders.map(o => o.customer));
  process.exit(0);
});
