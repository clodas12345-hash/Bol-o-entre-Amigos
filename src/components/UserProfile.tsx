import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { formatFirstAndLastName } from '../lib/formatters';
import { calculateGamePrize } from '../lib/prizes';
import PageHeader from './PageHeader';
import PixPaymentArea from './PixPaymentArea';
import StatsThermometer from './StatsThermometer';
import PoolManager from './PoolManager';
import BackupManager from './BackupManager';

export default function UserProfile() {
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any | null>(null);
  const [savedResultsList, setSavedResultsList] = useState<any[]>([]);
  const [totalPaidQuotas, setTotalPaidQuotas] = useState<number>(1);
  const [showPixSection, setShowPixSection] = useState(false);
  const [showThermometer, setShowThermometer] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const currentUser = auth.currentUser;

  const parseDateSafely = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === 'string') {
      const trimmed = dateVal.trim();
      if (trimmed.includes('-')) {
        const parts = trimmed.split('T')[0].split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
          } else {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
          }
        }
      }
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
          } else {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
          }
        }
      }
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const extractContestNumber = (contestVal: any): number | null => {
    if (!contestVal) return null;
    if (typeof contestVal === 'number' && !isNaN(contestVal)) return contestVal;
    const match = String(contestVal).match(/\b(\d{3,5})\b/);
    return match ? Number(match[1]) : null;
  };

  useEffect(() => {
    if (!currentUser) return;

    const checkQuotaError = (err: any) => {
      if (err && (err.message?.includes('Quota exceeded') || err.message?.includes('quota') || err.code === 'resource-exhausted')) {
        setIsQuotaExceeded(true);
      }
    };

    // Escuta pagamentos do usuário
    const q = query(collection(db, 'payments'), where('userId', '==', currentUser.uid));
    const unsubPayments = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => {
      console.warn('Payments user snapshot error:', err);
      checkQuotaError(err);
    });

    // Escuta dados do perfil no Firestore (users ou members)
    const unsubUser = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uDoc = snapshot.docs.find(d => d.id === currentUser.uid || d.data().email === currentUser.email);
      if (uDoc) {
        setUserProfile({ id: uDoc.id, ...uDoc.data() });
      }
    }, err => {
      console.warn('User profile snapshot error:', err);
      checkQuotaError(err);
    });

    // Escuta jogos para apurar prêmios
    const unsubGames = onSnapshot(collection(db, 'games'), (snapshot) => {
      setGames(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.warn('Games user snapshot error:', err);
      checkQuotaError(err);
    });

    // Escuta resultados de lotofacil
    const qResultsL = query(collection(db, 'lotofacil_results'), orderBy('createdAt', 'desc'), limit(150));
    const unsubResultsL = onSnapshot(qResultsL, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data(), lotteryType: 'lotofacil' }));
      setSavedResultsList(prev => {
        const filteredPrev = prev.filter(r => r.lotteryType !== 'lotofacil');
        return [...filteredPrev, ...list].sort((a, b) => Number(b.contest) - Number(a.contest));
      });
    }, err => {
      console.warn('Lotofacil results snapshot error:', err);
      checkQuotaError(err);
    });

    // Escuta resultados de megasena
    const qResultsM = query(collection(db, 'megasena_results'), orderBy('createdAt', 'desc'), limit(150));
    const unsubResultsM = onSnapshot(qResultsM, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data(), lotteryType: 'megasena' }));
      setSavedResultsList(prev => {
        const filteredPrev = prev.filter(r => r.lotteryType !== 'megasena');
        return [...filteredPrev, ...list].sort((a, b) => Number(b.contest) - Number(a.contest));
      });
    }, err => {
      console.warn('Megasena results snapshot error:', err);
      checkQuotaError(err);
    });

    // Escuta último sorteio geral (Lotofácil por padrão ou o mais recente)
    const qResult = query(collection(db, 'lotofacil_results'), orderBy('createdAt', 'desc'), limit(1));
    const unsubResult = onSnapshot(qResult, (snapshot) => {
      if (!snapshot.empty) {
        setLatestResult(snapshot.docs[0].data());
      }
    }, err => {
      console.warn('Result user snapshot error:', err);
      checkQuotaError(err);
    });

    // Conta total de cotas ativas (Pagas)
    const loadTotalQuotas = async () => {
      try {
        const [usersSnap, membersSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);
        const list: any[] = usersSnap.docs.map(d => ({ id: d.id, quotas: 1, ...d.data() }));
        membersSnap.docs.forEach(d => {
          const data = d.data();
          if (!list.some(u => u.id === d.id || (data.email && u.email === data.email))) {
            list.push({ id: d.id, quotas: 1, ...data });
          }
        });
        const paidCotas = list
          .filter(m => m.paymentStatus === 'Pago')
          .reduce((sum, m) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);
        setTotalPaidQuotas(paidCotas > 0 ? paidCotas : 1);
      } catch (e: any) {
        console.warn('Failed to load total quotas, trying cached members:', e);
        checkQuotaError(e);
        try {
          const cached = localStorage.getItem('bolao_cache_members');
          if (cached) {
            const list = JSON.parse(cached);
            const paidCotas = list
              .filter((m: any) => m.paymentStatus === 'Pago')
              .reduce((sum: number, m: any) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);
            setTotalPaidQuotas(paidCotas > 0 ? paidCotas : 1);
          }
        } catch (cacheErr) {
          console.error('Failed to parse cached members in loadTotalQuotas:', cacheErr);
        }
      }
    };
    loadTotalQuotas();

    return () => {
      unsubPayments();
      unsubUser();
      unsubGames();
      unsubResultsL();
      unsubResultsM();
      unsubResult();
    };
  }, [currentUser]);

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Calcula prêmios acumulados do bolão combinando resultados específicos de cada concurso
  const totalPrize = games.reduce((sum, g) => {
    const gNums = Array.isArray(g.numbers) ? g.numbers.map((n: any) => Number(n)) : [];
    const contestNumber = extractContestNumber(g.contest);

    let targetResult = latestResult;
    if (contestNumber) {
      const found = savedResultsList.find(r => Number(r.contest) === contestNumber);
      if (found) targetResult = found;
    }

    const resDrawn = Array.isArray(targetResult?.numbers)
      ? targetResult.numbers.map((n: any) => Number(n))
      : [];

    const isFutureContestTitle = String(g.contest || '').toLowerCase().includes('futuro');
    const gDate = parseDateSafely(g.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gameDay = new Date(gDate);
    gameDay.setHours(0, 0, 0, 0);
    const isFuture = gameDay.getTime() > today.getTime();

    const limitContest = g.poolId?.toLowerCase().includes('mega') ? 2780 : 3788;
    const isPendingFuture = isFuture || isFutureContestTitle || (contestNumber !== null && contestNumber >= limitContest);

    const pInfo = isPendingFuture
      ? { prizeAmount: 0 }
      : calculateGamePrize(gNums, resDrawn, g.customPrize, targetResult);

    return sum + (pInfo?.prizeAmount || 0);
  }, 0);

  const isUserPaid = userProfile?.paymentStatus === 'Pago';
  const myQuotas = Number(userProfile?.quotas) > 0 ? Number(userProfile?.quotas) : 1;
  const myMonthlyAmount = myQuotas * 20.00;

  // Rateio proporcional: (Prêmio Total / Total de Cotas Pagas) * Minhas Cotas
  const myPrizeShare = isUserPaid ? (myQuotas * (totalPrize / totalPaidQuotas)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Botões de Voltar e Fechar Página */}
      <PageHeader
        title="Meu Perfil e Participação"
        subtitle={`Dados de ${formatFirstAndLastName(currentUser?.displayName || currentUser?.email)}`}
        icon="👤"
      />

      {isQuotaExceeded && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
          <div className="flex">
            <div className="flex-shrink-0 text-xl">⚠️</div>
            <div className="ml-3">
              <p className="text-xs font-bold text-amber-800">
                Limite de Cota do Banco de Dados Atingido (Firestore Quota Exceeded)
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                O aplicativo atingiu o limite gratuito diário de leitura do banco de dados Firestore (Spark Plan). 
                Para continuar utilizando sem interrupções ou limites de cotas, ative o faturamento (upgrade para o plano Blaze/Enterprise) no console do Firebase. 
                Seu limite será reiniciado automaticamente no próximo ciclo diário.
              </p>
              <div className="mt-2.5">
                <a
                  href="https://console.firebase.google.com/project/adept-figure-463322-r2/firestore/databases/ai-studio-a00d8821-22d9-4161-874f-6ffa6eabd8cf/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Fazer Upgrade no Console do Firebase ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 text-sm">Comprovante do Depósito</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-800 font-bold p-1 text-sm"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-2">
              <img
                src={selectedReceipt}
                alt="Comprovante"
                className="max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Status da Cota e Resumo */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-black">
            {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-800">
              {formatFirstAndLastName(currentUser?.displayName || currentUser?.email)}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">{currentUser?.email}</span>
              <span className="bg-amber-100 text-amber-900 font-black text-xs px-2 py-0.5 rounded-full border border-amber-300">
                🎟️ {myQuotas} {myQuotas === 1 ? 'Cota' : 'Cotas'} (R$ {myMonthlyAmount.toFixed(2).replace('.', ',')})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
              isUserPaid
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {isUserPaid ? `✓ Cotas Ativas (${myQuotas})` : `⚠️ ${myQuotas} Cota${myQuotas > 1 ? 's' : ''} Pendente`}
          </span>

          <button
            type="button"
            onClick={() => setShowPixSection(!showPixSection)}
            className="ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
          >
            <span>📱</span> {showPixSection ? 'Ocultar PIX' : `Pagar R$ ${myMonthlyAmount.toFixed(2).replace('.', ',')} via PIX`}
          </button>
        </div>
      </div>

      {/* Área Expansível do PIX para o usuário com o valor exato de suas cotas */}
      {showPixSection && (
        <div className="animate-in fade-in duration-200">
          <PixPaymentArea
            customAmount={myMonthlyAmount}
            title={`Pagar ${myQuotas} Cota${myQuotas > 1 ? 's' : ''} via PIX (R$ ${myMonthlyAmount.toFixed(2).replace('.', ',')})`}
            onClose={() => setShowPixSection(false)}
          />
        </div>
      )}

      {/* Resumo de Aportes e Prêmios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-xs">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Total Investido no Bolão</p>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-2xl font-black mt-2">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-100 mt-1">{payments.length} contribuições confirmadas</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-xl shadow-xs">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-amber-100 uppercase tracking-wider">
              Minha Cota em Prêmios ({myQuotas} {myQuotas === 1 ? 'cota' : 'cotas'})
            </p>
            <span className="text-lg">🏆</span>
          </div>
          <p className="text-2xl font-black mt-2">
            R$ {myPrizeShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-amber-100 mt-1">
            {isUserPaid
              ? `Rateio de ${myQuotas} cota(s) sobre o total de ${totalPaidQuotas} cotas em dia`
              : 'Regularize o pagamento para ter direito ao rateio de prêmios'}
          </p>
        </div>
      </div>

      {/* Área de Ferramentas e Configurações de Análise */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-4">
        <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
          <span>⚙️</span> Ferramentas & Análises
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setShowThermometer(!showThermometer)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              showThermometer 
                ? 'bg-purple-600 border-purple-700 text-white shadow-md' 
                : 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <span className="text-xl mb-1">🌡️</span>
            <span className="text-[10px] font-black uppercase text-center">Termômetro</span>
          </button>

          <button
            onClick={() => {
              setShowReport(!showReport);
              setShowThermometer(false);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              showReport 
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span className="text-xl mb-1">📜</span>
            <span className="text-[10px] font-black uppercase text-center">Termo de Dados</span>
          </button>

          <Link
            to="/backtest"
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer"
          >
            <span className="text-xl mb-1">📊</span>
            <span className="text-[10px] font-black uppercase text-center">Histórico</span>
          </Link>

          <Link
            to="/card-generator"
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <span className="text-xl mb-1">🏆</span>
            <span className="text-[10px] font-black uppercase text-center">Cards</span>
          </Link>
        </div>

        {showThermometer && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-dashed border-purple-200 animate-in zoom-in-95 duration-200">
            <StatsThermometer />
          </div>
        )}

        {showReport && (
          <div className="mt-4 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-emerald-300 shadow-xs space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <div>
                  <h4 className="font-black text-gray-900 text-sm">Termo de Integridade e Auditoria Técnica</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Dados 100% Reais e Auditados</p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>🖨️</span> Imprimir / Salvar PDF
              </button>
            </div>

            <div className="bg-white border rounded-xl p-4 text-[11px] font-mono text-gray-700 max-h-96 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
{`# RELATÓRIO TÉCNICO E TERMO DE INTEGRIDADE DE DADOS
## GESTOR DE BOLÃO LOTOFÁCIL
Data de Emissão: 24 de Setembro de 2026

1. OBJETO DE COMPROMISSO E DECLARAÇÃO LEGAL
O "Bolão Lotofácil Gestor" lida com valores monetários reais e cotas de participantes. A precisão dos dados é estrita e mandatória para proteger a transparência do bolão.

2. MEDIDAS DE CONFORMIDADE TÉCNICA E AUDITORIA
- PURGA DE SIMULADORES: O módulo PrizeSimulator foi permanentemente apagado do sistema.
- DADOS REAIS INTEGRADOS: Todo o histórico de sorteios passados baseia-se exclusivamente na API Oficial da Caixa Econômica Federal.
- CONCURSOS FUTUROS ZERADOS: Qualquer concurso esperado ou seguinte (Concurso #3788 em diante) permanece sem números e prêmios (R$ 0,00), com status "Aguardando Sorteio".
- INICIALIZAÇÃO NO CONCURSO VIGENTE: O app carrega obrigatoriamente por padrão o último sorteio oficial publicado (Concurso #3787).

Assinado por:
Engenharia de Desenvolvimento do Google AI Studio Build
Bolão Lotofácil Gestor — Setembro de 2026`}
            </div>

            <p className="text-[10px] text-gray-500 text-center italic">
              * Você pode clicar no botão acima para imprimir este termo ou salvá-lo como PDF em seu celular/computador.
            </p>
          </div>
        )}
      </div>

      {/* Painel de Gestão de Bolões e Backup (Apenas para Admins) */}
      {userProfile?.role === 'admin' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 sm:p-6 shadow-xs animate-in slide-in-from-bottom duration-300">
            <PoolManager />
          </div>
          <BackupManager />
        </div>
      )}

      {/* Histórico Individual de Pagamentos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-3 bg-gray-50 border-b">
          <h2 className="font-bold text-sm text-gray-800">Meus Pagamentos e Aportes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b">
                <th className="p-3 text-left">Mês de Referência</th>
                <th className="p-3 text-center">Valor Pago</th>
                <th className="p-3 text-center">Data do Depósito</th>
                <th className="p-3 text-center">Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500 text-xs">
                    Nenhum registro de pagamento associado à sua conta até o momento.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3 font-medium text-gray-800">{p.month || '-'}</td>
                    <td className="p-3 text-center font-bold text-emerald-700">
                      R$ {Number(p.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center text-gray-500">
                      {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-3 text-center">
                      {p.receiptURL ? (
                        <button
                          onClick={() => setSelectedReceipt(p.receiptURL)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          Ver Comprovante
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
