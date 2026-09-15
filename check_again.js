const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const customers = await db.collection("customers").find({ phone: "+919870487659" }).toArray();
  console.log("Customers with phone +919870487659:", customers.map(c => ({ _id: c._id, email: c.email, name: c.name })));
  
  const byEmail = await db.collection("customers").findOne({ email: "kumarrneeraj791@gmail.com" });
  console.log("Neeraj email account:", { _id: byEmail?._id, phone: byEmail?.phone, email: byEmail?.email });
  process.exit(0);
});
