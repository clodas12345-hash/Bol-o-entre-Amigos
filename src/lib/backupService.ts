import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

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

  for (const colName of COLLECTIONS_TO_BACKUP) {
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
      totalRecords += backupData[colName].length;
    } catch (e) {
      console.warn(`Aviso ao exportar coleção ${colName}:`, e);
      backupData[colName] = [];
    }
  }

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const ano = now.getFullYear();
  const fileName = `backup_bolao_data.${dia}.${mes}.${ano}.json`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  recordBackupCompleted();

  return { totalRecords, fileName };
}

export async function saveDailyCloudBackupToFirestore(): Promise<{ id: string; totalRecords: number; isNew: boolean }> {
  const todayStr = new Date().toLocaleDateString('pt-BR');
  
  // Verifica se já existe backup gerado na nuvem na data de hoje
  try {
    const qToday = query(
      collection(db, 'backups_history'), 
      where('dateRef', '==', todayStr), 
      limit(1)
    );
    const existingSnap = await getDocs(qToday);
    if (!existingSnap.empty) {
      const docData = existingSnap.docs[0].data();
      return { 
        id: existingSnap.docs[0].id, 
        totalRecords: docData.totalRecords || 0,
        isNew: false 
      };
    }
  } catch (e) {
    console.warn('Verificação de backup diário anterior:', e);
  }

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

  for (const colName of COLLECTIONS_TO_BACKUP) {
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
      totalRecords += backupData[colName].length;
    } catch (e) {
      console.warn(`Aviso ao arquivar coleção ${colName}:`, e);
      backupData[colName] = [];
    }
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

export async function getBackupsHistory(): Promise<any[]> {
  try {
    const q = query(collection(db, 'backups_history'), orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching backup history:', err);
    return [];
  }
}
