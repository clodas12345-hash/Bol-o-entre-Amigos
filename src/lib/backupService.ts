import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { downloadOrShareFile } from './fileDownloadHelper';

export const COLLECTIONS_TO_BACKUP = [
  'pools',
  'games',
  'members',
  'users',
  'payments',
  'lotofacil_results',
  'megasena_results',
  'chats',
  'polls'
];

export const LAST_BACKUP_KEY = 'bolao_last_backup_timestamp';
export const BACKUP_REMINDER_SETTINGS_KEY = 'bolao_backup_reminder_settings';

export interface BackupReminderSettings {
  remindOnLastDay: boolean;
  remindOnOpenIfOld: boolean;
}

export function getBackupReminderSettings(): BackupReminderSettings {
  try {
    const raw = localStorage.getItem(BACKUP_REMINDER_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    remindOnLastDay: true,
    remindOnOpenIfOld: true
  };
}

export function saveBackupReminderSettings(settings: BackupReminderSettings) {
  try {
    localStorage.setItem(BACKUP_REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function getLastBackupDate(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function recordBackupCompleted(): Date {
  const now = new Date();
  try {
    localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
  } catch (e) {
    console.error(e);
  }
  return now;
}

export function checkIfBackupNeeded(): {
  needed: boolean;
  reason: 'last_day_of_month' | 'backup_never_done' | 'backup_older_than_30_days' | null;
  message: string;
} {
  const settings = getBackupReminderSettings();
  const today = new Date();
  
  // Verifica se hoje é o último dia do mês (ou penúltimo)
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const isLastDay = tomorrow.getMonth() !== today.getMonth();

  const lastBackup = getLastBackupDate();

  if (settings.remindOnLastDay && isLastDay) {
    // Se hoje é o último dia do mês e ainda não fez backup hoje:
    if (!lastBackup || lastBackup.toDateString() !== today.toDateString()) {
      return {
        needed: true,
        reason: 'last_day_of_month',
        message: 'Hoje é o último dia do mês! Momento ideal para arquivar os jogos e resultados.'
      };
    }
  }

  if (settings.remindOnOpenIfOld) {
    if (!lastBackup) {
      return {
        needed: true,
        reason: 'backup_never_done',
        message: 'Você ainda não realizou nenhum backup dos dados deste bolão neste dispositivo.'
      };
    }

    const diffDays = Math.floor((today.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 25) {
      return {
        needed: true,
        reason: 'backup_older_than_30_days',
        message: `Seu último backup foi feito há ${diffDays} dias. Recomendamos gerar uma cópia atualizada.`
      };
    }
  }

  return {
    needed: false,
    reason: null,
    message: ''
  };
}

export async function downloadFullBackup(): Promise<{ totalRecords: number; fileName: string }> {
  const backupData: Record<string, any[]> = {
    _metadata: [
      {
        id: 'meta',
        data: {
          app: 'Bolão Lotofácil & Mega-Sena Gestor',
          exportedAt: new Date().toISOString(),
          version: '2.0'
        }
      }
    ]
  };

  let totalRecords = 0;

  await Promise.all(
    COLLECTIONS_TO_BACKUP.map(async (colName) => {
      try {
        const snap = await getDocs(collection(db, colName));
        backupData[colName] = snap.docs.map(docSnap => {
          const data = docSnap.data();
          const serializedData = { ...data };
          for (const key in serializedData) {
            if (serializedData[key]?.toDate && typeof serializedData[key].toDate === 'function') {
              serializedData[key] = {
                __type: 'timestamp',
                seconds: serializedData[key].seconds,
                nanoseconds: serializedData[key].nanoseconds
              };
            } else if (serializedData[key] instanceof Date) {
              serializedData[key] = {
                __type: 'date',
                value: serializedData[key].toISOString()
              };
            }
          }
          return {
            id: docSnap.id,
            data: serializedData
          };
        });
      } catch (e) {
        console.warn(`Aviso ao exportar coleção ${colName}:`, e);
        backupData[colName] = [];
      }
    })
  );

  for (const colName of COLLECTIONS_TO_BACKUP) {
    totalRecords += (backupData[colName] || []).length;
  }

  const jsonString = JSON.stringify(backupData, null, 2);
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const fileName = `Backup_Bolão_Amigos_${day}_${month}_${year}.json`;
  
  await downloadOrShareFile({
    fileName,
    content: jsonString,
    mimeType: 'application/json'
  });

  recordBackupCompleted();

  return { totalRecords, fileName };
}

export async function saveDailyCloudBackupToFirestore(): Promise<{ id: string; totalRecords: number; isNew: boolean }> {
  const todayStr = new Date().toLocaleDateString('pt-BR');
  

  // Gera novo backup na nuvem
  const backupData: Record<string, any[]> = {
    _metadata: [
      {
        id: 'meta',
        data: {
          app: 'Bolão Lotofácil & Mega-Sena Gestor',
          exportedAt: new Date().toISOString(),
          version: '2.0',
          type: 'daily_cloud'
        }
      }
    ]
  };

  let totalRecords = 0;

  await Promise.all(
    COLLECTIONS_TO_BACKUP.map(async (colName) => {
      try {
        const snap = await getDocs(collection(db, colName));
        backupData[colName] = snap.docs.map(docSnap => {
          const data = docSnap.data();
          const serializedData = { ...data };
          
          if (colName === 'games' || colName === 'payments') {
            delete serializedData.receiptURL;
            delete serializedData.imageUrl;
          }

          for (const key in serializedData) {
            if (serializedData[key]?.toDate && typeof serializedData[key].toDate === 'function') {
              serializedData[key] = {
                __type: 'timestamp',
                seconds: serializedData[key].seconds,
                nanoseconds: serializedData[key].nanoseconds
              };
            } else if (serializedData[key] instanceof Date) {
              serializedData[key] = {
                __type: 'date',
                value: serializedData[key].toISOString()
              };
            }
          }
          return {
            id: docSnap.id,
            data: serializedData
          };
        });
      } catch (e) {
        console.warn(`Aviso ao arquivar coleção ${colName}:`, e);
        backupData[colName] = [];
      }
    })
  );

  for (const colName of COLLECTIONS_TO_BACKUP) {
    totalRecords += (backupData[colName] || []).length;
  }

  const docRef = await addDoc(collection(db, 'backups_history'), {
    data: JSON.stringify(backupData),
    totalRecords,
    createdAt: serverTimestamp(),
    dateRef: todayStr,
    monthRef: new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
    type: 'daily_cloud'
  });

  recordBackupCompleted();

  return { id: docRef.id, totalRecords, isNew: true };
}

export async function saveBackupToFirestore(): Promise<{ id: string; totalRecords: number }> {
  const result = await saveDailyCloudBackupToFirestore();
  return { id: result.id, totalRecords: result.totalRecords };
}

function withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout de requisição')), ms))
  ]);
}

/**
 * Busca de forma ultra-rápida e eficiente o backup mais rico (com mais registros, ex: 1400+ jogos)
 * ou mais recente da nuvem, sem sobrecarregar a rede ou travar o celular.
 */
export async function getLatestAndRichestBackup(): Promise<any | null> {
  // 1. Tenta buscar direto pelo maior número de registros (1400+ jogos)
  try {
    const qRecords = query(collection(db, 'backups_history'), orderBy('totalRecords', 'desc'), limit(3));
    const snap = await withTimeout(getDocs(qRecords), 10000);
    if (!snap.empty) {
      for (const d of snap.docs) {
        const item = d.data();
        if (item?.data) {
          try {
            const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            if (parsed && ((Array.isArray(parsed.games) && parsed.games.length > 0) || Object.keys(parsed).length > 0)) {
              return parsed;
            }
          } catch (pErr) {
            console.warn('Erro ao parsear dados do backup por totalRecords:', pErr);
          }
        }
      }
    }
  } catch (errRec) {
    console.warn('Busca por totalRecords falhou ou index não disponível, tentando por data:', errRec);
  }

  // 2. Busca pelos backups mais recentes (limit 5) e escolhe o mais completo em memória
  try {
    const qRecent = query(collection(db, 'backups_history'), orderBy('createdAt', 'desc'), limit(5));
    const snap = await withTimeout(getDocs(qRecent), 10000);
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data());
      list.sort((a: any, b: any) => (b.totalRecords || 0) - (a.totalRecords || 0));
      for (const item of list) {
        if (item?.data) {
          try {
            const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            if (parsed && ((Array.isArray(parsed.games) && parsed.games.length > 0) || Object.keys(parsed).length > 0)) {
              return parsed;
            }
          } catch (pErr) {
            console.warn('Erro ao parsear backup recente:', pErr);
          }
        }
      }
    }
  } catch (errRecent) {
    console.warn('Busca por createdAt falhou, tentando fallback direto:', errRecent);
  }

  // 3. Fallback seguro sem orderBy com limit(5)
  try {
    const qSafe = query(collection(db, 'backups_history'), limit(5));
    const snap = await withTimeout(getDocs(qSafe), 8000);
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data());
      list.sort((a: any, b: any) => (b.totalRecords || 0) - (a.totalRecords || 0));
      for (const item of list) {
        if (item?.data) {
          try {
            const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            if (parsed && Object.keys(parsed).length > 0) {
              return parsed;
            }
          } catch {}
        }
      }
    }
  } catch (errSafe) {
    console.error('Fallback simples de backups falhou:', errSafe);
  }

  return null;
}

export async function getBackupsHistory(): Promise<any[]> {
  try {
    const q = query(collection(db, 'backups_history'), orderBy('createdAt', 'desc'), limit(8));
    const snap = await withTimeout(getDocs(q), 10000);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Error fetching backup history with orderBy, falling back without orderBy:', err);
    try {
      const qFallback = query(collection(db, 'backups_history'), limit(8));
      const snap = await withTimeout(getDocs(qFallback), 8000);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      return list;
    } catch (fallbackErr) {
      console.error('Error in fallback backup history:', fallbackErr);
      return [];
    }
  }
}

