import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { usePool } from '../lib/PoolContext';

// Números primos da Lotofácil (entre 1 e 25)
export const PRIME_NUMBERS = [2, 3, 5, 7, 11, 13, 17, 19, 23];

// Números da Moldura (borda da cartela 5x5)
export const FRAME_NUMBERS = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];

// Números do Centro (miolo da cartela 5x5)
export const CENTER_NUMBERS = [7, 8, 9, 12, 13, 14, 17, 18, 19];

export interface NumberStat {
  num: number;
  frequency: number; // Quantas vezes saiu nos sorteios analisados
  delay: number; // Há quantos concursos não sai (0 = saiu no último)
  percentage: number;
  temperature: 'hot' | 'warm' | 'neutral' | 'cold';
}

export default function StatsThermometer({ onSelectNumber }: { onSelectNumber?: (num: number) => void }) {
  const { setIsQuotaExceeded } = usePool();
  const [results, setResults] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_stats_results');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [stats, setStats] = useState<NumberStat[]>([]);
  const [activeTab, setActiveTab] = useState<'grid' | 'ranking' | 'patterns'>('grid');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const q = query(collection(db, 'lotofacil_results'), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(d => d.data());
        setResults(list);
        calculateStats(list);
        
        try {
          localStorage.setItem('bolao_cache_stats_results', JSON.stringify(list));
        } catch (cacheErr) {
          console.warn('Failed to cache stats results:', cacheErr);
        }
      } catch (err) {
        console.warn('Stats load error:', err);
        if (isQuotaError(err)) setIsQuotaExceeded(true);
        
        const cached = localStorage.getItem('bolao_cache_stats_results');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            setResults(list);
            calculateStats(list);
          } catch {}
        }
      }
    };
    
    loadStats();
  }, []);

  const calculateStats = (contestList: any[]) => {
    const totalContests = contestList.length;
    const countMap: Record<number, number> = {};
    const delayMap: Record<number, number> = {};

    for (let i = 1; i <= 25; i++) {
      countMap[i] = 0;
      delayMap[i] = -1; // -1 significa que ainda não calculou
    }

    // Calcula frequência e atraso
    contestList.forEach((contest, cIdx) => {
      const drawn: number[] = Array.isArray(contest.numbers) ? contest.numbers.map(Number) : [];
      for (let i = 1; i <= 25; i++) {
        if (drawn.includes(i)) {
          countMap[i] = (countMap[i] || 0) + 1;
          if (delayMap[i] === -1) {
            delayMap[i] = cIdx; // Quantos concursos atrás foi o último sorteio
          }
        }
      }
    });

    // Se nunca saiu na amostra, delay é o total analisado
    for (let i = 1; i <= 25; i++) {
      if (delayMap[i] === -1) delayMap[i] = totalContests || 0;
    }

    // Frequência esperada na Lotofácil: cada número tem 15/25 = 60% de chance teórica
    const statsArray: NumberStat[] = [];
    for (let i = 1; i <= 25; i++) {
      const freq = countMap[i] || 0;
      const pct = totalContests > 0 ? (freq / totalContests) * 100 : 60;
      
      let temperature: 'hot' | 'warm' | 'neutral' | 'cold' = 'neutral';
      if (pct >= 66 || (delayMap[i] === 0 && pct >= 58)) {
        temperature = 'hot';
      } else if (pct >= 56) {
        temperature = 'warm';
      } else if (pct < 45 || delayMap[i] >= 3) {
        temperature = 'cold';
      }

      statsArray.push({
        num: i,
        frequency: freq,
        delay: delayMap[i],
        percentage: Math.round(pct),
        temperature,
      });
    }

    setStats(statsArray);
  };

  const getTemperatureBadge = (temp: string) => {
    switch (temp) {
      case 'hot':
        return { label: '🔥 Muito Quente', bg: 'bg-red-500 text-white', border: 'border-red-400 ring-2 ring-red-200' };
      case 'warm':
        return { label: '⚡ Frequente', bg: 'bg-amber-500 text-white', border: 'border-amber-400' };
      case 'cold':
        return { label: '❄️ Fria / Atrasada', bg: 'bg-blue-600 text-white', border: 'border-blue-400 ring-2 ring-blue-200' };
      default:
        return { label: '⚪ Média', bg: 'bg-gray-200 text-gray-800', border: 'border-gray-300' };
    }
  };

  const sortedByFreq = [...stats].sort((a, b) => b.frequency - a.frequency);
  const sortedByDelay = [...stats].sort((a, b) => b.delay - a.delay);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌡️</span>
            <div>
              <h3 className="font-black text-base leading-tight">Termômetro das 25 Dezenas</h3>
              <p className="text-xs text-indigo-200">
                Análise estatística e mapa de calor dos sorteios oficiais da Lotofácil ({results.length} concursos analisados)
              </p>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            🗺️ Mapa 5x5
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'ranking' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            🏆 Ranking
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'patterns' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            📊 Padrões Ouro
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* TAB 1: GRID 5x5 com Termômetro */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-gray-500 font-medium">Legenda de Temperatura:</span>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> 🔥 Quente (&gt;65%)
                </span>
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> ⚡ Frequente (55-65%)
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span> ❄️ Fria / Atrasada
                </span>
              </div>
            </div>

            {/* Grid 5x5 */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-lg mx-auto">
              {stats.map(s => {
                const badge = getTemperatureBadge(s.temperature);
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => onSelectNumber && onSelectNumber(s.num)}
                    className={`relative p-2 rounded-xl flex flex-col items-center justify-center transition hover:scale-105 shadow-2xs border ${badge.border} ${
                      s.temperature === 'hot'
                        ? 'bg-red-50 hover:bg-red-100'
                        : s.temperature === 'cold'
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full font-black text-sm flex items-center justify-center shadow-xs ${badge.bg}`}>
                      {String(s.num).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-extrabold text-gray-700 mt-1">
                      {s.percentage}%
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {s.delay === 0 ? 'Saiu no últ.' : `${s.delay} atr.`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: RANKING TOP QUENTES / TOP FRIAS */}
        {activeTab === 'ranking' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 7 Quentes */}
            <div className="bg-red-50/60 border border-red-200 rounded-xl p-3.5">
              <h4 className="font-extrabold text-xs sm:text-sm text-red-950 flex items-center gap-1.5 mb-2.5">
                <span>🔥</span> Dezenas Mais Frequentes (Top Quentes)
              </h4>
              <div className="space-y-2">
                {sortedByFreq.slice(0, 7).map((s, idx) => (
                  <div key={s.num} className="flex items-center justify-between bg-white p-2 rounded-lg border border-red-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-gray-400 font-bold text-[11px]">#{idx + 1}</span>
                      <span className="w-7 h-7 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-xs">
                        {String(s.num).padStart(2, '0')}
                      </span>
                      <span className="font-semibold text-gray-800">Dezena {s.num}</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-red-700 font-bold">{s.frequency}x</strong>
                      <span className="text-gray-400 text-[10px] ml-1">({s.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 7 Atrasadas / Frias */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
              <h4 className="font-extrabold text-xs sm:text-sm text-blue-950 flex items-center gap-1.5 mb-2.5">
                <span>❄️</span> Dezenas Mais Atrasadas (Ciclo de Saída)
              </h4>
              <div className="space-y-2">
                {sortedByDelay.slice(0, 7).map((s, idx) => (
                  <div key={s.num} className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-gray-400 font-bold text-[11px]">#{idx + 1}</span>
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                        {String(s.num).padStart(2, '0')}
                      </span>
                      <span className="font-semibold text-gray-800">Dezena {s.num}</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-blue-800 font-bold">
                        {s.delay === 0 ? 'Saiu no último' : `Atrasada há ${s.delay} conc.`}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PADRÕES MATEMÁTICOS DE MAIOR PREMIAÇÃO NA LOTOFÁCIL */}
        {activeTab === 'patterns' && (
          <div className="space-y-3 text-xs text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="text-emerald-900 font-bold block mb-1 text-sm">⚖️ Pares & Ímpares</span>
                <p className="text-gray-600 text-[11px]">
                  <strong>8 Ímpares e 7 Pares</strong> (ou 7 Ímpares e 8 Pares) representam mais de <strong>60%</strong> de todos os sorteios históricos da Lotofácil.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                <span className="text-purple-900 font-bold block mb-1 text-sm">🔢 Números Primos</span>
                <p className="text-gray-600 text-[11px]">
                  Em <strong>82%</strong> dos sorteios saem exatamente <strong>5 ou 6 números primos</strong> (2, 3, 5, 7, 11, 13, 17, 19, 23).
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-amber-900 font-bold block mb-1 text-sm">🖼️ Moldura vs Centro</span>
                <p className="text-gray-600 text-[11px]">
                  A borda da cartela tem 16 dezenas e o miolo tem 9. O padrão ouro histórico é <strong>9 a 10 dezenas na Moldura</strong> e <strong>5 a 6 no Centro</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
