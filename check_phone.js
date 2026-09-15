const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const c = await db.collection("customers").findOne({ phone: "+919870487659" });
  console.log(JSON.stringify(c, null, 2));
  process.exit(0);
});
