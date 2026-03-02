import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWeRhvQfRRoC09IitqaUTJDNQQvjwzovk",
  authDomain: "house-of-earth-monk.firebaseapp.com",
  projectId: "house-of-earth-monk",
  storageBucket: "house-of-earth-monk.firebasestorage.app",
  messagingSenderId: "1081630700627",
  appId: "1:1081630700627:web:e0def403b27e4a2bde82a6",
  measurementId: "G-6KZSP7293P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
