import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(".env.local") });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || "",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function check() {
  console.log("--- Signing in ---");
  // Try sign in with one of the super admin emails
  try {
    await signInWithEmailAndPassword(auth, "vatsalgoyal778@gmail.com", "vatsalgoyal778@gmail.com");
    console.log("Signed in successfully as super admin");
  } catch (e: any) {
    console.log("Sign in failed with default test pass, trying anonymously or direct admin read:", e.message);
  }

  console.log("--- Checking users in Firestore ---");
  const userSnap = await getDocs(collection(db, "users"));
  console.log("Total users in Firestore:", userSnap.size);
  userSnap.forEach(d => {
    console.log(d.id, "=>", d.data());
  });
}

check().catch(console.error);
