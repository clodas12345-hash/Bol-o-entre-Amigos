import React, { createContext, useContext, useState, useCallback } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db, isQuotaError } from './firebase';
import { useToast } from '../components/NotificationManager';
import { usePool } from './PoolContext';
import { LOTOFACIL_PRICES, MEGASENA_PRICES } from './prizes';

export interface QueueItem {
  id: string;
  file?: File;
  name: string;
  status: 'pending' | 'compressing' | 'ocr' | 'saving' | 'success' | 'duplicate' | 'error';
  progress: number;
  message: string;
  durationMs?: number;
}

interface UploadContextType {
  queue: QueueItem[];
  addToQueue: (files: File[], options: { poolId: string; contest?: string; gameDate?: string; monthRef?: string; isTeimosinha?: boolean; teimosinhaCount?: number }) => Promise<void>;
  clearCompleted: () => void;
  isProcessing: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const parseDateSafely = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
    }
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    }
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
};

const formatDateToMonthRef = (date: Date): string => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${yyyy}`;
};

const getExistingSignatures = async (poolId: string): Promise<Set<string>> => {
  const signatures = new Set<string>();
  try {
    const q = query(collection(db, 'games'), where('poolId', '==', poolId));
    const snap = await getDocs(q);
    snap.docs.forEach((doc) => {
      const data = doc.data();
      let cNum = '';
      if (data.contest) {
        const match = String(data.contest).match(/\b(\d{3,5})\b/);
        cNum = match ? match[1] : '';
      }
      let dateStr = '';
      if (data.date) {
        if (typeof data.date.toDate === 'function') dateStr = data.date.toDate().toISOString().split('T')[0];
        else if (data.date instanceof Date) dateStr = data.date.toISOString().split('T')[0];
        else if (typeof data.date === 'string') dateStr = data.date.split('T')[0];
      }
      const numbers = Array.isArray(data.numbers) ? data.numbers.map((n: any) => Number(n)).sort((a, b) => a - b) : [];
      const numbersKey = numbers.join('-');
      if (numbersKey) {
        if (cNum) signatures.add(`contest::${cNum}::${numbersKey}`);
        else if (dateStr) signatures.add(`date::${dateStr}::${numbersKey}`);
      }
    });
  } catch (err) {
    console.warn('Aviso: Não foi possível obter histórico de duplicatas prévio:', err);
  }
  return signatures;
};

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const { addToast } = useToast();
  const { pools, setIsQuotaExceeded } = usePool();

  const updateItem = (id: string, updates: Partial<QueueItem>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const processQueueItem = async (item: QueueItem, options: any) => {
    const { poolId, contest, gameDate, monthRef, isTeimosinha, teimosinhaCount } = options;
    const startTime = Date.now();
    const currentPool = pools.find(p => p.id === poolId);
    const isMegaSena = currentPool?.lotteryType === 'megasena';
    const prices = isMegaSena ? MEGASENA_PRICES : LOTOFACIL_PRICES;

    try {
      updateItem(item.id, { status: 'compressing', progress: 20, message: 'Compactando...' });

      // Compression logic
      const compressed = await new Promise<{ base64: string; mimeType: string }>((resolve) => {
        if (!item.file) return resolve({ base64: '', mimeType: '' });
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1200;
            let w = img.width, h = img.height;
            if (w > h ? w > MAX : h > MAX) {
              if (w > h) { h *= MAX / w; w = MAX; }
              else { w *= MAX / h; h = MAX; }
            }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              resolve({ base64: canvas.toDataURL('image/jpeg', 0.7), mimeType: 'image/jpeg' });
            } else resolve({ base64: e.target?.result as string, mimeType: item.file?.type || '' });
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(item.file);
      });

      if (!compressed.base64) throw new Error('Falha ao processar arquivo');

      updateItem(item.id, { status: 'ocr', progress: 50, message: 'Lendo dezenas...' });

      const res = await fetch('/api/lotofacil/ocr-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [compressed] })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.games?.length) throw new Error(data.message || 'IA não encontrou jogos');

      updateItem(item.id, { status: 'saving', progress: 80, message: 'Salvando...' });

      const existingSigs = await getExistingSignatures(poolId);
      const receiptURL = compressed.base64;
      const parsedDate = data.date ? parseDateSafely(data.date) : parseDateSafely(gameDate);
      const contestStr = data.contest ? String(data.contest).trim() : (contest || '').trim();
      const startContestNum = parseInt(contestStr, 10) || 0;
      const currentMonth = data.date ? formatDateToMonthRef(parsedDate) : (monthRef || formatDateToMonthRef(new Date()));
      
      const rawGames = data.games.map((g: any) => 
        (Array.isArray(g) ? g : [])
          .map((n: any) => Number(n))
          .filter((n: number) => isMegaSena ? (n >= 1 && n <= 60) : (n >= 1 && n <= 25))
          .sort((a: number, b: number) => a - b)
      );

      const validGames = rawGames.filter((g: number[]) => isMegaSena ? (g.length >= 6) : (g.length >= 10));
      if (!validGames.length) throw new Error('Nenhuma dezena válida');

      let savedCount = 0;
      const isTeim = isTeimosinha === true || isTeimosinha === 'true' || Number(isTeimosinha) === 1;
      const teimCount = teimosinhaCount && Number(teimosinhaCount) > 0 ? Number(teimosinhaCount) : 1;

      for (let i = 0; i < validGames.length; i++) {
        const gameNums = validGames[i];
        const numbersKey = gameNums.join('-');
        const unitTotal = prices[gameNums.length] || (isMegaSena ? 5.0 : 3.5);
        const gameLabel = validGames.length > 1 ? ` (Jogo ${i + 1})` : '';

        if (isTeim && startContestNum > 0) {
          let currDate = new Date(parsedDate);
          for (let k = 0; k < teimCount; k++) {
            while (currDate.getDay() === 0) {
              currDate.setDate(currDate.getDate() + 1);
            }
            const currentContestNum = startContestNum + k;
            const sig = `contest::${currentContestNum}::${numbersKey}`;

            if (!existingSigs.has(sig)) {
              await addDoc(collection(db, 'games'), {
                poolId,
                numbers: gameNums,
                contest: `Concurso #${currentContestNum}${gameLabel} (Teimosinha ${k + 1}/${teimCount})`,
                month: currentMonth,
                cost: unitTotal,
                date: Timestamp.fromDate(new Date(currDate)),
                receiptURL,
                createdAt: serverTimestamp(),
              });
              savedCount++;
              existingSigs.add(sig);
            }
            currDate.setDate(currDate.getDate() + 1);
          }
        } else {
          const contestLabel = startContestNum > 0 ? `Concurso #${startContestNum}${gameLabel}` : `Concurso Futuro${gameLabel}`;
          const sig = startContestNum > 0 ? `contest::${startContestNum}::${numbersKey}` : `date::${parsedDate.toISOString().split('T')[0]}::${numbersKey}`;

          if (!existingSigs.has(sig)) {
            await addDoc(collection(db, 'games'), {
              poolId,
              numbers: gameNums,
              contest: contestLabel,
              month: currentMonth,
              cost: isTeim ? unitTotal * teimCount : unitTotal,
              date: Timestamp.fromDate(parsedDate),
              receiptURL,
              createdAt: serverTimestamp(),
            });
            savedCount++;
            existingSigs.add(sig);
          }
        }
      }

      // Calculate hits against latest official result if available
      let hitsSummary = '';
      try {
        const resultsCol = isMegaSena ? 'megasena_results' : 'lotofacil_results';
        const qResults = query(collection(db, resultsCol), orderBy('contest', 'desc'), limit(1));
        const resSnap = await getDocs(qResults);
        if (!resSnap.empty) {
          const official = resSnap.docs[0].data();
          const drawn = Array.isArray(official.numbers) ? official.numbers.map(Number) : [];
          if (drawn.length > 0) {
            const firstGameHits = validGames[0].filter((n: number) => drawn.includes(n)).length;
            if (validGames.length === 1) {
              hitsSummary = ` (${firstGameHits} acertos no Concurso ${official.contest})`;
            } else {
              hitsSummary = ` (${validGames.length} jogos conferidos)`;
            }
          }
        }
      } catch (e) {
        console.warn('Could not fetch results for immediate comparison:', e);
      }

      updateItem(item.id, { 
        status: savedCount > 0 ? 'success' : 'duplicate', 
        progress: 100, 
        message: savedCount > 0 ? `${savedCount} aposta(s) salva(s)${hitsSummary}` : 'Já cadastrado',
        durationMs: Date.now() - startTime 
      });

    } catch (err: any) {
      console.error('Background upload error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      updateItem(item.id, { status: 'error', progress: 100, message: err.message || 'Erro inesperado' });
    }
  };

  const addToQueue = useCallback(async (files: File[], options: any) => {
    const newItems: QueueItem[] = files.map(file => ({
      id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      file,
      name: file.name,
      status: 'pending',
      progress: 0,
      message: 'Aguardando...'
    }));

    setQueue(prev => [...prev, ...newItems]);

    // Process items sequentially in background
    for (const item of newItems) {
      await processQueueItem(item, options);
    }
  }, [pools, setIsQuotaExceeded]);

  const clearCompleted = () => {
    setQueue(prev => prev.filter(item => item.status === 'pending' || item.status === 'compressing' || item.status === 'ocr' || item.status === 'saving'));
  };

  const isProcessing = queue.some(item => item.status !== 'success' && item.status !== 'error' && item.status !== 'duplicate');

  return (
    <UploadContext.Provider value={{ queue, addToQueue, clearCompleted, isProcessing }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) throw new Error('useUpload must be used within an UploadProvider');
  return context;
}
