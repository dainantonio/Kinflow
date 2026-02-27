import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const envFirebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID,
};

const hasEnvFirebase = Object.values(envFirebaseConfig).every(Boolean);
const hasInjectedFirebase = typeof __firebase_config !== 'undefined' && !!__firebase_config;
const DEMO_MODE = !hasEnvFirebase && !hasInjectedFirebase;
let _fbApp = null, auth = null, db = null;
if (!DEMO_MODE) {
  try {
    const firebaseConfig = hasInjectedFirebase ? JSON.parse(__firebase_config) : envFirebaseConfig;
    _fbApp = initializeApp(firebaseConfig);
    auth = getAuth(_fbApp);
    db = getFirestore(_fbApp);
  } catch (e) { console.warn('Firebase init failed, running in demo mode'); }
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'demo-kinflow';

// --- GEMINI API HELPER ---
const fetchWithRetry = async (url, options, retries = 5) => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

export {
  DEMO_MODE, auth, db, appId, fetchWithRetry,
  signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider,
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc
};
