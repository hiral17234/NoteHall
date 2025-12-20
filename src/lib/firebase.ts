import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - these are public keys (security is handled by Firebase Rules)
const firebaseConfig = {
  apiKey: "AIzaSyAkALFSr--NzXKrnVXgQC0_O6tqYHl5-pw",
  authDomain: "notehall-6ab8b.firebaseapp.com",
  projectId: "notehall-6ab8b",
  storageBucket: "notehall-6ab8b.firebasestorage.app",
  messagingSenderId: "464597920358",
  appId: "1:464597920358:web:e2fd6288ae868257b0dba7",
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
