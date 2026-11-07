import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import PageHeader from './PageHeader';
import { usePool } from '../lib/PoolContext';

export default function VisualChartsDashboard() {
  const { setIsQuotaExceeded, activePool } = usePool();
  const [games, setGames] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesSnap, usersSnap, membersSnap] = await Promise.all([
          getDocs(query(collection(db, 'games'), where('poolId', '==', activePool?.id || 'default_lotofacil_pool'), limit(2000))),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);

        const gamesList = gamesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGames(gamesList);
        
        // Cache assíncrono e limitado
        setTimeout(() => {
          try {
            localStorage.setItem('bolao_cache_games', JSON.stringify(gamesList.slice(0, 1000)));
          } catch (e) {
            console.warn('Failed to cache games in VisualChartsDashboard:', e);
          }
        }, 100);
        
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

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Painel Visual & Indicadores do Bolão"
        subtitle="Gráficos de evolução financeira, cotas e status de pagamentos"
        icon="📊"
      />
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

    </div>
  );
}
