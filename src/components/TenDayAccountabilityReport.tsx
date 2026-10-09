import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { getCorrectGameCost } from '../lib/prizes';
import { formatFirstAndLastName } from '../lib/formatters';
import { usePool } from '../lib/PoolContext';
import { useToast } from './NotificationManager';

export default function TenDayAccountabilityReport() {
  const { setIsQuotaExceeded, activePool } = usePool();
  const { addToast } = useToast();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seleção de Ano/Mês e Decêndio
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
  
  // Decêndio: '1' (Dias 1 a 10), '2' (Dias 11 a 20), '3' (Dias 21 a 31), 'all' (Mês todo)
  const [selectedDecendio, setSelectedDecendio] = useState<'1' | '2' | '3' | 'all'>('1');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
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

        // Filtra pelo bolão ativo
        let filteredGames = allGames.filter((g: any) => {
          if (!activePool) return true;
          if (g.poolId === activePool.id) return true;
          const isPrincipal = activePool.id === 'default_lotofacil_pool' || 
            activePool.name?.toLowerCase().includes('principal') || 
            activePool.name?.toLowerCase().includes('lotofácil');
          if (!g.poolId && isPrincipal) return true;
          return false;
        });
        if (filteredGames.length === 0 && allGames.length > 0) {
          filteredGames = allGames;
        }

        setPayments(payList);
        setGames(filteredGames);
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

        // Cache local
        try {
          localStorage.setItem('bolao_cache_payments', JSON.stringify(payList));
          localStorage.setItem('bolao_cache_games', JSON.stringify(filteredGames));
          localStorage.setItem('bolao_cache_results', JSON.stringify(resList));
          localStorage.setItem('bolao_cache_members', JSON.stringify(combined));
        } catch {}

      } catch (err) {
        if (isQuotaError(err)) setIsQuotaExceeded(true);
        // Tenta cache
        try {
          const cp = localStorage.getItem('bolao_cache_payments');
          const cg = localStorage.getItem('bolao_cache_games');
          const cr = localStorage.getItem('bolao_cache_results');
          const cm = localStorage.getItem('bolao_cache_members');
          if (cp) setPayments(JSON.parse(cp));
          if (cg) setGames(JSON.parse(cg));
          if (cr) setResults(JSON.parse(cr));
          if (cm) setMembers(JSON.parse(cm));
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activePool]);

  // Intervalo de dias do decêndio selecionado
  const dateRange = useMemo(() => {
    const year = Number(selectedYear);
    const month = Number(selectedMonth) - 1; // 0-indexed
    let startDay = 1;
    let endDay = 10;

    if (selectedDecendio === '1') {
      startDay = 1;
      endDay = 10;
    } else if (selectedDecendio === '2') {
      startDay = 11;
      endDay = 20;
    } else if (selectedDecendio === '3') {
      startDay = 21;
      // Último dia do mês
      const lastDayDate = new Date(year, month + 1, 0);
      endDay = lastDayDate.getDate();
    } else {
      startDay = 1;
      const lastDayDate = new Date(year, month + 1, 0);
      endDay = lastDayDate.getDate();
    }

    const startDate = new Date(year, month, startDay, 0, 0, 0);
    const endDate = new Date(year, month, endDay, 23, 59, 59);

    let decendioLabel = '1º Decêndio (Dias 01 a 10)';
    if (selectedDecendio === '2') decendioLabel = '2º Decêndio (Dias 11 a 20)';
    if (selectedDecendio === '3') decendioLabel = `3º Decêndio (Dias 21 a ${endDay})`;
    if (selectedDecendio === 'all') decendioLabel = `Mês Inteiro (${selectedMonth}/${selectedYear})`;

    return { startDate, endDate, label: decendioLabel, startDay, endDay };
  }, [selectedYear, selectedMonth, selectedDecendio]);

  // Filtrar dados pelo período do decêndio
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      let pDate: Date | null = null;
      if (p.createdAt) {
        if (typeof p.createdAt.toDate === 'function') pDate = p.createdAt.toDate();
        else if (p.createdAt instanceof Date) pDate = p.createdAt;
        else pDate = new Date(p.createdAt);
      }
      if (!pDate || isNaN(pDate.getTime())) return false;
      return pDate >= dateRange.startDate && pDate <= dateRange.endDate;
    });
  }, [payments, dateRange]);

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      let gDate: Date | null = null;
      if (g.date) {
        if (typeof g.date.toDate === 'function') gDate = g.date.toDate();
        else if (g.date instanceof Date) gDate = g.date;
        else gDate = new Date(g.date);
      }
      if (!gDate || isNaN(gDate.getTime())) return false;
      return gDate >= dateRange.startDate && gDate <= dateRange.endDate;
    });
  }, [games, dateRange]);

  // Cálculos financeiros interconectados
  const totalArrecadadoPeriodo = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  
  const paidMembersCount = members.filter(m => m.paymentStatus === 'Pago').length;
  const totalArrecadadoEfetivo = totalArrecadadoPeriodo > 0 ? totalArrecadadoPeriodo : (paidMembersCount * 20);

  const isMegaSena = activePool?.lotteryType === 'megasena';
  const totalGastoApostas = filteredGames.reduce((sum, g) => sum + getCorrectGameCost(g, isMegaSena), 0);

  // Prêmios ganhos nos jogos do período
  const latestResult = results[0];
  const drawnNumbers: number[] = Array.isArray(latestResult?.numbers)
    ? latestResult.numbers.map((n: any) => Number(n))
    : [];

  const totalPremiosPeriodo = filteredGames.reduce((sum, g) => {
    const isFuture = String(g.contest || '').toLowerCase().includes('futuro');
    if (isFuture) return sum;
    
    const nums: number[] = Array.isArray(g.numbers) ? g.numbers.map((n: any) => Number(n)) : [];
    if (nums.length === 0 || drawnNumbers.length === 0) return sum;

    const hits = nums.filter(n => drawnNumbers.includes(n)).length;
    let prize = 0;
    if (isMegaSena) {
      if (hits === 6) prize = 500000;
      else if (hits === 5) prize = 2500;
      else if (hits === 4) prize = 50;
    } else {
      if (hits === 15) prize = 1500000;
      else if (hits === 14) prize = 1500;
      else if (hits === 13) prize = 30;
      else if (hits === 12) prize = 12;
      else if (hits === 11) prize = 6;
    }
    return sum + prize;
  }, 0);

  const saldoCaixaPeriodo = totalArrecadadoEfetivo - totalGastoApostas + totalPremiosPeriodo;

  // Gerar texto para WhatsApp
  const generateWhatsAppReportText = () => {
    const poolName = activePool?.name || 'Bolão Amigos';
    let text = `📊 *PRESTAÇÃO DE CONTAS - 10 DIAS*\n`;
    text += `🎱 *${poolName}*\n`;
    text += `🗓️ *Período:* ${dateRange.label} (${selectedMonth}/${selectedYear})\n\n`;
    
    text += `💰 *Resumo Financeiro do Ciclo:*\n`;
    text += `• Total Arrecadado: R$ ${totalArrecadadoEfetivo.toFixed(2)}\n`;
    text += `• Investimento em Jogos: R$ ${totalGastoApostas.toFixed(2)}\n`;
    text += `• Prêmios Resgatados: R$ ${totalPremiosPeriodo.toFixed(2)}\n`;
    text += `• 💵 *Saldo em Caixa do Período:* R$ ${saldoCaixaPeriodo.toFixed(2)}\n\n`;

    text += `👥 *Participação e Status:*\n`;
    text += `• Total de Membros Ativos: ${members.length}\n`;
    text += `• Membros com Pagamento Confirmado: ${paidMembersCount}\n\n`;

    text += `🎯 *Jogos Registrados (${filteredGames.length} bilhetes):*\n`;
    if (filteredGames.length === 0) {
      text += `Nenhum jogo registrado neste decêndio.\n`;
    } else {
      filteredGames.slice(0, 5).forEach((g, idx) => {
        text += `${idx + 1}. ${g.contest || 'Concurso'} - Custo: R$ ${getCorrectGameCost(g, isMegaSena).toFixed(2)}\n`;
      });
      if (filteredGames.length > 5) {
        text += `_...e mais ${filteredGames.length - 5} jogos._\n`;
      }
    }

    text += `\n✨ _Transparência total com o grupo! Todos os bilhetes e comprovantes estão disponíveis no aplicativo em tempo real._`;
    return text;
  };

  const copyToClipboard = () => {
    const text = generateWhatsAppReportText();
    navigator.clipboard.writeText(text);
    addToast('Relatório de 10 dias copiado para a área de transferência!', 'success');
  };

  const shareOnWhatsApp = () => {
    const text = generateWhatsAppReportText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mb-2"></div>
        <p>Carregando dados interconectados para prestação de contas...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
            <span>📈</span> Prestação de Contas (Decêndio / 10 Dias)
          </h2>
          <p className="text-sm text-slate-400">
            Relatório automatizado e interconectado com pagamentos, apostas e prêmios da nuvem.
          </p>
        </div>

        {/* Filtros de Data e Período */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDecendio}
            onChange={(e) => setSelectedDecendio(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="1">1º Decêndio (Dias 01 a 10)</option>
            <option value="2">2º Decêndio (Dias 11 a 20)</option>
            <option value="3">3º Decêndio (Dias 21 ao Fim)</option>
            <option value="all">Mês Inteiro</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </div>

      {/* Período Ativo Badge */}
      <div className="bg-slate-800/60 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-sm">
        <span className="text-emerald-300 font-medium">Período Selecionado:</span>
        <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-semibold">
          {dateRange.label} ({dateRange.startDate.toLocaleDateString()} até {dateRange.endDate.toLocaleDateString()})
        </span>
      </div>

      {/* Cards de Resumo Interconectado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Arrecadado no Ciclo</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">R$ {totalArrecadadoEfetivo.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">{filteredPayments.length} pagamentos registrados</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Investido em Jogos</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">R$ {totalGastoApostas.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">{filteredGames.length} bilhetes no período</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Prêmios do Período</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">R$ {totalPremiosPeriodo.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Baseado nos sorteios oficiais</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Saldo do Caixa (Decêndio)</p>
          <p className={`text-2xl font-bold mt-1 ${saldoCaixaPeriodo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            R$ {saldoCaixaPeriodo.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Arrecadação - Gastos + Prêmios</p>
        </div>
      </div>

      {/* Detalhamento e Botões de Compartilhamento */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <span>📋</span> Prévia da Mensagem para o WhatsApp (Pronta para Envio)
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap border border-slate-800 max-h-60 overflow-y-auto">
          {generateWhatsAppReportText()}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 py-2.5 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <span>📋</span> Copiar Relatório
          </button>

          <button
            onClick={shareOnWhatsApp}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            <span>💬</span> Enviar no WhatsApp
          </button>
        </div>
      </div>

      {/* Lista de Membros e Status no Ciclo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-200 flex items-center justify-between">
            <span>👥 Participantes & Pagamentos ({members.length})</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
              {paidMembersCount} Pagos
            </span>
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {members.slice(0, 15).map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="font-medium text-slate-200">{formatFirstAndLastName(m.displayName || m.email || 'Participante')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  m.paymentStatus === 'Pago' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {m.paymentStatus || 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-200 flex items-center justify-between">
            <span>🎯 Jogos Registrados no Período</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full">
              {filteredGames.length} Jogos
            </span>
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {filteredGames.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum jogo cadastrado neste decêndio.</p>
            ) : (
              filteredGames.map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <p className="font-medium text-slate-200">{g.contest || 'Concurso Bolão'}</p>
                    <p className="text-xs text-slate-400">{g.date ? new Date(g.date.seconds ? g.date.seconds * 1000 : g.date).toLocaleDateString() : 'Data recente'}</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs">
                    R$ {getCorrectGameCost(g, isMegaSena).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
