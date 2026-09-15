const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const customers = await db.collection("customers").find({ $or: [{phone: "+919870487659"}, {phone: "9870487659"}] }).toArray();
  console.log("Customers with phone 9870487659:", JSON.stringify(customers.map(c => ({
    _id: c._id, 
    email: c.email, 
    name: c.name, 
    phone: c.phone, 
    firebaseUid: c.firebaseUid 
  })), null, 2));
  
  process.exit(0);
});
