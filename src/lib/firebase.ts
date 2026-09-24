import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

let dbInstance;
try {
  // Use initializeFirestore to set custom settings like long polling (critical for iframes/mobile)
  dbInstance = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true, // Crucial for restricted networks and iframes
  }, databaseId);
} catch (err) {
  console.warn('Firestore already initialized or failed to initialize with settings, falling back to getFirestore:', err);
  dbInstance = getFirestore(app, databaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const storage = getStorage(app);
