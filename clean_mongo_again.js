const mongoose = require("mongoose");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
require("dotenv").config({ path: ".env.local" });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(serviceAccount) });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const auth = getAuth();
  
  // Find the newly created empty customer
  const c = await db.collection("customers").findOne({ phone: "+919870487659" });
  if (c && c.firebaseUid) {
    try {
      await auth.deleteUser(c.firebaseUid);
      console.log("Deleted Firebase user:", c.firebaseUid);
    } catch(e) { console.log(e.message); }
  }
  
  const res = await db.collection("customers").deleteMany({ phone: "+919870487659" });
  console.log("Deleted empty Mongo records:", res.deletedCount);
  process.exit(0);
});
