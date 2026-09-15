const mongoose = require("mongoose");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
require("dotenv").config({ path: ".env.local" });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(serviceAccount) });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const auth = getAuth();
  
  // 1. Find Neeraj account
  const neeraj = await db.collection("customers").findOne({ email: "kumarrneeraj791@gmail.com" });
  if (neeraj) {
    if (neeraj.firebaseUid) {
      try {
        await auth.deleteUser(neeraj.firebaseUid);
        console.log("Deleted Firebase user for Neeraj:", neeraj.firebaseUid);
      } catch(e) { console.log("Firebase delete error:", e.message); }
    }
    await db.collection("customers").deleteOne({ _id: neeraj._id });
    console.log("Deleted MongoDB user for Neeraj.");
  }
  
  // 2. Attach phone to liveproject072
  await db.collection("customers").updateOne(
    { email: "liveproject072@gmail.com" },
    { $set: { phone: "+919870487659" } }
  );
  console.log("Updated liveproject072 with phone +919870487659 in MongoDB.");
  
  // 3. Proactively attach in Firebase to prevent conflicts
  const liveProject = await db.collection("customers").findOne({ email: "liveproject072@gmail.com" });
  if (liveProject && liveProject.firebaseUid) {
    try {
      await auth.updateUser(liveProject.firebaseUid, { phoneNumber: "+919870487659" });
      console.log("Attached phone to liveproject072 in Firebase!");
    } catch(e) {
      console.log("Firebase update error (maybe already attached?):", e.message);
    }
  }

  process.exit(0);
});
