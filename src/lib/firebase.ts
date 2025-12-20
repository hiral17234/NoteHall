import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, serverTimestamp, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

/**
 * 🔑 FALLBACK CONFIG (CampusVoice-style)
 * Used when environment variables are NOT available (Lovable preview)
 */
const fallbackFirebaseConfig = {
  apiKey: "AIzaSyAkALFSr--NzXKrnVXgQC0_O6tqYHl5-pw",
  authDomain: "notehall-6ab8b.firebaseapp.com",
  projectId: "notehall-6ab8b",
  storageBucket: "notehall-6ab8b.firebasestorage.app",
  messagingSenderId: "464597920358",
  appId: "1:464597920358:web:e2fd6288ae868257b0dba7",
};

/**
 * 🧠 HYBRID CONFIG
 * Uses env vars if present, otherwise falls back safely
 */
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    fallbackFirebaseConfig.apiKey,

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    fallbackFirebaseConfig.authDomain,

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    fallbackFirebaseConfig.projectId,

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    fallbackFirebaseConfig.storageBucket,

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    fallbackFirebaseConfig.messagingSenderId,

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    fallbackFirebaseConfig.appId,
};

/**
 * 🚀 INITIALIZE FIREBASE (NO CRASH, NO BLOCK)
 */
const app: FirebaseApp = initializeApp(firebaseConfig);

// Services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Timestamp helper
export const getServerTimestamp = () => serverTimestamp();

// Exports
export { app, auth, db, storage, googleProvider, githubProvider };
export default app;
