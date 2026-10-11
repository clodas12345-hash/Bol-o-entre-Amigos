import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, getFirestore, disableNetwork, setLogLevel } from 'firebase/firestore';
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

// Desativa conexões de rede do Firestore apenas no Preview do AI Studio (mantém ligado no APK, no Link do Visitante e no Link de Comprovante)
const isExternalVisitorOrReceiptLink =
  typeof window !== 'undefined' &&
  (window.location.pathname === '/visitante' ||
    window.location.pathname === '/convite' ||
    window.location.pathname === '/upload-receipt' ||
    window.location.search.includes('view=true') ||
    window.location.search.includes('comprovante=1') ||
    window.location.search.includes('upload=receipt'));

const isWebPreview =
  typeof window !== 'undefined' &&
  !isExternalVisitorOrReceiptLink &&
  (window.location.hostname.includes('run.app') ||
    window.location.hostname.includes('googleusercontent.com') ||
    window.location.hostname.includes('localhost'));

if (isWebPreview) {
  try {
    setLogLevel('silent');
    disableNetwork(dbInstance).catch(() => {});
  } catch {}
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
