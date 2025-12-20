import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, serverTimestamp, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Required environment variable keys
const requiredEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

// Validate environment variables
function validateFirebaseConfig(): { isValid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];
  
  for (const key of requiredEnvKeys) {
    const value = import.meta.env[key];
    if (!value || typeof value !== 'string' || value.trim() === '') {
      missingKeys.push(key);
    }
  }
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}

// Check config validity
const configValidation = validateFirebaseConfig();

// Log clear error if config is invalid
if (!configValidation.isValid) {
  console.error(
    '🔥 Firebase Configuration Error:\n' +
    'The following required environment variables are missing or empty:\n' +
    configValidation.missingKeys.map(key => `  - ${key}`).join('\n') +
    '\n\nTo fix this:\n' +
    '1. Go to Lovable → Settings → Secrets\n' +
    '2. Add each missing secret with values from your Firebase Console\n' +
    '3. Redeploy the application'
  );
}

// Export configuration status
export const firebaseReady = configValidation.isValid;
export const firebaseMissingKeys = configValidation.missingKeys;

// Initialize Firebase only if config is valid
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let githubProvider: GithubAuthProvider | null = null;

if (firebaseReady) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Auth providers
  googleProvider = new GoogleAuthProvider();
  githubProvider = new GithubAuthProvider();
}

// Helper for server timestamp
export const getServerTimestamp = () => serverTimestamp();

// Export with type assertions for when Firebase is ready
export { app, auth, db, storage, googleProvider, githubProvider };
export default app;
