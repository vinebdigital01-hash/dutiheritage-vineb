const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const res = await db.collection("customers").deleteOne({ firebaseUid: "lV7bHl1PuGhkDTzLD9vSoPvob8o2" });
  console.log("Deleted old test customer:", res.deletedCount);
  process.exit(0);
});
