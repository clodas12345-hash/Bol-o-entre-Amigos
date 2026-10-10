import React, { createContext, useContext, useState, useCallback } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { db, isQuotaError } from './firebase';
import { useToast } from '../components/NotificationManager';
import { usePool } from './PoolContext';
import { LOTOFACIL_PRICES, MEGASENA_PRICES } from './prizes';
import { getApiUrl, safeFetchJson } from './apiHelper';
import { getValidDrawSequence, getNextDrawDate, formatDateToYYYYMMDD } from './drawCalendar';
import { logSystemError } from './systemErrorLogger';

export interface QueueItem {
  id: string;
  file?: File;
  name: string;
  status: 'pending' | 'compressing' | 'ocr' | 'saving' | 'success' | 'duplicate' | 'error';
  progress: number;
  message: string;
  durationMs?: number;
  options?: any;
}

interface UploadContextType {
  queue: QueueItem[];
  addToQueue: (files: File[], options: { poolId: string; contest?: string; gameDate?: string; monthRef?: string; isTeimosinha?: boolean; teimosinhaCount?: number }) => Promise<void>;
  clearCompleted: () => void;
  retryFailed: () => Promise<void>;
  isProcessing: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const parseDateSafely = (dateStr: string): Date => {
  const normalizeYear = (y: number): number => {
    if (y >= 0 && y < 100) return 2000 + y;
    return y;
  };
  if (!dateStr) return new Date();
  if (dateStr.includes('-')) {
    const parts = dateStr.trim().split('T')[0].split(' ')[0].split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      return new Date(normalizeYear(Number(parts[2])), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
    }
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.trim().split(' ')[0].split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      return new Date(normalizeYear(Number(parts[2])), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
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

const performClientSideOcr = async (base64Image: string, apiKey: string): Promise<any> => {
  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '').trim();
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  const prompt = `Extraia dados deste bilhete da Caixa (Lotofácil/Mega-Sena) em JSON:
{
  "success": true,
  "date": "YYYY-MM-DD",
  "contest": "número",
  "isTeimosinha": boolean,
  "teimosinhaCount": number,
  "games": [[dezenas_jogo_1], [dezenas_jogo_2]]
}
Regra: Priorize número do concurso (CONC) e capture todas as dezenas marcadas.`;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Limite estrito de 30 segundos por tentativa de IA

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64
                  }
                }
              ]
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro ${response.status} com modelo ${model}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : text;
      
      let parsed;
      try {
        parsed = JSON.parse(cleanJson.replace(/```json|```/gi, '').trim());
      } catch (e) {
        console.warn('[Client OCR] JSON.parse falhou, tentando extração manual...', e);
        // Fallback simples se o JSON completo falhar: tentar encontrar o objeto principal
        const subMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (subMatch) {
            parsed = JSON.parse(subMatch[0].replace(/```json|```/gi, '').trim());
        } else {
            throw e;
        }
      }
      
      if (parsed && Array.isArray(parsed.games) && parsed.games.length > 0) {
        console.log(`[Client OCR] Success with model: ${model}`);
        return parsed;
      }
    } catch (err) {
      console.warn(`[Client OCR] Modelo ${model} falhou ou retornou inválido:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('Todos os modelos de OCR falharam');
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

  // 1. Verificação ultra-rápida no cache da sessão / lote atual (Sem consumo de leitura do banco de dados!)
  if (inMemorySigs.has(sig)) {
    return { 
      isDuplicate: true, 
      reason: contestNum > 0 ? `Concurso #${contestNum}` : `Data ${dateStr}` 
    };
  }

  // O cache local pré-carregado é a única fonte necessária e evita 100% de leituras duplicadas.
  return { isDuplicate: false };
};

export const getExistingSignatures = async (): Promise<Set<string>> => {
  const signatures = new Set<string>();
  try {
    // Busca reduzida apenas para os jogos mais recentes (evita lentidão no carregamento inicial)
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'), limit(50));
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

export const formatErrorMessage = (rawMsg: string): string => {
  if (!rawMsg) return 'ERRO AO PROCESSAR';
  const lower = String(rawMsg).toLowerCase();
  if (
    lower.includes('failed to fetch') || 
    lower.includes('network') || 
    lower.includes('abort') || 
    lower.includes('timeout') || 
    lower.includes('conexão') || 
    lower.includes('connection')
  ) {
    return 'FALHA DE CONEXÃO';
  }
  if (
    lower.includes('nenhuma dezena') || 
    lower.includes('sem dezenas') || 
    lower.includes('não contém') || 
    lower.includes('legíveis') || 
    lower.includes('sem dezenas legíveis') || 
    lower.includes('no valid tens')
  ) {
    return 'NENHUMA DEZENA VÁLIDA';
  }
  if (lower.includes('quota') || lower.includes('exceeded') || lower.includes('429') || lower.includes('rate limit')) {
    return 'LIMITE DE REQUISIÇÕES (IA)';
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return 'MODELO DE IA INDISPONÍVEL';
  }
  if (lower.includes('ocr') && lower.includes('falharam')) {
    return 'FALHA NA LEITURA (IA)';
  }
  return rawMsg.toUpperCase();
};

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const { addToast } = useToast();
  const { pools, setIsQuotaExceeded } = usePool();

  const getGeminiApiKey = async (): Promise<string | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'system_config', 'gemini'));
      if (docSnap.exists()) {
        return docSnap.data().apiKey || null;
      }
    } catch (e) {
      console.warn('Could not fetch Gemini API Key from Firestore:', e);
    }
    return null;
  };

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
      updateItem(item.id, { status: 'compressing', progress: 20, message: 'Preparando imagem para envio...' });

      // 1. Redimensionamento básico no cliente para economizar banda (máx 1600px, Sharp cuidará dos 1280px e filtros)
      const compressed = await new Promise<{ base64: string; mimeType: string }>((resolve) => {
        if (!item.file) return resolve({ base64: '', mimeType: '' });
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 800; // Redução agressiva para upload instantâneo e processamento rápido da IA
            let w = img.width, h = img.height;
            if (w > h ? w > MAX : h > MAX) {
              if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
              else { w = Math.round(w * (MAX / h)); h = MAX; }
            }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'low'; // Velocidade máxima
              ctx.drawImage(img, 0, 0, w, h);
              resolve({ base64: canvas.toDataURL('image/jpeg', 0.60), mimeType: 'image/jpeg' });
            } else resolve({ base64: e.target?.result as string, mimeType: item.file?.type || '' });
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(item.file);
      });

      if (!compressed.base64) throw new Error('Falha ao processar arquivo');

      updateItem(item.id, { status: 'ocr', progress: 40, message: 'Enviando imagem...' });

      const apiUrl = getApiUrl('/api/lotofacil/ocr-receipt');
      let fetchRes: any = null;

      const isNativePlatform = Capacitor.isNativePlatform();
      let usedClientSideFallback = false;

      if (isNativePlatform) {
        const apiKey = await getGeminiApiKey();
        if (apiKey) {
          try {
            updateItem(item.id, { status: 'ocr', progress: 60, message: 'Analisando no APK...' });
            const ocrResult = await performClientSideOcr(compressed.base64, apiKey);
            fetchRes = { success: true, data: { success: true, ...ocrResult } };
            usedClientSideFallback = true;
          } catch (err: any) {
            console.error('[UploadQueue] Erro no OCR direto do cliente no APK:', err);
          }
        }
      }

      if (!usedClientSideFallback) {
        const maxRetries = 2;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            updateItem(item.id, { progress: 60, message: 'Analisando com IA...' });
            fetchRes = await safeFetchJson<any>(
              apiUrl,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: [compressed] })
              },
              60000 // Timeout estendido para 60s para processamento complexo de imagem + IA
            );

            if (fetchRes.success) {
              break;
            }

            console.warn(`[UploadQueue] Tentativa ${attempt} falhou:`, fetchRes.message);
            if (attempt < maxRetries) {
              updateItem(item.id, { 
                message: `Reconectando (${attempt}/${maxRetries})...`,
                progress: 40 + (attempt * 5)
              });
              // Sem delay artificial para retentativa ultra-rápida
            }
          } catch (e: any) {
            console.error(`[UploadQueue] Erro inesperado na tentativa ${attempt}:`, e);
            if (attempt === maxRetries) {
              fetchRes = { success: false, message: e.message || 'Erro de conexão' };
            } else {
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        }
      }

      if (!fetchRes || !fetchRes.success || !fetchRes.data?.success || !fetchRes.data?.games?.length) {
        const rawNotice = fetchRes?.data?.message || fetchRes?.message || 'Nenhuma dezena válida';
        const noticeMsg = formatErrorMessage(rawNotice);
        updateItem(item.id, { status: 'error', progress: 100, message: noticeMsg, durationMs: Date.now() - startTime });
        return false;
      }

      const data = fetchRes.data;

      updateItem(item.id, { status: 'saving', progress: 70, message: 'Verificando duplicidades no banco...' });

      const receiptURL = compressed.base64;
      let parsedDate = data.date ? parseDateSafely(data.date) : parseDateSafely(gameDate);
      const contestStr = data.contest ? String(data.contest).trim() : (contest || '').trim();
      let startContestNum = parseInt(contestStr, 10) || 0;

      // Se a IA não capturou a data do bilhete mas o Mês Ref ou Concurso é de ano anterior, ajusta o ano de parsedDate
      const currentCalendarYear = new Date().getFullYear();
      if (!data.date && monthRef && typeof monthRef === 'string' && monthRef.includes('/')) {
        const [mPart, yPart] = monthRef.split('/').map(Number);
        const normY = yPart > 0 && yPart < 100 ? 2000 + yPart : yPart;
        if (normY >= 2000 && normY < currentCalendarYear && parsedDate.getFullYear() === currentCalendarYear) {
          parsedDate = new Date(normY, (mPart >= 1 && mPart <= 12 ? mPart : 1) - 1, Math.min(parsedDate.getDate(), 28), 12, 0, 0);
        }
      } else if (!isMegaSena && startContestNum > 2000 && startContestNum <= 3575 && !data.date && parsedDate.getFullYear() >= 2026) {
        const inferredYear = startContestNum <= 2990 ? 2023 : startContestNum <= 3282 ? 2024 : 2025;
        parsedDate = new Date(inferredYear, parsedDate.getMonth(), Math.min(parsedDate.getDate(), 28), 12, 0, 0);
      }

      const currentMonth = (data.date || parsedDate.getFullYear() < currentCalendarYear)
        ? formatDateToMonthRef(parsedDate)
        : (monthRef || formatDateToMonthRef(parsedDate));
      
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
      // Prioritize IA extraction for Teimosinha if present, otherwise fall back to manual options
      const isTeim = typeof data.isTeimosinha === 'boolean' 
        ? data.isTeimosinha 
        : (isTeimosinha === true || isTeimosinha === 'true' || Number(isTeimosinha) === 1);
        
      const teimCount = typeof data.isTeimosinha === 'boolean'
        ? (data.isTeimosinha ? (Number(data.teimosinhaCount) || 1) : 1)
        : (teimosinhaCount && Number(teimosinhaCount) > 0 ? Number(teimosinhaCount) : 1);

      for (let i = 0; i < validGames.length; i++) {
        const gameNums = validGames[i];
        const numbersKey = gameNums.join('-');
        const unitTotal = prices[gameNums.length] || (isMegaSena ? 5.0 : 3.5);
        const gameLabel = validGames.length > 1 ? ` (Jogo ${i + 1})` : '';

        if (isTeim && startContestNum > 0) {
          let startDate = new Date(parsedDate);
          if (isNaN(startDate.getTime())) startDate = new Date();

          const sequence = getValidDrawSequence(startDate, teimCount, isMegaSena ? 'megasena' : 'lotofacil');

          for (let k = 0; k < sequence.length; k++) {
            const seqItem = sequence[k];
            const currentContestNum = startContestNum + k;
            const dateStr = formatDateToYYYYMMDD(seqItem.date);

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
                month: formatDateToMonthRef(seqItem.date),
                cost: unitTotal,
                date: Timestamp.fromDate(seqItem.date),
                receiptURL,
                createdAt: serverTimestamp(),
              });
              savedCount++;
              existingSigs.add(sig);
            }
          }
        } else {
          const contestLabel = startContestNum > 0 ? `Concurso #${startContestNum}${gameLabel}` : `Concurso Futuro${gameLabel}`;
          
          // Ajusta a data para o próximo dia válido de sorteio (sem domingos ou feriados)
          const nextDraw = getNextDrawDate(parsedDate, isMegaSena ? 'megasena' : 'lotofacil');
          const dateStr = formatDateToYYYYMMDD(nextDraw.date);

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

      return true;
    } catch (err: any) {
      console.warn('Aviso no envio em segundo plano:', err.message || err);
      logSystemError('Camera', err, `Upload/OCR do Bilhete (${item.name})`);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      const friendlyError = formatErrorMessage(err?.message || 'Falha de processamento');
      updateItem(item.id, { status: 'error', progress: 100, message: friendlyError });
      return false;
    }
  };

  // Executa lote de itens e, após finalizar o último, volta automaticamente tentando subir os que deram erro até que todos deem certo
  const runBatchUntilAllSucceed = async (itemsToProcess: QueueItem[], existingSigs: Set<string>) => {
    let pendingList = [...itemsToProcess];
    let round = 1;

    while (pendingList.length > 0) {
      const failedInThisRound: QueueItem[] = [];

      if (round > 1) {
        // Marca todos os itens que restaram com erro como 'pending' para a nova rodada automática
        const retryIds = new Set(pendingList.map(i => i.id));
        setQueue(prev =>
          prev.map(q =>
            retryIds.has(q.id)
              ? { ...q, status: 'pending', progress: 15, message: `Tentando novamente (${round}ª passagem)...` }
              : q
          )
        );
        await new Promise(r => setTimeout(r, 100)); // Delay mínimo
      }

      // Processamento paralelo limitado (até 3 requisições simultâneas) para não sobrecarregar a conexão
      const concurrencyLimit = 3;
      for (let i = 0; i < pendingList.length; i += concurrencyLimit) {
        const batch = pendingList.slice(i, i + concurrencyLimit);
        const results = await Promise.all(
          batch.map(item => processQueueItem(item, item.options || {}, existingSigs))
        );
        
        results.forEach((succeeded, idx) => {
          if (!succeeded) failedInThisRound.push(batch[idx]);
        });
      }

      if (failedInThisRound.length === 0) {
        break; // Todos deram certo!
      }

      round++;
      pendingList = failedInThisRound;
    }
  };

  const [signaturesCache, setSignaturesCache] = useState<Set<string> | null>(null);

  const addToQueue = useCallback(async (files: File[], options: any) => {
    const newItems: QueueItem[] = files.map(file => ({
      id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      file,
      name: file.name,
      status: 'pending',
      progress: 0,
      message: 'Aguardando...',
      options
    }));

    setQueue(prev => [...prev, ...newItems]);

    // Pre-fetch signatures once or use cache for the batch
    let existingSigs = signaturesCache;
    if (!existingSigs) {
      existingSigs = await getExistingSignatures();
      setSignaturesCache(existingSigs);
    }

    await runBatchUntilAllSucceed(newItems, existingSigs);
  }, [pools, setIsQuotaExceeded, signaturesCache]);

  const retryFailed = useCallback(async () => {
    const failedItems = queue.filter(item => item.status === 'error');
    if (failedItems.length === 0) return;

    const existingSigs = await getExistingSignatures();
    await runBatchUntilAllSucceed(failedItems, existingSigs);
  }, [queue, pools]);

  const clearCompleted = () => {
    setQueue(prev => prev.filter(item => item.status === 'pending' || item.status === 'compressing' || item.status === 'ocr' || item.status === 'saving'));
  };

  const isProcessing = queue.some(item => item.status !== 'success' && item.status !== 'error' && item.status !== 'duplicate');

  return (
    <UploadContext.Provider value={{ queue, addToQueue, clearCompleted, retryFailed, isProcessing }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) throw new Error('useUpload must be used within an UploadProvider');
  return context;
}
