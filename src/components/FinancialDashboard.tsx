import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { calculateGamePrize, getCorrectGameCost } from '../lib/prizes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { usePool } from '../lib/PoolContext';
import { useResponsiveLayout } from '../lib/formatters';
import { useData } from '../lib/DataContext';

export default function FinancialDashboard() {
  const { setIsQuotaExceeded, isQuotaExceeded, activePool } = usePool();
  const { isMobile, compactCardClass } = useResponsiveLayout();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const { payments, games: allGames, members, lotofacilResults: results } = useData();

  const games = useMemo(() => {
    // Filtra jogos pelo bolão ativo ou retrocompatibilidade com fallback
    let filtered = allGames.filter((g: any) => {
      if (!activePool) return true;
      if (g.poolId === activePool.id) return true;
      const isPrincipalPool = activePool.id === 'default_lotofacil_pool' || 
        activePool.name?.toLowerCase().includes('principal') || 
        activePool.name?.toLowerCase().includes('lotofácil');
      if (!g.poolId && isPrincipalPool) return true;
      return false;
    });

    if (filtered.length === 0 && allGames.length > 0) {
      filtered = allGames;
    }
    return filtered;
  }, [allGames, activePool]);

  const usingCache = false; // DataContext cuida do cache localmente de forma transparente

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

  const isMegaSena = activePool?.lotteryType === 'megasena';
  const totalGastoApostas = uniqueGames.reduce((sum, g) => sum + getCorrectGameCost(g, isMegaSena), 0);

  // Cálculo de Prêmios Ganhos (apenas bilhetes únicos)
  const latestResult = results[0];
  const drawnNumbers: number[] = Array.isArray(latestResult?.numbers)
    ? latestResult.numbers.map((n: any) => Number(n))
    : [];

  const totalPrizesWon = uniqueGames.reduce((sum, g) => {
    const isFutureContestTitle = String(g.contest || '').toLowerCase().includes('futuro');
    const contestMatch = g.contest ? String(g.contest).match(/#(\d+)/) : null;
    const contestNum = contestMatch ? Number(contestMatch[1]) : null;

    if (isFutureContestTitle || (contestNum !== null && latestResult?.contest && contestNum > Number(latestResult.contest) && !results.some(r => Number(r.contest) === contestNum))) {
      return sum; // Jogos de concursos futuros sem sorteio apurado contribuem com 0 aos prêmios ganhos
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
