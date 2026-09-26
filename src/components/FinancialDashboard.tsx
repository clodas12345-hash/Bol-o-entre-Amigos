import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { calculateGamePrize } from '../lib/prizes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { usePool } from '../lib/PoolContext';
import { useResponsiveLayout } from '../lib/formatters';

export default function FinancialDashboard() {
  const { setIsQuotaExceeded, isQuotaExceeded, activePool } = usePool();
  const { isMobile, compactCardClass } = useResponsiveLayout();
  const [payments, setPayments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    const checkQuotaError = (err: any) => {
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        setUsingCache(true);
      }
    };

    const loadData = async () => {
      try {
        const [paySnap, gameSnap, resSnap, usersSnap, membersSnap] = await Promise.all([
          getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(500))),
          getDocs(query(collection(db, 'games'), orderBy('date', 'desc'), limit(300))),
          getDocs(query(collection(db, 'lotofacil_results'), orderBy('createdAt', 'desc'), limit(150))),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);

        const payList = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const allGames = gameSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const resList = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filtra jogos pelo bolão ativo ou retrocompatibilidade
        const filteredGames = allGames.filter((g: any) => {
          if (!activePool) return true;
          if (g.poolId === activePool.id) return true;
          const isPrincipalPool = activePool.id === 'default_lotofacil_pool' || 
            activePool.name?.toLowerCase().includes('principal') || 
            activePool.name?.toLowerCase().includes('lotofácil');
          if (!g.poolId && isPrincipalPool) return true;
          return false;
        });

        setPayments(payList);
        setGames(filteredGames);
        setResults(resList);
        setUsingCache(false);

        const uList: any[] = usersSnap.docs.map(d => ({ id: d.id, quotas: 1, ...d.data() }));
        const mList: any[] = membersSnap.docs.map(d => ({ id: d.id, quotas: 1, ...d.data() }));
        const combined = [...uList];
        for (const m of mList) {
          if (!combined.some(u => u.id === m.id || (u.email && m.email && u.email === m.email))) {
            combined.push(m);
          }
        }
        setMembers(combined);

        // Cache successful data
        try {
          localStorage.setItem('bolao_cache_payments', JSON.stringify(payList));
          localStorage.setItem('bolao_cache_games', JSON.stringify(filteredGames));
          localStorage.setItem('bolao_cache_results', JSON.stringify(resList));
          localStorage.setItem('bolao_cache_members', JSON.stringify(combined));
        } catch (cacheErr) {
          console.warn('Failed to cache financial data:', cacheErr);
        }
      } catch (e) {
        if (!isQuotaError(e)) {
          console.error('FinancialDashboard load error:', e);
        }
        checkQuotaError(e);
        
        // Try to load from cache
        try {
          const cachedPay = localStorage.getItem('bolao_cache_payments');
          const cachedGames = localStorage.getItem('bolao_cache_games');
          const cachedResults = localStorage.getItem('bolao_cache_results');
          const cachedMembers = localStorage.getItem('bolao_cache_members');
          
          if (cachedPay) setPayments(JSON.parse(cachedPay));
          if (cachedGames) setGames(JSON.parse(cachedGames));
          if (cachedResults) setResults(JSON.parse(cachedResults));
          if (cachedMembers) setMembers(JSON.parse(cachedMembers));
        } catch (cacheErr) {
          console.warn('Failed to load from financial cache:', cacheErr);
        }
      }
    };
    loadData();

    // No dashboard financeiro, updates em tempo real são menos críticos que economia de cota.
    // Removendo onSnapshots que ouvem coleções inteiras.
  }, [activePool]);

  // Soma de pagamentos explícitos na coleção payments
  const paymentsTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Soma automática baseada em membros marcados como "Pago" (cada cota = R$ 20,00)
  const paidMembersTotal = members
    .filter(m => m.paymentStatus === 'Pago')
    .reduce((sum, m) => {
      const q = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
      return sum + (q * 20.00);
    }, 0);

  // Deduplicação rigorosa de jogos para evitar valores inflados por bilhetes duplicados
  const uniqueGames = useMemo(() => {
    const seen = new Set<string>();
    return games.filter(g => {
      const match = g.contest ? String(g.contest).match(/\b(\d{3,5})\b/) : null;
      const cNum = match ? Number(match[1]) : (typeof g.contestNumber === 'number' ? g.contestNumber : null);
      let dateStr = '';
      if (g.date) {
        if (typeof g.date.toDate === 'function') dateStr = g.date.toDate().toISOString().split('T')[0];
        else if (g.date instanceof Date) dateStr = g.date.toISOString().split('T')[0];
        else if (typeof g.date === 'string') dateStr = g.date.split('T')[0];
      }
      const numbersKey = g.numbersKey || (Array.isArray(g.numbers)
        ? g.numbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b).join('-')
        : '');
      const sig = `${g.poolId || ''}::${cNum || dateStr}::${numbersKey}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }, [games]);

  // Total arrecadado considera o maior entre os pagamentos avulsos registrados e o cálculo automático dos pagos
  const totalArrecadado = Math.max(paymentsTotal, paidMembersTotal);

  // Total investido em apostas registradas (apenas bilhetes únicos)
  const totalGastoApostas = uniqueGames.reduce((sum, g) => sum + (Number(g.cost) || 3.50), 0);

  // Cálculo de Prêmios Ganhos (apenas bilhetes únicos)
  const latestResult = results[0];
  const drawnNumbers: number[] = Array.isArray(latestResult?.numbers)
    ? latestResult.numbers.map((n: any) => Number(n))
    : [];

  const totalPrizesWon = uniqueGames.reduce((sum, g) => {
    const isFutureContestTitle = String(g.contest || '').toLowerCase().includes('futuro');
    const contestMatch = g.contest ? String(g.contest).match(/#(\d+)/) : null;
    const contestNum = contestMatch ? Number(contestMatch[1]) : null;

    if (isFutureContestTitle || (contestNum !== null && (contestNum >= 3788 || (latestResult?.contest && contestNum > Number(latestResult.contest))))) {
      return sum; // Future contest games contribute 0 to prizes won
    }

    const gameNumbers = Array.isArray(g.numbers) ? g.numbers.map((n: any) => Number(n)) : [];

    let targetResult = latestResult;
    if (contestNum) {
      const found = results.find(r => Number(r.contest) === contestNum);
      if (found) targetResult = found;
    }

    const resDrawn = Array.isArray(targetResult?.numbers)
      ? targetResult.numbers.map((n: any) => Number(n))
      : drawnNumbers;

    const prizeInfo = calculateGamePrize(gameNumbers, resDrawn, g.customPrize, targetResult);
    return sum + (Number(prizeInfo.prizeAmount) || 0);
  }, 0);

  // Saldo real disponível em caixa para próximos jogos (Arrecadado + Prêmios Ganhos - Gasto em Apostas)
  const saldoCaixa = totalArrecadado + totalPrizesWon - totalGastoApostas;

  // Montagem dinâmica dos meses para o gráfico
  const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const monthlyData = monthsNames.map((name, index) => {
    const monthNumStr = String(index + 1).padStart(2, '0');
    const pattern = `${monthNumStr}/${selectedYear}`;

    const arrecadadoMes = payments
      .filter(p => {
        if (p.month && typeof p.month === 'string') {
          return p.month.includes(pattern) || p.month === `${index + 1}/${selectedYear}`;
        }
        if (p.createdAt?.toDate) {
          const d = p.createdAt.toDate();
          return d.getFullYear().toString() === selectedYear && d.getMonth() === index;
        }
        return false;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Se não houver pagamentos avulsos mas houver membros pagos no mês atual (ou geral), distribui proporcionalmente ou no mês corrente
    const effectiveArrecadadoMes = arrecadadoMes > 0 ? arrecadadoMes : (index === new Date().getMonth() ? paidMembersTotal : 0);

    const apostasMes = uniqueGames
      .filter(g => {
        if (g.date?.toDate) {
          const d = g.date.toDate();
          return d.getFullYear().toString() === selectedYear && d.getMonth() === index;
        }
        return false;
      })
      .reduce((sum, g) => sum + (Number(g.cost) || 3.50), 0);

    return {
      month: name,
      arrecadado: effectiveArrecadadoMes,
      apostas: apostasMes,
      saldo: effectiveArrecadadoMes - apostasMes
    };
  });

  const availableYears = Array.from(
    new Set([
      new Date().getFullYear().toString(),
      ...payments.map(p => {
        if (p.month && p.month.includes('/')) return p.month.split('/')[1];
        if (p.createdAt?.toDate) return p.createdAt.toDate().getFullYear().toString();
        return null;
      }).filter(Boolean)
    ])
  ).sort().reverse();

  return (
    <div className="p-4 sm:p-5 bg-white">
      {/* Cards de Resumo Real */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        <div className={`bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-emerald-100 uppercase tracking-wider">Saldo Líquido</span>
            <span className="text-sm sm:text-lg">💰</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-blue-100 uppercase tracking-wider">Arrecadado</span>
            <span className="text-sm sm:text-lg">📥</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-amber-100 uppercase tracking-wider">Prêmios Ganhos</span>
            <span className="text-sm sm:text-lg">🏆</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {totalPrizesWon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`bg-gradient-to-br from-purple-500 to-violet-700 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-purple-100 uppercase tracking-wider">Total Apostas</span>
            <span className="text-sm sm:text-lg">🎟️</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {totalGastoApostas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução Mensal */}
      <div>
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-gray-800">Evolução Mensal</h3>
          </div>
          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium text-gray-700 focus:outline-emerald-500"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr!}>Ano {yr}</option>
              ))}
            </select>
          )}
        </div>

        <div className={`${isMobile ? 'h-44' : 'h-56'} w-full pt-1`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Arrecadado']}
                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="arrecadado" fill="#059669" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.arrecadado > 0 ? '#10b981' : '#e5e7eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
