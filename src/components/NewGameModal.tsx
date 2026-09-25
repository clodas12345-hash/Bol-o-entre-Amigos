import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { LOTOFACIL_PRICES, MEGASENA_PRICES, LOTOFACIL_STATS, MEGASENA_STATS } from '../lib/prizes';
import { PRIME_NUMBERS, FRAME_NUMBERS } from './StatsThermometer';

interface NewGameModalProps {
  onClose: () => void;
  onGameAdded?: () => void;
}

import { useUpload, checkGameDuplicateInFirestore, getExistingSignatures } from '../lib/UploadContext';

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

  const { queue, addToQueue, isProcessing: isUploading } = useUpload();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { addToast } = useToast();
  const { pools, activePool, setIsQuotaExceeded } = usePool();

  const [selectedPoolId, setSelectedPoolId] = useState<string>(activePool?.id || '');

  useEffect(() => {
    if (activePool?.id && !selectedPoolId) {
      setSelectedPoolId(activePool.id);
    }
  }, [activePool?.id, selectedPoolId]);


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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const options = {
      poolId: selectedPoolId || activePool?.id || 'default_lotofacil_pool',
      contest,
      gameDate,
      monthRef,
      isTeimosinha,
      teimosinhaCount
    };

    addToQueue(files, options);
    addToast(`${files.length} arquivo(s) adicionado(s) à fila de processamento em segundo plano.`, 'info');
    onClose();
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
      const existingSigs = await getExistingSignatures();

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
          const dateStr = currDate.toISOString().split('T')[0];

          // Consulta de duplicidade no Firestore
          const dupCheck = await checkGameDuplicateInFirestore(
            currentContestNum,
            numbersKey,
            selectedNumbers,
            existingSigs,
            dateStr
          );

          if (dupCheck.isDuplicate) {
            duplicateCount++;
          } else {
            const sig = `contest::${currentContestNum}::${numbersKey}`;
            existingSigs.add(sig);
            savedCount++;
            writePromises.push(addDoc(collection(db, 'games'), {
              poolId: targetPoolId,
              numbers: selectedNumbers,
              numbersKey,
              contest: `Concurso #${currentContestNum} (Teimosinha ${i + 1}/${teimosinhaCount})`,
              contestNumber: currentContestNum,
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

        // Consulta de duplicidade no Firestore
        const dupCheck = await checkGameDuplicateInFirestore(
          startContestNum,
          numbersKey,
          selectedNumbers,
          existingSigs,
          dateIso
        );

        if (dupCheck.isDuplicate) {
          duplicateCount++;
        } else {
          const sig = startContestNum > 0 ? `contest::${startContestNum}::${numbersKey}` : `date::${dateIso}::${numbersKey}`;
          existingSigs.add(sig);
          savedCount++;
          writePromises.push(addDoc(collection(db, 'games'), {
            poolId: targetPoolId,
            numbers: selectedNumbers,
            numbersKey,
            contest: contestLabel,
            contestNumber: startContestNum > 0 ? startContestNum : null,
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
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        setSubmitError('Limite de cota atingido no banco de dados.');
        addToast('Limite de cota diária atingido.', 'error');
      } else {
        setSubmitError(err.message || 'Erro ao registrar aposta.');
        addToast('Erro ao salvar o jogo. Verifique sua conexão.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };



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

        {/* Seção de Upload Background */}
        <div className="mt-4 p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <span>📤</span> Enviar Bilhetes (Segundo Plano)
            </span>
          </div>

          <label className="block w-full border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white rounded-xl p-3 text-center cursor-pointer transition group">
            <span className="text-xl block mb-1 group-hover:scale-110 transition">📷</span>
            <span className="text-xs font-bold text-purple-900 block">Clique para selecionar fotos</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">O processamento continuará em segundo plano</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
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

          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || selectedNumbers.length < stats.minNumbers}
              className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Salvando Aposta...'
                : isUploading
                ? 'Processando Fila...'
                : `Salvar Aposta Manual (${selectedNumbers.length} dezenas)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
