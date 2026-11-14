import { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, isNativeApk, auth } from '../lib/firebase';
import { calculateGamePrize, getCorrectGameCost } from '../lib/prizes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';
import { usePool } from '../lib/PoolContext';
import { useResponsiveLayout } from '../lib/formatters';
import { useData } from '../lib/DataContext';
import { extractContestNumber, parseDateSafely } from './GameHistory';
import { useToast } from './NotificationManager';
import PaymentThankYouWhatsAppModal, { PaymentThankYouPayload } from './PaymentThankYouWhatsAppModal';
import ScheduledPixManager from './ScheduledPixManager';

export const evaluateGamePrize = (game: any, savedResultsList: any[] = []): number => {
  const contestNumber = extractContestNumber(game.contestNumber || game.contest);
  let targetResult: any = null;
  if (contestNumber) {
    targetResult = savedResultsList.find((r: any) => Number(r.contest) === contestNumber);
  }

  const savedPrize = Number(game.prizeAmount || game.customPrize || game.prize || 0);

  if (targetResult && Array.isArray(targetResult.numbers) && targetResult.numbers.length > 0) {
    const resDrawn = targetResult.numbers.map((n: any) => Number(n));
    const gameNumbers: number[] = Array.isArray(game.numbers)
      ? game.numbers.map((n: any) => Number(n))
      : [];
    const prizeInfo = calculateGamePrize(gameNumbers, resDrawn, game.customPrize, targetResult);
    return Number(prizeInfo?.prizeAmount) || 0;
  }

  return savedPrize;
};

export default function FinancialDashboard() {
  const { activePool } = usePool();
  const { isMobile } = useResponsiveLayout();
  const { addToast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewScope, setViewScope] = useState<'current_month' | 'all_time'>('current_month');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'scheduled_pix'>('overview');
  
  const {
    payments,
    games: allGames,
    members,
    lotofacilResults = [],
    megasenaResults = []
  } = useData();

  const [pendingReceiptsCount, setPendingReceiptsCount] = useState<number>(0);
  const [last24HoursPendingCount, setLast24HoursPendingCount] = useState<number>(0);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isQuickValidating, setIsQuickValidating] = useState<boolean>(false);
  const [thankYouQueue, setThankYouQueue] = useState<PaymentThankYouPayload[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pending_receipts'), (snap) => {
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      let count24h = 0;
      const items: any[] = [];
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'validado' || data.status === 'approved' || data.status === 'homologado') {
          return;
        }
        const item = { id: docSnap.id, ...data };
        items.push(item);

        let createdAtMs = now;
        if (data.createdAt?.toDate) {
          createdAtMs = data.createdAt.toDate().getTime();
        } else if (typeof data.createdAt === 'number') {
          createdAtMs = data.createdAt;
        } else if (data.createdAt?.seconds) {
          createdAtMs = data.createdAt.seconds * 1000;
        }
        if (now - createdAtMs <= twentyFourHoursMs) {
          count24h++;
        }
      });
      setLast24HoursPendingCount(count24h);
      setPendingReceiptsCount(items.length);
      setPendingItems(items);
    }, () => {});
    return () => unsub();
  }, []);

  const handleQuickValidate = async (targetItem?: any) => {
    setIsQuickValidating(true);
    try {
      const itemsToProcess = targetItem ? [targetItem] : [...pendingItems];
      if (itemsToProcess.length === 0) {
        addToast?.('Nenhum comprovante pendente para validar', 'warning');
        setIsQuickValidating(false);
        return;
      }

      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      const monthStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

      for (const item of itemsToProcess) {
        const currentUserEmail = auth.currentUser?.email || 'admin';
        const nowIso = new Date().toISOString();
        const auditLogEntry = {
          timestamp: nowIso,
          updatedBy: currentUserEmail,
          userRole: 'admin' as const,
          previousStatus: item.status || 'aguardando_validacao',
          newStatus: 'validado',
          note: `Confirmação rápida realizada pelo administrador (${currentUserEmail}) em ${todayStr}`
        };

        // 1. Update pending_receipts document status to 'validado' with current date and audit history
        if (item.id) {
          await updateDoc(doc(db, 'pending_receipts', item.id), {
            status: 'validado',
            validatedDate: todayStr,
            validatedAt: serverTimestamp(),
            homologatedBy: currentUserEmail,
            history: arrayUnion(auditLogEntry)
          }).catch(() => {});
        }

        // 2. Record payment in payments collection with audit history
        await addDoc(collection(db, 'payments'), {
          memberId: item.memberId || item.userId || '',
          userId: item.userId || item.memberId || '',
          memberName: item.memberName || item.userName || item.name || 'Membro',
          phone: item.phone || '',
          amount: Number(item.amount || item.value || 20.00),
          month: item.month || monthStr,
          status: 'validado',
          validatedDate: todayStr,
          createdAt: serverTimestamp(),
          receiptUrl: item.receiptUrl || '',
          homologatedBy: currentUserEmail,
          history: [auditLogEntry]
        }).catch(() => {});

        // 3. Update member status to 'Pago' in members/users collections
        const targetMemberId = item.memberId || item.userId;
        if (targetMemberId) {
          await updateDoc(doc(db, 'members', targetMemberId), {
            paymentStatus: 'Pago',
            lastPaymentDate: todayStr
          }).catch(() => {});

          await updateDoc(doc(db, 'users', targetMemberId), {
            paymentStatus: 'Pago',
            lastPaymentDate: todayStr
          }).catch(() => {});
        }
      }

      const msg = targetItem
        ? `⚡ Pagamento de ${targetItem.memberName || 'membro'} validado com sucesso!`
        : `⚡ ${itemsToProcess.length} pagamentos validados com sucesso para hoje (${todayStr})!`;
      
      addToast?.(msg, 'success');

      const queuedPayloads: PaymentThankYouPayload[] = itemsToProcess.map(item => {
        const targetId = item.memberId || item.userId;
        const matchedMember = members.find(
          m => m.id === targetId || m.uid === targetId || (item.phone && m.phone === item.phone)
        );
        const memberObj = matchedMember || {
          id: targetId || item.phone,
          displayName: item.memberName || item.userName || item.name || 'Membro',
          phone: item.phone || '',
          quotas: 1
        };
        const q = Number(memberObj.quotas) > 0 ? Number(memberObj.quotas) : 1;
        return {
          member: memberObj,
          confirmedMonth: item.month || item.referenceMonth || monthStr,
          quotas: q,
          amount: Number(item.amount || item.value) || q * 20.0
        };
      });
      if (queuedPayloads.length > 0) {
        setThankYouQueue(queuedPayloads);
      }
    } catch (err) {
      console.error('Erro na validação rápida:', err);
      addToast?.('Erro ao validar pagamento.', 'error');
    } finally {
      setIsQuickValidating(false);
    }
  };

  const isMegaSena = activePool?.lotteryType === 'megasena';
  const savedResultsList = isMegaSena ? megasenaResults : lotofacilResults;

  // Filtra jogos por tipo de loteria mantendo o acervo histórico completo do bolão
  const games = useMemo(() => {
    return allGames.filter((g: any) => {
      const gIsMega = g.lotteryType === 'megasena' || g.type === 'megasena';
      if (isMegaSena) return gIsMega;
      if (gIsMega) return false;
      // Para bolão de Lotofácil com poolId customizado secundário (caso haja múltiplos):
      if (
        activePool &&
        activePool.id &&
        activePool.id !== 'default_lotofacil_pool' &&
        !activePool.name?.toLowerCase().includes('principal') &&
        !activePool.name?.toLowerCase().includes('lotofácil')
      ) {
        return g.poolId === activePool.id;
      }
      return true;
    });
  }, [allGames, activePool, isMegaSena]);

  // Deduplicação por id único de documento para evitar bilhetes duplicados em render
  const uniqueGames = useMemo(() => {
    const seen = new Set<string>();
    return games.filter((g: any) => {
      if (g.id) {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      }
      return true;
    });
  }, [games]);

  // Processa datas, custos e prêmios oficiais de todas as apostas
  const processedGames = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthStr = `${String(currentMonth).padStart(2, '0')}/${currentYear}`;

    return uniqueGames.map((game: any) => {
      const contestNumber = extractContestNumber(game.contestNumber || game.contest);
      let targetResult: any = null;
      if (contestNumber) {
        targetResult = savedResultsList.find((r: any) => Number(r.contest) === contestNumber);
      }

      const gDate = parseDateSafely(game.date || targetResult?.date, game.month, contestNumber);
      const derivedMonth = !isNaN(gDate.getTime())
        ? `${String(gDate.getMonth() + 1).padStart(2, '0')}/${gDate.getFullYear()}`
        : '';
      const monthStr = (game.month && game.month.includes('/') && !game.month.endsWith(String(currentYear)) ? game.month : derivedMonth) || game.month || derivedMonth || currentMonthStr;

      const prize = evaluateGamePrize(game, savedResultsList);
      const cost = getCorrectGameCost(game, isMegaSena);

      return {
        ...game,
        gDate,
        monthStr,
        prize,
        cost,
        contestNumber,
        isWinning: prize > 0
      };
    });
  }, [uniqueGames, savedResultsList, isMegaSena]);

  const now = new Date();
  const currentMonthStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  // Jogos do mês vigente (inclui arquivados do mês, hoje e futuros do mês)
  const currentMonthGames = useMemo(() => {
    return processedGames.filter(g => g.monthStr === currentMonthStr);
  }, [processedGames, currentMonthStr]);

  // Total de cotas dos membros ativos marcados como "Pago" no mês atual
  const paidMembersTotal = useMemo(() => {
    return members
      .filter(
        m =>
          m.paymentStatus === 'Pago' &&
          m.rejected !== true &&
          m.status !== 'recusado' &&
          m.active !== false &&
          m.archived !== true &&
          m.status !== 'inativo' &&
          m.approved !== false
      )
      .reduce((sum, m) => {
        const q = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
        return sum + (q * 20.00);
      }, 0);
  }, [members]);

  // Cálculos do Mês Vigente
  const currentMonthApostasCost = useMemo(() => {
    return currentMonthGames.reduce((sum, g) => sum + g.cost, 0);
  }, [currentMonthGames]);

  const currentMonthPrizes = useMemo(() => {
    return currentMonthGames.reduce((sum, g) => sum + g.prize, 0);
  }, [currentMonthGames]);

  const currentMonthPaymentsTotal = useMemo(() => {
    const monthPayments = payments.filter((p: any) => {
      if (p.month && typeof p.month === 'string') {
        return p.month.includes(currentMonthStr) || p.month === `${now.getMonth() + 1}/${now.getFullYear()}`;
      }
      if (p.createdAt?.toDate) {
        const d = p.createdAt.toDate();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      return false;
    });
    return monthPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  }, [payments, currentMonthStr, now]);

  const currentMonthArrecadado = Math.max(currentMonthPaymentsTotal, paidMembersTotal);
  const currentMonthSaldo = currentMonthArrecadado + currentMonthPrizes - currentMonthApostasCost;

  // Cálculos do Acumulado Histórico Geral
  const allTimeApostasCost = useMemo(() => {
    return processedGames.reduce((sum, g) => sum + g.cost, 0);
  }, [processedGames]);

  const allTimePrizes = useMemo(() => {
    return processedGames.reduce((sum, g) => sum + g.prize, 0);
  }, [processedGames]);

  const allPaymentsTotal = useMemo(() => {
    return payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const allTimeArrecadado = Math.max(allPaymentsTotal, paidMembersTotal);
  const allTimeSaldo = allTimeArrecadado + allTimePrizes - allTimeApostasCost;

  // Valores ativos de exibição de acordo com a aba de escopo selecionada
  const isCurrentMonthScope = viewScope === 'current_month';
  const displaySaldo = isCurrentMonthScope ? currentMonthSaldo : allTimeSaldo;
  const displayArrecadado = isCurrentMonthScope ? currentMonthArrecadado : allTimeArrecadado;
  const displayPrizes = isCurrentMonthScope ? currentMonthPrizes : allTimePrizes;
  const displayApostas = isCurrentMonthScope ? currentMonthApostasCost : allTimeApostasCost;
  const displayGamesCount = isCurrentMonthScope ? currentMonthGames.length : processedGames.length;
  const displayWinningCount = isCurrentMonthScope 
    ? currentMonthGames.filter(g => g.isWinning).length 
    : processedGames.filter(g => g.isWinning).length;

  // Montagem dinâmica dos meses para o gráfico anual
  const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const monthlyData = useMemo(() => {
    return monthsNames.map((name, index) => {
      const monthNumStr = String(index + 1).padStart(2, '0');
      const pattern = `${monthNumStr}/${selectedYear}`;

      const arrecadadoMes = payments
        .filter((p: any) => {
          if (p.month && typeof p.month === 'string') {
            return p.month.includes(pattern) || p.month === `${index + 1}/${selectedYear}`;
          }
          if (p.createdAt?.toDate) {
            const d = p.createdAt.toDate();
            return d.getFullYear().toString() === selectedYear && d.getMonth() === index;
          }
          return false;
        })
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

      const isThisMonth = index === now.getMonth() && selectedYear === now.getFullYear().toString();
      const effectiveArrecadadoMes = arrecadadoMes > 0 ? arrecadadoMes : (isThisMonth ? paidMembersTotal : 0);

      const monthGames = processedGames.filter(g => {
        if (g.monthStr) {
          return g.monthStr === pattern || g.monthStr === `${index + 1}/${selectedYear}`;
        }
        if (g.gDate && !isNaN(g.gDate.getTime())) {
          return g.gDate.getFullYear().toString() === selectedYear && g.gDate.getMonth() === index;
        }
        return false;
      });

      const apostasMes = monthGames.reduce((sum, g) => sum + g.cost, 0);
      const premiosMes = monthGames.reduce((sum, g) => sum + g.prize, 0);

      return {
        month: name,
        arrecadado: effectiveArrecadadoMes,
        apostas: apostasMes,
        premios: premiosMes,
        saldo: effectiveArrecadadoMes + premiosMes - apostasMes
      };
    });
  }, [monthsNames, selectedYear, payments, now, paidMembersTotal, processedGames]);

  const availableYears = useMemo(() => {
    const set = new Set<string>([
      new Date().getFullYear().toString(),
      (new Date().getFullYear() - 1).toString()
    ]);
    payments.forEach((p: any) => {
      if (p.month && p.month.includes('/')) {
        const yr = p.month.split('/')[1];
        if (yr) set.add(yr);
      }
      if (p.createdAt?.toDate) {
        set.add(p.createdAt.toDate().getFullYear().toString());
      }
    });
    processedGames.forEach(g => {
      if (g.monthStr && g.monthStr.includes('/')) {
        const yr = g.monthStr.split('/')[1];
        if (yr) set.add(yr);
      }
      if (g.gDate && !isNaN(g.gDate.getTime())) {
        set.add(g.gDate.getFullYear().toString());
      }
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [payments, processedGames]);

  return (
    <div className="p-4 sm:p-5 bg-white space-y-4">
      <PaymentThankYouWhatsAppModal
        data={thankYouQueue[0] || null}
        payments={payments}
        onClose={() => setThankYouQueue(prev => prev.slice(1))}
      />

      {/* Abas Superiores do Painel Financeiro */}
      <div className="flex bg-gray-100 p-1.5 rounded-xl gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setDashboardTab('overview')}
          className={`flex-1 py-2.5 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            dashboardTab === 'overview'
              ? 'bg-purple-900 text-white shadow-xs font-black'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
          }`}
        >
          <span>📊</span> Visão Geral & Extrato
        </button>
        <button
          type="button"
          onClick={() => setDashboardTab('scheduled_pix')}
          className={`flex-1 py-2.5 px-4 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            dashboardTab === 'scheduled_pix'
              ? 'bg-teal-800 text-white shadow-xs font-black'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
          }`}
        >
          <span>⏰</span> Gestão de Pix Agendados
        </button>
      </div>

      {dashboardTab === 'scheduled_pix' ? (
        <ScheduledPixManager />
      ) : (
        <div className="space-y-4">

      {pendingReceiptsCount > 0 && (
        <div className="mb-4 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white p-3.5 rounded-xl shadow-lg border-2 border-amber-200 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative text-2xl">
                🚨
                {last24HoursPendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                    {last24HoursPendingCount}
                  </span>
                )}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-100">Alerta de Pagamentos Pendentes</p>
                <h4 className="text-sm font-black flex items-center gap-2 flex-wrap">
                  <span>{pendingReceiptsCount} aguardando validação ({last24HoursPendingCount} {last24HoursPendingCount === 1 ? 'novo nas últimas 24h' : 'novos nas últimas 24h'})</span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isQuickValidating}
                onClick={() => handleQuickValidate()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-2 rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer border border-emerald-400 disabled:opacity-50"
              >
                <span>⚡</span> {isQuickValidating ? 'Validando...' : 'Confirmação Rápida (Validar Todos)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('bolao_navigate_to', { detail: { path: '/contatos?tab=receipts' } }));
                }}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer shrink-0"
              >
                Detalhes →
              </button>
            </div>
          </div>

          {/* Lista rápida para confirmação individual sem modal */}
          {pendingItems.length > 0 && (
            <div className="bg-black/25 rounded-lg p-2.5 flex flex-col gap-2 mt-1 border border-white/10">
              <div className="text-[11px] font-black text-amber-100 uppercase tracking-wider flex items-center gap-1">
                <span>⚡</span> Confirmação Rápida Sem Modal:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pendingItems.map((item) => (
                  <div key={item.id} className="bg-white/10 backdrop-blur-xs p-2 rounded-md flex items-center justify-between text-xs border border-white/10">
                    <div className="truncate mr-2">
                      <span className="font-bold block truncate text-white">{item.memberName || item.userName || item.name || 'Membro'}</span>
                      <span className="text-amber-200 text-[10px] font-semibold">
                        R$ {(Number(item.amount || item.value || 20)).toFixed(2)} - {item.month || 'Mês vigente'}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isQuickValidating}
                      onClick={() => handleQuickValidate(item)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] px-2.5 py-1.5 rounded shadow-sm flex items-center gap-1 transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <span>⚡</span> Validar Hoje
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seletor de Escopo: Mês Vigente vs Acumulado Histórico Geral */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">Período de Análise:</span>
          <span className="text-[11px] font-semibold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
            {isCurrentMonthScope 
              ? `Mês Vigente (${currentMonthStr})` 
              : `Consolidado Histórico Geral (${processedGames.length} apostas)`}
          </span>
        </div>
        <div className="flex items-center bg-gray-200 p-0.5 rounded-lg text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewScope('current_month')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
              isCurrentMonthScope
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <span>📅</span> Mês Vigente ({currentMonthStr})
          </button>
          <button
            type="button"
            onClick={() => setViewScope('all_time')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
              !isCurrentMonthScope
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <span>♾️</span> Acumulado Histórico Geral
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        <div className={`bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-emerald-100 uppercase tracking-wider">Saldo Líquido</span>
            <span className="text-sm sm:text-lg">💰</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {displaySaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-100 font-semibold mt-0.5">
            {isCurrentMonthScope ? 'Caixa deste mês' : 'Balanço total do bolão'}
          </div>
        </div>

        <div className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-blue-100 uppercase tracking-wider">Arrecadado</span>
            <span className="text-sm sm:text-lg">📥</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {displayArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-blue-100 font-semibold mt-0.5">
            {isCurrentMonthScope ? 'Cotas do mês atual' : 'Total recebido em cotas'}
          </div>
        </div>

        <div className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-amber-100 uppercase tracking-wider">Prêmios Ganhos</span>
            <span className="text-sm sm:text-lg">🏆</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {displayPrizes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-amber-100 font-semibold mt-0.5">
            {displayWinningCount} {displayWinningCount === 1 ? 'jogo premiado' : 'jogos premiados'}
          </div>
        </div>

        <div className={`bg-gradient-to-br from-purple-500 to-violet-700 rounded-xl text-white shadow-xs ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-purple-100 uppercase tracking-wider">Total Apostas</span>
            <span className="text-sm sm:text-lg">🎟️</span>
          </div>
          <div className="text-lg sm:text-2xl font-black mt-1 sm:mt-2">
            R$ {displayApostas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-purple-100 font-semibold mt-0.5">
            {displayGamesCount} {displayGamesCount === 1 ? 'aposta cadastrada' : 'apostas cadastradas'}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução Mensal */}
      <div>
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-gray-800">Evolução Mensal (Arrecadado vs Apostas)</h3>
          </div>
          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium text-gray-700 focus:outline-emerald-500"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Ano {yr}</option>
              ))}
            </select>
          )}
        </div>

        <div className={`${isMobile ? 'h-48' : 'h-60'} w-full pt-1`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `R$ ${Number(val).toFixed(2)}`,
                  name === 'arrecadado' ? 'Arrecadado' : name === 'apostas' ? 'Apostas' : 'Prêmios'
                ]}
                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }}
              />
              <Legend
                formatter={(val: string) => val === 'arrecadado' ? 'Arrecadado' : val === 'apostas' ? 'Apostas' : 'Prêmios'}
                wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
              />
              <Bar dataKey="arrecadado" name="arrecadado" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="apostas" name="apostas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
      </div>
    )}
    </div>
  );
}
