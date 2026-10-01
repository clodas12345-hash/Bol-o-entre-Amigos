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

// Desativa conexões de rede do Firestore na Web para evitar erros de conexão gRPC/stream no console
const isWebPreview = typeof window !== 'undefined' && 
  (window.location.hostname.includes('run.app') || 
   window.location.hostname.includes('google.com') || 
   window.location.href.includes('ais-dev') || 
   window.location.href.includes('ais-pre'));

if (isWebPreview && dbInstance) {
  try {
    setLogLevel('silent');
  } catch (e) {}
  disableNetwork(dbInstance).catch(err => {
    console.warn('[Firebase] Não foi possível desativar a rede do Firestore no navegador:', err);
  });
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
