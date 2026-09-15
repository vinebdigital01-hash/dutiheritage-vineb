const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
require("dotenv").config({ path: ".env.local" });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function check() {
  try {
    const user = await auth.getUser("HCZ55wjEwiYn78ehkHtG2KsR0Af1");
    console.log("liveproject072 Firebase User:", user.uid, user.email, user.phoneNumber);
  } catch(e) { console.log(e.code); }
  process.exit(0);
}
check();
