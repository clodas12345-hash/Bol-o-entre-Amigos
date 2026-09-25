import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import PageHeader from './PageHeader';
import { usePool } from '../lib/PoolContext';

export default function VisualChartsDashboard() {
  const { setIsQuotaExceeded } = usePool();
  const [games, setGames] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesSnap, usersSnap, membersSnap] = await Promise.all([
          getDocs(collection(db, 'games')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);

        const gamesList = gamesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGames(gamesList);
        try {
          localStorage.setItem('bolao_cache_games', JSON.stringify(gamesList));
        } catch (e) {
          console.warn('Failed to cache games in VisualChartsDashboard:', e);
        }
        
        const list: any[] = usersSnap.docs.map(d => ({ id: d.id, quotas: 1, ...d.data() }));
        membersSnap.docs.forEach(d => {
          const data = d.data();
          if (!list.some(u => u.id === d.id || (data.email && u.email === data.email))) {
            list.push({ id: d.id, quotas: 1, ...data });
          }
        });
        setMembers(list);
        try {
          localStorage.setItem('bolao_cache_members', JSON.stringify(list));
        } catch (e) {
          console.warn('Failed to cache members in VisualChartsDashboard:', e);
        }
      } catch (e) {
        console.warn('Failed to fetch data in VisualChartsDashboard, trying cached backups:', e);
        if (isQuotaError(e)) setIsQuotaExceeded(true);
        try {
          const cachedGames = localStorage.getItem('bolao_cache_games');
          if (cachedGames) {
            setGames(JSON.parse(cachedGames));
          }
          const cachedMembers = localStorage.getItem('bolao_cache_members');
          if (cachedMembers) {
            setMembers(JSON.parse(cachedMembers));
          }
        } catch (cacheErr) {
          console.error('Failed to parse cached data in VisualChartsDashboard:', cacheErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPaid = members.filter(m => m.paymentStatus === 'Pago').length;
  const totalPending = members.length - totalPaid;
  const totalQuotas = members.reduce((sum, m) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);
  const totalArrecadado = totalQuotas * 20.00;
  const totalInvestedInGames = games.length * 3.50;
  const caixaSaldo = totalArrecadado - totalInvestedInGames;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Painel Visual & Indicadores do Bolão"
        subtitle="Gráficos de evolução financeira, cotas e status de pagamentos"
        icon="📊"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Arrecadação</span>
          <h3 className="text-2xl font-black text-emerald-700">R$ {totalArrecadado.toFixed(2).replace('.', ',')}</h3>
          <p className="text-xs text-gray-500">{totalQuotas} cotas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Apostas</span>
          <h3 className="text-2xl font-black text-purple-700">R$ {totalInvestedInGames.toFixed(2).replace('.', ',')}</h3>
          <p className="text-xs text-gray-500">{games.length} jogos</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saldo</span>
          <h3 className={`text-2xl font-black ${caixaSaldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            R$ {caixaSaldo.toFixed(2).replace('.', ',')}
          </h3>
        </div>
      </div>

      {/* Gráfico Visual de Barras: Status de Pagamentos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">💳 Status de Pagamento dos Participantes</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-emerald-800">Participantes Em Dia (Pagos): {totalPaid}</span>
              <span className="text-emerald-800">{members.length > 0 ? Math.round((totalPaid / members.length) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${members.length > 0 ? (totalPaid / members.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-amber-800">Pendentes / Aguardando: {totalPending}</span>
              <span className="text-amber-800">{members.length > 0 ? Math.round((totalPending / members.length) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${members.length > 0 ? (totalPending / members.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Distribuição de Cotas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">🎟️ Distribuição de Cotas por Membro (Top Participantes)</h3>
        
        <div className="space-y-2.5 max-h-72 overflow-y-auto">
          {members.sort((a, b) => Number(b.quotas || 1) - Number(a.quotas || 1)).map(m => {
            const quotas = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
            const percentage = totalQuotas > 0 ? (quotas / totalQuotas) * 100 : 0;
            return (
              <div key={m.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-800">{m.displayName || m.email}</span>
                  <span className="text-gray-500 font-semibold">{quotas} cota(s) ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, percentage * 2)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
