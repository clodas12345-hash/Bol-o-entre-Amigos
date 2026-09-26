import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let dbInstance;
try {
  // Use initializeFirestore to set custom settings like long polling (critical for iframes/mobile)
  dbInstance = databaseId
    ? initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
      }, databaseId)
    : initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
      });
} catch (err) {
  console.warn('Firestore already initialized or failed to initialize with settings, falling back to getFirestore:', err);
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const isQuotaError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    msg.includes('quota') || 
    msg.includes('limit exceeded') || 
    msg.includes('resource-exhausted') ||
    msg.includes('exhausted') ||
    code === 'resource-exhausted' ||
    code === '429' ||
    (code === 'permission-denied' && msg.includes('quota')) ||
    msg.includes('write stream exhausted')
  );
};

export const db = dbInstance;
export const auth = getAuth(app);
export const storage = getStorage(app);
