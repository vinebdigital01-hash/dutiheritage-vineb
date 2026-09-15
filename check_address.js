const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const byEmail = await db.collection("customers").findOne({ email: "kumarrneeraj791@gmail.com" });
  console.log("Address:", byEmail?.address);
  process.exit(0);
});
