import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, getFirestore, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';
import { Capacitor } from '@capacitor/core';

// REGRA ESTRITA DE AMBIENTE:
// O cliente Web e APK sempre se conectam ao Cloud Firestore para sincronização em tempo real.
export const isServer = typeof window === 'undefined';
export const isNativeApk = typeof window !== 'undefined';
export const isAIStudioPreview = false;

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

  const firestoreOptions = {
    localCache: cacheSettings,
    experimentalAutoDetectLongPolling: true,
  };

  dbInstance = databaseId
    ? initializeFirestore(app, firestoreOptions, databaseId)
    : initializeFirestore(app, firestoreOptions);
} catch (err) {
  console.warn('Firestore initialized with fallback:', err);
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
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
