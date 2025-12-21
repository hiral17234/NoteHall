import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - reads from environment variables for production builds
// Falls back to hardcoded values for development (these are public keys, security is handled by Firebase Rules)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAkALFSr--NzXKrnVXgQC0_O6tqYHl5-pw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "notehall-6ab8b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "notehall-6ab8b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "notehall-6ab8b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "464597920358",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:464597920358:web:e2fd6288ae868257b0dba7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Helper for server timestamp
export const getServerTimestamp = () => serverTimestamp();

export default app;
