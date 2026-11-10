import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// YOUR CONFIG GOES HERE
const firebaseConfig = {
  apiKey: "AIzaSyDreXYx4C5fUwwBSvaQgJiHJfCvT_h8Cu8",
  authDomain: "the-multiverse-8a7d0.firebaseapp.com",
  projectId: "the-multiverse-8a7d0",
  storageBucket: "the-multiverse-8a7d0.firebasestorage.app",
  messagingSenderId: "226513550239",
  appId: "1:226513550239:web:8add25aa8e1b90cf6f1baa",
  measurementId: "G-2CF1HTX87E"
};

const app = initializeApp(firebaseConfig);

// THESE ARE THE CRUCIAL EXPORTS THAT ARE MISSING
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);