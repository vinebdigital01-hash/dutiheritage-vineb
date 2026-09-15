const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
require("dotenv").config({ path: ".env.local" });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function test() {
  try {
    const user = await auth.getUserByPhoneNumber("+919870487659");
    await auth.updateUser(user.uid, { phoneNumber: null });
    console.log("Success setting to null!");
  } catch(e) { 
    console.log("Failed:", e.message);
  }
  process.exit(0);
}
test();
