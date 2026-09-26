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

/**
 * Consulta o Firestore em tempo real para verificar se já existe um jogo
 * com o mesmo número de concurso e as mesmas dezenas cadastradas.
 */
export const checkGameDuplicateInFirestore = async (
  contestNum: number,
  numbersKey: string,
  gameNums: number[],
  inMemorySigs: Set<string>,
  dateStr?: string
): Promise<{ isDuplicate: boolean; reason?: string }> => {
  const normalizedKey = numbersKey || (Array.isArray(gameNums) ? [...gameNums].map(Number).sort((a, b) => a - b).join('-') : '');
  const sig = contestNum > 0
    ? `contest::${contestNum}::${normalizedKey}`
    : `date::${dateStr || ''}::${normalizedKey}`;

  // 1. Verificação rápida no cache da sessão / lote atual
  if (inMemorySigs.has(sig)) {
    return { 
      isDuplicate: true, 
      reason: contestNum > 0 ? `Concurso #${contestNum}` : `Data ${dateStr}` 
    };
  }

  try {
    // 2. Consulta direta no Firestore pelo número do concurso
    if (contestNum > 0) {
      const qContest = query(
        collection(db, 'games'),
        where('contestNumber', '==', contestNum)
      );
      const snapContest = await getDocs(qContest);

      for (const d of snapContest.docs) {
        const docData = d.data();
        const existingNumbersKey = docData.numbersKey || (
          Array.isArray(docData.numbers) 
            ? docData.numbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b).join('-')
            : ''
        );

        if (existingNumbersKey === normalizedKey) {
          inMemorySigs.add(sig);
          return { 
            isDuplicate: true, 
            reason: docData.contest || `Concurso #${contestNum}` 
          };
        }
      }
    }

    // 3. Consulta secundária pelo conjunto de dezenas (numbersKey)
    // Garante encontrar jogos onde o concurso foi registrado como texto (ex: "Concurso #3790")
    if (normalizedKey) {
      const qNumbersKey = query(
        collection(db, 'games'),
        where('numbersKey', '==', normalizedKey)
      );
      const snapNumbers = await getDocs(qNumbersKey);

      for (const d of snapNumbers.docs) {
        const docData = d.data();
        let docContestNum = typeof docData.contestNumber === 'number' ? docData.contestNumber : 0;
        if (!docContestNum && docData.contest) {
          const match = String(docData.contest).match(/\b(\d{3,5})\b/);
          docContestNum = match ? parseInt(match[1], 10) : 0;
        }

        // Se ambos possuem concurso e coincidem: duplicata confirmada!
        if (contestNum > 0 && docContestNum === contestNum) {
          inMemorySigs.add(sig);
          return { 
            isDuplicate: true, 
            reason: docData.contest || `Concurso #${contestNum}` 
          };
        }

        // Se não houver número formal de concurso, compara pela data do jogo
        if (contestNum === 0 && dateStr) {
          let docDateStr = '';
          if (docData.date) {
            if (typeof docData.date.toDate === 'function') docDateStr = docData.date.toDate().toISOString().split('T')[0];
            else if (docData.date instanceof Date) docDateStr = docData.date.toISOString().split('T')[0];
            else if (typeof docData.date === 'string') docDateStr = docData.date.split('T')[0];
          }
          if (docDateStr && docDateStr === dateStr) {
            inMemorySigs.add(sig);
            return { 
              isDuplicate: true, 
              reason: `Sorteio de ${dateStr}` 
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Aviso: Falha ao consultar duplicidade no Firestore, prosseguindo com verificação local:', err);
  }

  return { isDuplicate: false };
};

export const getExistingSignatures = async (): Promise<Set<string>> => {
  const signatures = new Set<string>();
  try {
    // Busca em todos os jogos para pré-carregar assinaturas conhecidas
    const q = query(collection(db, 'games'));
    const snap = await getDocs(q);
    snap.docs.forEach((doc) => {
      const data = doc.data();
      let cNum = '';
      if (typeof data.contestNumber === 'number') {
        cNum = String(data.contestNumber);
      } else if (data.contest) {
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

  const processQueueItem = async (item: QueueItem, options: any, existingSigs: Set<string>) => {
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

      updateItem(item.id, { status: 'ocr', progress: 40, message: 'Analisando bilhete...' });

      const res = await fetch('/api/lotofacil/ocr-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [compressed] })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.games?.length) throw new Error(data.message || 'IA não encontrou jogos legíveis');

      updateItem(item.id, { status: 'saving', progress: 70, message: 'Verificando duplicidades no banco...' });

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
      let duplicateCount = 0;
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
            const dateStr = currDate.toISOString().split('T')[0];

            // Verificação de duplicidade no Firestore (dezenas + número do concurso)
            const dupCheck = await checkGameDuplicateInFirestore(
              currentContestNum,
              numbersKey,
              gameNums,
              existingSigs,
              dateStr
            );

            if (dupCheck.isDuplicate) {
              duplicateCount++;
            } else {
              const sig = `contest::${currentContestNum}::${numbersKey}`;
              await addDoc(collection(db, 'games'), {
                poolId,
                numbers: gameNums,
                numbersKey,
                contest: `Concurso #${currentContestNum}${gameLabel} (Teimosinha ${k + 1}/${teimCount})`,
                contestNumber: currentContestNum,
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
          const dateStr = parsedDate.toISOString().split('T')[0];

          // Verificação de duplicidade no Firestore (dezenas + número do concurso)
          const dupCheck = await checkGameDuplicateInFirestore(
            startContestNum,
            numbersKey,
            gameNums,
            existingSigs,
            dateStr
          );

          if (dupCheck.isDuplicate) {
            duplicateCount++;
          } else {
            const sig = startContestNum > 0 ? `contest::${startContestNum}::${numbersKey}` : `date::${dateStr}::${numbersKey}`;
            await addDoc(collection(db, 'games'), {
              poolId,
              numbers: gameNums,
              numbersKey,
              contest: contestLabel,
              contestNumber: startContestNum > 0 ? startContestNum : null,
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

      let finalMessage = '';
      if (savedCount > 0 && duplicateCount > 0) {
        finalMessage = `${savedCount} aposta(s) salva(s) (${duplicateCount} duplicada(s) ignorada(s))${hitsSummary}`;
        addToast(`ℹ️ ${item.name}: ${savedCount} aposta(s) salva(s) e ${duplicateCount} já cadastrada(s) ignorada(s).`, 'info');
      } else if (savedCount > 0) {
        finalMessage = `${savedCount} aposta(s) salva(s)${hitsSummary}`;
        addToast(`✅ ${item.name}: ${savedCount} aposta(s) salva(s) com sucesso!`, 'success');
      } else {
        const contestInfo = startContestNum > 0 ? ` no Concurso #${startContestNum}` : '';
        finalMessage = `Já cadastrado${contestInfo}`;
        addToast(`⚠️ ${item.name}: Jogo já cadastrado${contestInfo}. Duplicidade evitada!`, 'info');
      }

      updateItem(item.id, { 
        status: savedCount > 0 ? 'success' : 'duplicate', 
        progress: 100, 
        message: finalMessage,
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

    // Pre-fetch signatures once for the batch to ensure consistency and performance
    const poolId = options.poolId || 'default_lotofacil_pool';
    const existingSigs = await getExistingSignatures();

    // Process items sequentially in background
    for (const item of newItems) {
      await processQueueItem(item, options, existingSigs);
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
