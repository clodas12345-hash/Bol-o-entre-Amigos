import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, getFirestore, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

export const isAIStudioPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('ais-dev') || 
  window.location.hostname.includes('ais-pre')
);

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let dbInstance;
try {
  let cacheSettings;
  try {
    cacheSettings = persistentLocalCache({ tabManager: persistentMultipleTabManager() });
  } catch (e) {
    cacheSettings = memoryLocalCache();
  }

  dbInstance = databaseId
    ? initializeFirestore(app, {
        localCache: cacheSettings,
      }, databaseId)
    : initializeFirestore(app, {
        localCache: cacheSettings,
      });
} catch (err) {
  console.warn('Firestore already initialized or failed to initialize with settings, falling back to getFirestore:', err);
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

// Disconnect database network in AI Studio preview as requested ("dados não deve tah ligado aqui no preview")
if (isAIStudioPreview) {
  disableNetwork(dbInstance).catch(() => {});
}

import { logSystemError } from './systemErrorLogger';

export const isQuotaError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();
  const isQuota = (
    msg.includes('quota') || 
    msg.includes('limit exceeded') || 
    msg.includes('resource-exhausted') ||
    msg.includes('exhausted') ||
    code === 'resource-exhausted' ||
    code === '429' ||
    (code === 'permission-denied' && msg.includes('quota')) ||
    msg.includes('write stream exhausted')
  );

  if (isQuota) {
    logSystemError('Database', err, 'Banco de Dados Firestore');
  }

  return isQuota;
};

export const db = dbInstance;
export const auth = getAuth(app);
export const storage = getStorage(app);
