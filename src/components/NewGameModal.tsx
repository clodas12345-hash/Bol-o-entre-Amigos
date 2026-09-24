import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { LOTOFACIL_PRICES, MEGASENA_PRICES, LOTOFACIL_STATS, MEGASENA_STATS } from '../lib/prizes';
import { PRIME_NUMBERS, FRAME_NUMBERS } from './StatsThermometer';

interface NewGameModalProps {
  onClose: () => void;
  onGameAdded?: () => void;
}

interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
  status: 'pending' | 'compressing' | 'ocr' | 'saving' | 'success' | 'duplicate' | 'error';
  progress: number;
  message: string;
  startTime: number;
  durationMs?: number;
}

// Utilitário para consultar jogos já cadastrados no bolão e impedir duplicidades
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
        if (typeof data.date.toDate === 'function') {
          dateStr = data.date.toDate().toISOString().split('T')[0];
        } else if (data.date instanceof Date) {
          dateStr = data.date.toISOString().split('T')[0];
        } else if (typeof data.date === 'string') {
          dateStr = data.date.split('T')[0];
        }
      }
      const numbers = Array.isArray(data.numbers)
        ? data.numbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b)
        : [];
      const numbersKey = numbers.join('-');
      if (numbersKey) {
        if (cNum) {
          signatures.add(`contest::${cNum}::${numbersKey}`);
        } else if (dateStr) {
          signatures.add(`date::${dateStr}::${numbersKey}`);
        }
      }
    });
  } catch (err) {
    console.warn('Aviso: Não foi possível obter histórico de duplicatas prévio:', err);
  }
  return signatures;
};

const parseDateSafely = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
        if (!isNaN(d.getTime())) return d;
      } else {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }
  
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
        if (!isNaN(d.getTime())) return d;
      } else if (parts[0].length === 4) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
        if (!isNaN(d.getTime())) return d;
      }
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

export default function NewGameModal({ onClose, onGameAdded }: NewGameModalProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [contest, setContest] = useState('');
  const [gameDate, setGameDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };
  const [monthRef, setMonthRef] = useState(getCurrentMonthStr());

  const [isTeimosinha, setIsTeimosinha] = useState(true);
  const [teimosinhaCount, setTeimosinhaCount] = useState<number>(6);

  // Fila de processamento de uploads com monitoramento de performance em tempo real
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueElapsedSeconds, setQueueElapsedSeconds] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { addToast } = useToast();
  const { pools, activePool } = usePool();

  const [selectedPoolId, setSelectedPoolId] = useState<string>(activePool?.id || '');

  useEffect(() => {
    if (activePool?.id && !selectedPoolId) {
      setSelectedPoolId(activePool.id);
    }
  }, [activePool?.id, selectedPoolId]);

  // Timer para monitoramento de performance em tempo real da fila
  useEffect(() => {
    let interval: any = null;
    if (isProcessingQueue) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setQueueElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    } else {
      setQueueElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessingQueue]);

  const currentPool = pools.find(p => p.id === selectedPoolId) || activePool;
  const isMegaSena = currentPool?.lotteryType === 'megasena';
  const stats = isMegaSena ? MEGASENA_STATS : LOTOFACIL_STATS;
  const prices = isMegaSena ? MEGASENA_PRICES : LOTOFACIL_PRICES;

  const oddCount = selectedNumbers.filter(n => n % 2 !== 0).length;
  const evenCount = selectedNumbers.filter(n => n % 2 === 0).length;
  const primeCount = selectedNumbers.filter(n => PRIME_NUMBERS.includes(n)).length;
  const frameCount = selectedNumbers.filter(n => FRAME_NUMBERS.includes(n)).length;
  const sumTotal = selectedNumbers.reduce((acc, curr) => acc + curr, 0);

  const unitPrice = prices[selectedNumbers.length] || (isMegaSena ? 5.00 : 3.50);
  const totalCalculatedCost = isTeimosinha ? unitPrice * teimosinhaCount : unitPrice;

  const toggleNumber = (num: number) => {
    let updated: number[];
    if (selectedNumbers.includes(num)) {
      updated = selectedNumbers.filter(n => n !== num);
    } else {
      if (selectedNumbers.length >= stats.maxNumbers) {
        addToast(`O limite máximo é de ${stats.maxNumbers} dezenas por aposta.`, 'error');
        return;
      }
      updated = [...selectedNumbers, num].sort((a, b) => a - b);
    }
    setSelectedNumbers(updated);
  };

  // Sistema de Fila de Upload e Monitoramento de Performance em Tempo Real
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length === 0) return;

    // Inicializa a fila com os arquivos selecionados
    const newQueue: QueueItem[] = selectedFiles.map((file, idx) => ({
      id: `file_${Date.now()}_${idx}`,
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      message: 'Na fila de processamento...',
      startTime: Date.now()
    }));

    setQueueItems(newQueue);
    setIsProcessingQueue(true);

    const targetPoolId = selectedPoolId || activePool?.id || 'default_lotofacil_pool';
    let totalSaved = 0;
    let totalDuplicates = 0;

    try {
      // Carrega assinaturas existentes em lote para comparação ultra-rápida
      const existingSigs = await getExistingSignatures(targetPoolId);

      // Processa cada arquivo da fila de forma assíncrona não-bloqueante
      for (let i = 0; i < newQueue.length; i++) {
        const item = newQueue[i];
        
        // Atualiza status para compactação
        setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'compressing', progress: 25, message: 'Compactando imagem...' } : q));

        const compressed = await new Promise<{ base64: string; mimeType: string }>((resolve) => {
          const safetyTimer = setTimeout(() => {
            resolve({ base64: '', mimeType: item.file.type });
          }, 6000);

          if (!item.file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
              clearTimeout(safetyTimer);
              resolve({ base64: (reader.result as string) || '', mimeType: item.file.type });
            };
            reader.onerror = () => {
              clearTimeout(safetyTimer);
              resolve({ base64: '', mimeType: item.file.type });
            };
            reader.readAsDataURL(item.file);
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              clearTimeout(safetyTimer);
              try {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1800;
                const MAX_HEIGHT = 1800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                  resolve({ base64: dataUrl, mimeType: 'image/jpeg' });
                } else {
                  resolve({ base64: (event.target?.result as string) || '', mimeType: item.file.type });
                }
              } catch {
                resolve({ base64: (event.target?.result as string) || '', mimeType: item.file.type });
              }
            };
            img.onerror = () => {
              clearTimeout(safetyTimer);
              resolve({ base64: (event.target?.result as string) || '', mimeType: item.file.type });
            };
            img.src = event.target?.result as string;
          };
          reader.onerror = () => {
            clearTimeout(safetyTimer);
            resolve({ base64: '', mimeType: item.file.type });
          };
          reader.readAsDataURL(item.file);
        });

        if (!compressed.base64 || compressed.base64.length < 50) {
          setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', progress: 100, message: 'Falha ao ler arquivo.' } : q));
          continue;
        }

        // Atualiza status para OCR IA
        setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'ocr', progress: 55, message: 'Analisando dezenas com IA...' } : q));

        const controller = new AbortController();
        const abortTimer = setTimeout(() => controller.abort(), 35000);

        let res: Response;
        try {
          res = await fetch('/api/lotofacil/ocr-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: [compressed] }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(abortTimer);
        }

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // Ignore JSON parse error
        }

        if (data && data.contest) {
          setContest(String(data.contest));
        }
        if (data && data.date) {
          setGameDate(data.date);
          const pDate = parseDateSafely(data.date);
          if (pDate) setMonthRef(formatDateToMonthRef(pDate));
        }
        if (data && data.isTeimosinha !== undefined) {
          const teimBool = data.isTeimosinha === true || data.isTeimosinha === 'true' || Number(data.isTeimosinha) === 1;
          setIsTeimosinha(teimBool);
          if (data.teimosinhaCount && Number(data.teimosinhaCount) > 0) {
            setTeimosinhaCount(Number(data.teimosinhaCount));
          }
        }

        if (res && res.ok && data && data.success && data.games && Array.isArray(data.games) && data.games.length > 0) {
          const rawGames = data.games.map((g: any) => 
            (Array.isArray(g) ? g : [])
              .map((n: any) => Number(n))
              .filter((n: number) => isMegaSena ? (n >= 1 && n <= 60) : (n >= 1 && n <= 25))
              .sort((a: number, b: number) => a - b)
          );

          // Populate the manual grid with the first game's numbers for visual feedback
          if (rawGames.length > 0 && rawGames[0].length > 0) {
            setSelectedNumbers(rawGames[0]);
          }

          const validGames = rawGames.filter((g: number[]) => isMegaSena ? (g.length >= 6 && g.length <= 20) : (g.length >= 10 && g.length <= 20));

          if (validGames.length > 0) {
            setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'saving', progress: 85, message: `Gravando ${validGames.length} jogo(s)...` } : q));

            const receiptURL = compressed.base64;
            const parsedDate = data.date ? parseDateSafely(data.date) : new Date();
            const contestStr = data.contest ? String(data.contest).trim() : contest.trim();
            const startContestNum = parseInt(contestStr, 10) || 0;
            const currentMonth = data.date ? formatDateToMonthRef(parsedDate) : monthRef.trim();
            const isTeim = data.isTeimosinha === true || data.isTeimosinha === 'true' || Number(data.isTeimosinha) === 1;
            const teimCount = data.teimosinhaCount && Number(data.teimosinhaCount) > 0 ? Number(data.teimosinhaCount) : (isTeim ? (teimosinhaCount || 6) : 1);

            let fileSavedCount = 0;
            let fileDupCount = 0;
            const writePromises: Promise<any>[] = [];

            for (let gIdx = 0; gIdx < validGames.length; gIdx++) {
              const gameNums = validGames[gIdx];
              const numbersKey = gameNums.join('-');
              const unitTotal = prices[gameNums.length] || (isMegaSena ? 5.00 : 3.50);
              const gameLabel = validGames.length > 1 ? ` (Jogo ${gIdx + 1})` : '';

              if (isTeim && startContestNum > 0) {
                let currDate = new Date(parsedDate);
                if (isNaN(currDate.getTime())) currDate = new Date();

                for (let k = 0; k < teimCount; k++) {
                  while (currDate.getDay() === 0) {
                    currDate.setDate(currDate.getDate() + 1);
                  }
                  const currentContestNum = startContestNum + k;
                  const sig = `contest::${currentContestNum}::${numbersKey}`;

                  if (existingSigs.has(sig)) {
                    fileDupCount++;
                    totalDuplicates++;
                  } else {
                    existingSigs.add(sig);
                    fileSavedCount++;
                    totalSaved++;
                    writePromises.push(addDoc(collection(db, 'games'), {
                      poolId: targetPoolId,
                      numbers: gameNums,
                      contest: `Concurso #${currentContestNum}${gameLabel} (Teimosinha ${k + 1}/${teimCount})`,
                      month: currentMonth,
                      cost: unitTotal,
                      date: Timestamp.fromDate(new Date(currDate)),
                      receiptURL,
                      createdAt: serverTimestamp(),
                    }));
                  }
                  currDate.setDate(currDate.getDate() + 1);
                }
              } else {
                const contestLabel = contestStr ? `Concurso #${contestStr}${gameLabel}` : `Concurso Futuro${gameLabel}`;
                const dateIso = parsedDate.toISOString().split('T')[0];
                const sig = startContestNum > 0 ? `contest::${startContestNum}::${numbersKey}` : `date::${dateIso}::${numbersKey}`;

                if (existingSigs.has(sig)) {
                  fileDupCount++;
                  totalDuplicates++;
                } else {
                  existingSigs.add(sig);
                  fileSavedCount++;
                  totalSaved++;
                  writePromises.push(addDoc(collection(db, 'games'), {
                    poolId: targetPoolId,
                    numbers: gameNums,
                    contest: contestLabel,
                    month: currentMonth,
                    cost: isTeim ? unitTotal * teimCount : unitTotal,
                    date: Timestamp.fromDate(parsedDate),
                    receiptURL,
                    createdAt: serverTimestamp(),
                  }));
                }
              }
            }

            if (writePromises.length > 0) {
              await Promise.all(writePromises);
            }

            const duration = Date.now() - item.startTime;
            const finalStatus = fileSavedCount > 0 ? 'success' : 'duplicate';
            const finalMsg = fileSavedCount > 0 ? `${fileSavedCount} aposta(s) salva(s)!` : 'Jogos já cadastrados.';

            setQueueItems(prev => prev.map(q => q.id === item.id ? {
              ...q,
              status: finalStatus,
              progress: 100,
              message: finalMsg,
              durationMs: duration
            } : q));

          } else {
            setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', progress: 100, message: 'Nenhuma dezena válida encontrada.' } : q));
          }
        } else {
          setQueueItems(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', progress: 100, message: data?.message || 'Falha ao analisar comprovante.' } : q));
        }
      }

      if (totalSaved > 0) {
        addToast(`🎉 Fila processada: ${totalSaved} aposta(s) salva(s) com sucesso!`, 'success');
        if (onGameAdded) onGameAdded();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (totalDuplicates > 0) {
        addToast(`ℹ️ Todos os jogos da fila já estavam cadastrados.`, 'info');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        addToast(`⚠️ Nenhum jogo novo foi extraído dos arquivos enviados.`, 'info');
      }

    } catch (err: any) {
      console.warn('Erro na fila de uploads:', err);
      addToast('Erro ao processar fila de uploads.', 'error');
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const handleGenerateBalancedGame = () => {
    const odds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25];
    const evens = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

    let bestGame: number[] = [];
    let attempts = 0;

    while (attempts < 200) {
      attempts++;
      const shuffledOdds = [...odds].sort(() => 0.5 - Math.random());
      const shuffledEvens = [...evens].sort(() => 0.5 - Math.random());
      const candidate = [...shuffledOdds.slice(0, 8), ...shuffledEvens.slice(0, 7)].sort((a, b) => a - b);

      const pCount = candidate.filter(n => PRIME_NUMBERS.includes(n)).length;
      const fCount = candidate.filter(n => FRAME_NUMBERS.includes(n)).length;
      const sum = candidate.reduce((acc, curr) => acc + curr, 0);

      if (pCount >= 5 && pCount <= 6 && fCount >= 9 && fCount <= 11 && sum >= 180 && sum <= 220) {
        bestGame = candidate;
        break;
      }
      if (bestGame.length === 0) bestGame = candidate;
    }

    setSelectedNumbers(bestGame);
    addToast('🎲 Jogo balanceado gerado com sucesso (Padrão 8 Ímpares / 7 Pares / 5-6 Primos)!', 'info');
  };

  const handleSurpresinha = () => {
    const totalNumbersToPick = stats.minNumbers;
    const allNums = Array.from({ length: stats.totalNumbers }, (_, i) => i + 1);
    const shuffled = allNums.sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, totalNumbersToPick).sort((a, b) => a - b);
    setSelectedNumbers(picked);
  };

  // Salvamento manual caso o usuário marque as dezenas no volante sem enviar foto
  const handleSaveManualGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedNumbers.length < stats.minNumbers) {
      addToast(`Selecione ao menos ${stats.minNumbers} dezenas para registrar a aposta.`, 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const targetPoolId = selectedPoolId || activePool?.id || 'default_lotofacil_pool';
      const existingSigs = await getExistingSignatures(targetPoolId);

      const receiptURL = null;
      const parsedDate = parseDateSafely(gameDate);
      const startContestNum = parseInt(contest.trim(), 10) || 0;
      const unitTotal = prices[selectedNumbers.length] || (isMegaSena ? 5.00 : 3.50);
      const numbersKey = [...selectedNumbers].sort((a, b) => a - b).join('-');

      const writePromises: Promise<any>[] = [];
      let savedCount = 0;
      let duplicateCount = 0;

      if (isTeimosinha && startContestNum > 0) {
        let currDate = new Date(parsedDate);
        if (isNaN(currDate.getTime())) currDate = new Date();

        for (let i = 0; i < teimosinhaCount; i++) {
          while (currDate.getDay() === 0) {
            currDate.setDate(currDate.getDate() + 1);
          }
          const currentContestNum = startContestNum + i;
          const sig = `contest::${currentContestNum}::${numbersKey}`;

          if (existingSigs.has(sig)) {
            duplicateCount++;
          } else {
            existingSigs.add(sig);
            savedCount++;
            writePromises.push(addDoc(collection(db, 'games'), {
              poolId: targetPoolId,
              numbers: selectedNumbers,
              contest: `Concurso #${currentContestNum} (Teimosinha ${i + 1}/${teimosinhaCount})`,
              month: monthRef.trim(),
              cost: unitTotal,
              date: Timestamp.fromDate(new Date(currDate)),
              receiptURL,
              createdAt: serverTimestamp(),
            }));
          }
          currDate.setDate(currDate.getDate() + 1);
        }
      } else {
        const contestTrimmed = contest.trim();
        const contestLabel = contestTrimmed ? `Concurso #${contestTrimmed}` : `Concurso Futuro`;
        const dateIso = parsedDate.toISOString().split('T')[0];
        const sig = startContestNum > 0 ? `contest::${startContestNum}::${numbersKey}` : `date::${dateIso}::${numbersKey}`;

        if (existingSigs.has(sig)) {
          duplicateCount++;
        } else {
          existingSigs.add(sig);
          savedCount++;
          writePromises.push(addDoc(collection(db, 'games'), {
            poolId: targetPoolId,
            numbers: selectedNumbers,
            contest: contestLabel,
            month: monthRef.trim(),
            cost: isTeimosinha ? unitTotal * teimosinhaCount : unitTotal,
            date: Timestamp.fromDate(parsedDate),
            receiptURL,
            createdAt: serverTimestamp(),
          }));
        }
      }

      if (writePromises.length > 0) {
        await Promise.race([
          Promise.all(writePromises),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo limite excedido ao salvar.')), 4000))
        ]);

        if (duplicateCount > 0) {
          addToast(`✨ ${savedCount} aposta(s) salva(s)! (${duplicateCount} duplicata(s) ignorada(s)).`, 'success');
        } else {
          addToast('✨ Aposta salva com sucesso no bolão!', 'success');
        }
      } else {
        addToast('ℹ️ Esta aposta já estava cadastrada para este concurso no bolão. Não foi duplicada.', 'info');
      }

      if (onGameAdded) onGameAdded();
      onClose();
      // Nota: Removido navigate('/') para garantir que o usuário não seja removido da página atual!
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Erro ao registrar aposta.');
      addToast('Erro ao salvar o jogo. Verifique sua conexão.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedQueueCount = queueItems.filter(q => q.status === 'success' || q.status === 'duplicate' || q.status === 'error').length;
  const queueProgressPercent = queueItems.length > 0 ? Math.round((completedQueueCount / queueItems.length) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-purple-100 my-auto animate-in fade-in zoom-in duration-200">
        
        {/* Header com estilo moderno */}
        <div className="flex justify-between items-center pb-3 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white px-2 py-0.5 rounded-full">
                Leitor Inteligente com IA & Fila Otimizada
              </span>
            </div>
            <h2 className="text-lg font-black text-purple-950 flex items-center gap-2">
              <span>🎟️</span> {isMegaSena ? 'Nova Aposta da Mega-Sena' : 'Cadastrar Bilhete / Aposta'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition cursor-pointer"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Seção de Upload com Fila e Monitor de Performance em Tempo Real */}
        <div className="mt-4 p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <span>📤</span> Enviar Bilhetes / Comprovantes (Múltiplos)
            </span>
            {isProcessingQueue && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                ⚡ Processando Fila ({completedQueueCount}/{queueItems.length}) - {queueElapsedSeconds}s
              </span>
            )}
          </div>

          <label className="block w-full border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white rounded-xl p-3 text-center cursor-pointer transition group">
            <span className="text-xl block mb-1 group-hover:scale-110 transition">📷</span>
            <span className="text-xs font-bold text-purple-900 block">Clique para selecionar fotos de bilhetes</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Suporta PNG, JPG ou PDFs de lotéricas (vários arquivos simultâneos)</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={isProcessingQueue}
              className="hidden"
            />
          </label>

          {/* Painel de Monitoramento de Performance da Fila em Tempo Real */}
          {queueItems.length > 0 && (
            <div className="bg-white border border-purple-200 rounded-xl p-3 space-y-2.5">
              <div className="flex justify-between items-center text-xs font-bold text-purple-950 border-b pb-1.5">
                <span className="flex items-center gap-1">
                  <span>📊</span> Monitor de Performance da Fila de Uploads
                </span>
                <span className="text-[11px] font-extrabold text-purple-700">
                  {queueProgressPercent}% Concluído ({completedQueueCount}/{queueItems.length})
                </span>
              </div>

              {/* Barra de Progresso Geral */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${queueProgressPercent}%` }}
                ></div>
              </div>

              {/* Lista de Itens na Fila */}
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {queueItems.map((item) => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-gray-100 text-gray-600',
                    compressing: 'bg-blue-100 text-blue-700',
                    ocr: 'bg-amber-100 text-amber-800 animate-pulse',
                    saving: 'bg-purple-100 text-purple-700 animate-pulse',
                    success: 'bg-emerald-100 text-emerald-800',
                    duplicate: 'bg-indigo-100 text-indigo-800',
                    error: 'bg-red-100 text-red-800'
                  };

                  const statusLabels: Record<string, string> = {
                    pending: 'Na fila',
                    compressing: 'Compactando',
                    ocr: 'Lendo IA',
                    saving: 'Gravando',
                    success: 'Sucesso',
                    duplicate: 'Duplicado',
                    error: 'Erro'
                  };

                  return (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 border rounded-lg p-2 text-xs gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt="" className="w-8 h-8 rounded object-cover border" />
                        ) : (
                          <span className="text-base">📄</span>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-gray-800 truncate text-[11px]">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.message} {item.durationMs ? `(${(item.durationMs / 1000).toFixed(1)}s)` : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[item.status] || item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {completedQueueCount === queueItems.length && !isProcessingQueue && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onGameAdded) onGameAdded();
                      onClose();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    ✅ Fila Concluída! Fechar Janela e Atualizar Jogos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSaveManualGame} className="mt-4 space-y-4">
          
          {/* Seletor de Bolão */}
          <div>
            <label className="block text-xs font-bold text-purple-950 mb-1">
              🎱 Bolão de Destino
            </label>
            <select
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              className="w-full border border-purple-300 bg-white rounded-xl p-2.5 text-xs font-bold text-purple-900 focus:outline-purple-600 shadow-2xs"
            >
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.lotteryType === 'megasena' ? 'Mega-Sena' : 'Lotofácil'})
                </option>
              ))}
            </select>
          </div>

          {/* Número do Concurso em Destaque no Volante */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <span>🎯</span> Número do Concurso no Volante *
              </label>
              <p className="text-[10px] text-amber-800">Extraído automaticamente pela IA ou ajustado manualmente</p>
            </div>
            <input
              type="text"
              placeholder="Ex: 3790"
              value={contest}
              onChange={(e) => setContest(e.target.value)}
              className="w-32 border-2 border-amber-400 bg-white rounded-lg p-2 text-sm font-black text-amber-950 text-center focus:outline-purple-600 shadow-xs"
              required
            />
          </div>

          {/* Gerador Rápido / Surpresinha / Balanceado */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateBalancedGame}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🎲</span> Jogo Balanceado (IA)
            </button>
            <button
              type="button"
              onClick={handleSurpresinha}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-3 rounded-xl text-xs transition border flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>✨</span> Surpresinha ({stats.minNumbers} dezenas)
            </button>
          </div>

          {/* Volante de Dezenas (1 a 25 ou 1 a 60) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-1">
                <span>🎯</span> Selecione as Dezenas ({selectedNumbers.length}/{stats.maxNumbers})
              </label>
              <button
                type="button"
                onClick={() => setSelectedNumbers([])}
                className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Limpar Dezenas
              </button>
            </div>

            <div className={`grid ${isMegaSena ? 'grid-cols-10' : 'grid-cols-5'} gap-1.5 p-2 bg-purple-50/50 border border-purple-200 rounded-xl max-h-56 overflow-y-auto`}>
              {Array.from({ length: stats.totalNumbers }, (_, i) => i + 1).map((num) => {
                const isSelected = selectedNumbers.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggleNumber(num)}
                    className={`aspect-square rounded-lg font-black text-xs transition flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-md scale-105 ring-2 ring-purple-400'
                        : 'bg-white text-gray-800 hover:bg-purple-100 border border-gray-200'
                    }`}
                  >
                    {String(num).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estatísticas em Tempo Real do Jogo Selecionado */}
          {selectedNumbers.length >= stats.minNumbers && (
            <div className="bg-purple-900 text-white p-3 rounded-xl text-xs space-y-1.5 shadow-md">
              <div className="font-black text-purple-200 flex items-center justify-between border-b border-purple-800 pb-1">
                <span>📈 Análise Tática do Jogo Selecionado</span>
                <span className="bg-purple-700 px-2 py-0.5 rounded text-[10px]">
                  {selectedNumbers.length} dezenas
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>Ímpares: <strong className="text-emerald-300">{oddCount}</strong></div>
                <div>Pares: <strong className="text-blue-300">{evenCount}</strong></div>
                <div>Primos: <strong className="text-amber-300">{primeCount}</strong></div>
                <div>Moldura: <strong className="text-purple-300">{frameCount}</strong></div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-purple-800 text-[11px]">
                <span>Soma Total: <strong>{sumTotal}</strong></span>
                <span>Custo: <strong className="text-emerald-300">R$ {totalCalculatedCost.toFixed(2)}</strong></span>
              </div>
            </div>
          )}

          {/* Configuração de Concurso e Teimosinha */}
          <div className="space-y-3 pt-1 border-t">
            <div className="flex items-center justify-between bg-purple-50 p-2.5 rounded-xl border border-purple-200">
              <div>
                <label className="text-xs font-bold text-purple-950 block">Modo Teimosinha</label>
                <span className="text-[10px] text-gray-500">Repetir aposta em concursos consecutivos</span>
              </div>
              <input
                type="checkbox"
                checked={isTeimosinha}
                onChange={(e) => setIsTeimosinha(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>

            {isTeimosinha && (
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Quantidade de Concursos (Teimosinha)
                </label>
                <select
                  value={teimosinhaCount}
                  onChange={(e) => setTeimosinhaCount(Number(e.target.value))}
                  className="w-full border border-purple-300 bg-white rounded-lg p-2 text-xs font-bold text-purple-900"
                >
                  <option value={3}>3 Concursos</option>
                  <option value={6}>6 Concursos (Padrão)</option>
                  <option value={12}>12 Concursos</option>
                  <option value={18}>18 Concursos</option>
                  <option value={24}>24 Concursos</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  Mês Ref *
                </label>
                <input
                  type="text"
                  placeholder="MM/AAAA (ex: 08/2026, 09/2026)"
                  value={monthRef}
                  onChange={(e) => setMonthRef(e.target.value)}
                  className="w-full border border-purple-300 bg-white rounded-lg p-2 text-xs focus:outline-purple-600 font-bold text-purple-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">
                  🎯 Concurso Inicial *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 3787"
                  value={contest}
                  onChange={(e) => setContest(e.target.value)}
                  className="w-full border border-purple-300 bg-white rounded-lg p-2 text-xs focus:outline-purple-600 font-bold text-purple-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Data Inicial do Sorteio
                </label>
                <input
                  type="date"
                  value={gameDate}
                  onChange={(e) => setGameDate(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-xs focus:outline-purple-600"
                  required
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 text-xs font-bold rounded-lg leading-relaxed animate-pulse">
              ⚠️ Erro ao salvar: {submitError}
            </div>
          )}

          {/* Botão de Salvamento Manual */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isProcessingQueue}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingQueue || selectedNumbers.length < stats.minNumbers}
              className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Salvando Aposta...'
                : isProcessingQueue
                ? 'Processando Fila...'
                : `Salvar Aposta Manual (${selectedNumbers.length} dezenas)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
