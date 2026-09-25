import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { calculateGamePrize } from '../lib/prizes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { usePool } from '../lib/PoolContext';

export default function FinancialDashboard() {
  const { setIsQuotaExceeded } = usePool();
  const [payments, setPayments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const checkQuotaError = (err: any) => {
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    };

    const loadData = async () => {
      try {
        const [paySnap, gameSnap, resSnap, usersSnap, membersSnap] = await Promise.all([
          getDocs(collection(db, 'payments')),
          getDocs(collection(db, 'games')),
          getDocs(collection(db, 'lotofacil_results')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);

        const payList = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const gameList = gameSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const resList = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setPayments(payList);
        setGames(gameList);
        setResults(resList);

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
          localStorage.setItem('bolao_cache_games', JSON.stringify(gameList));
          localStorage.setItem('bolao_cache_results', JSON.stringify(resList));
          localStorage.setItem('bolao_cache_members', JSON.stringify(combined));
        } catch (cacheErr) {
          console.warn('Failed to cache financial data:', cacheErr);
        }
      } catch (e) {
        console.error('FinancialDashboard load error:', e);
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
  }, []);

  // Soma de pagamentos explícitos na coleção payments
  const paymentsTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Soma automática baseada em membros marcados como "Pago" (cada cota = R$ 20,00)
  const paidMembersTotal = members
    .filter(m => m.paymentStatus === 'Pago')
    .reduce((sum, m) => {
      const q = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
      return sum + (q * 20.00);
    }, 0);

  // Total arrecadado considera o maior entre os pagamentos avulsos registrados e o cálculo automático dos pagos
  const totalArrecadado = Math.max(paymentsTotal, paidMembersTotal);

  // Total investido em apostas registradas
  const totalGastoApostas = games.reduce((sum, g) => sum + (Number(g.cost) || 0), 0);

  // Cálculo de Prêmios Ganhos
  const latestResult = results[0];
  const drawnNumbers: number[] = Array.isArray(latestResult?.numbers)
    ? latestResult.numbers.map((n: any) => Number(n))
    : [];

  const totalPrizesWon = games.reduce((sum, g) => {
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

    const apostasMes = games
      .filter(g => {
        if (g.date?.toDate) {
          const d = g.date.toDate();
          return d.getFullYear().toString() === selectedYear && d.getMonth() === index;
        }
        return false;
      })
      .reduce((sum, g) => sum + (Number(g.cost) || 0), 0);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Saldo Líquido em Caixa</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-2xl font-black mt-2">
            R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-100 mt-1">Disponível para novos jogos do bolão</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">Total Arrecadado</span>
            <span className="text-lg">📥</span>
          </div>
          <div className="text-2xl font-black mt-2">
            R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-blue-100 mt-1">
            {members.filter(m => m.paymentStatus === 'Pago').length} participantes com cotas pagas
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-100 uppercase tracking-wider">Prêmios Ganhos</span>
            <span className="text-lg">🏆</span>
          </div>
          <div className="text-2xl font-black mt-2">
            R$ {totalPrizesWon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-100 mt-1">Somado ao caixa do bolão</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-700 rounded-xl p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-100 uppercase tracking-wider">Total em Apostas</span>
            <span className="text-lg">🎟️</span>
          </div>
          <div className="text-2xl font-black mt-2">
            R$ {totalGastoApostas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-100 mt-1">{games.length} jogos registrados na Caixa</p>
        </div>
      </div>

      {/* Gráfico de Evolução Mensal */}
      <div>
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div>
            <h3 className="font-bold text-sm text-gray-800">Evolução dos Aportes Mensais</h3>
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

        <div className="h-56 w-full pt-2">
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
