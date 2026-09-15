const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const byEmail = await db.collection("customers").findOne({ email: "liveproject072@gmail.com" });
  console.log("liveproject072@gmail.com account:\n", JSON.stringify(byEmail, null, 2));
  process.exit(0);
});
