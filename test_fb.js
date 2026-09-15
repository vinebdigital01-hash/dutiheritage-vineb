const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyBDkLX0B1RJ4dAXgzzu5y_ecdv7hssSBiE",
  authDomain: "dutiheritage-cdb20.firebaseapp.com",
  projectId: "dutiheritage-cdb20",
  storageBucket: "dutiheritage-cdb20.firebasestorage.app",
  messagingSenderId: "959487400543",
  appId: "1:959487400543:web:4a92f494b5159cd12f59ea",
  measurementId: "G-M6E448Z654"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
console.log("App initialized with domain:", auth.config.authDomain);
