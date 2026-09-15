const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Remove phone from all customers
  await db.collection("customers").updateMany(
    { $or: [{ phone: "9870487659" }, { phone: "+919870487659" }] },
    { $unset: { phone: "" } }
  );
  
  // Set phone ONLY on kumarrneeraj791@gmail.com
  await db.collection("customers").updateOne(
    { email: "kumarrneeraj791@gmail.com" },
    { $set: { phone: "+919870487659" } }
  );
  
  const c = await db.collection("customers").findOne({ email: "kumarrneeraj791@gmail.com" });
  console.log("Updated Neeraj account with phone:", c.phone);
  
  process.exit(0);
});
