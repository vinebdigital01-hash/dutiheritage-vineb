const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
require("dotenv").config({ path: ".env.local" });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function check() {
  try {
    const user = await auth.getUserByPhoneNumber("+919870487659");
    console.log("Owner of +919870487659 is:", user.uid, user.email, user.displayName);
  } catch(e) { console.log(e.code); }
  
  try {
    const user2 = await auth.getUserByPhoneNumber("9870487659");
    console.log("Owner of 9870487659 is:", user2.uid, user2.email, user2.displayName);
  } catch(e) { console.log(e.code); }
  process.exit(0);
}
check();
