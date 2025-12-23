import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ?? "YOUR_API_KEY",
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? "YOUR_AUTH_DOMAIN",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? "YOUR_PROJECT_ID",
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ?? "YOUR_STORAGE_BUCKET",
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ??
    "YOUR_MESSAGING_SENDER_ID",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ?? "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
