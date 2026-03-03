import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  Auth, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  PhoneAuthProvider
} from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// More robust check for Firebase configuration
// Ensures keys are present and don't look like placeholders
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 10 && 
  !firebaseConfig.apiKey.includes("YOUR_") &&
  firebaseConfig.authDomain
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let analytics: Analytics | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  // Check if authDomain is likely incorrect (should be firebaseapp.com, not vercel.app)
  if (firebaseConfig.authDomain?.includes("vercel.app")) {
    console.error("CRITICAL: VITE_FIREBASE_AUTH_DOMAIN is set to a Vercel URL. This will break Google Login. It must be your Firebase 'authDomain' (e.g., project-id.firebaseapp.com).");
  }
  
  try {
    // Only initialize if we have a valid-looking API key
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      // Analytics is only supported in browser environments
      if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
      }
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // If initialization fails, we should treat it as not configured
    auth = undefined;
  }
} else {
  if (import.meta.env.DEV) {
    console.warn("Firebase is not configured. Google Login will be disabled.");
  }
}

export { auth, analytics, db };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
