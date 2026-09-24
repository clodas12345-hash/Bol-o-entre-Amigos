import React, { useState, useEffect, useMemo } from 'react';
import { calculateGamePrize, LOTOFACIL_PRICES } from '../lib/prizes';
import { useToast } from './NotificationManager';

interface VolantesHistoryComparatorProps {
  games: any[];
  members?: any[];
  onClose: () => void;
  onOpenPrizeSplit?: (totalPrize: number, contestName?: string) => void;
}

interface ContestInfo {
  contest: number;
  date?: string;
  numbers: number[];
  accumulated?: boolean;
  prize15Winners?: number;
  prize15Amount?: number;
  prize14Winners?: number;
  prize14Amount?: number;
  prize13Winners?: number;
  prize12Winners?: number;
  prize11Winners?: number;
  isFuture?: boolean;
}

// Extrai o número do concurso de strings como "Concurso #3787", "Concurso 3787", "3787"
function extractContestNumber(contestStr: any): number | null {
  if (!contestStr) return null;
  if (typeof contestStr === 'number') return contestStr;
  const match = String(contestStr).match(/#?(\d{4,5})/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  const anyNum = String(contestStr).match(/(\d+)/);
  if (anyNum && anyNum[1]) {
    return parseInt(anyNum[1], 10);
  }
  return null;
}

export default function VolantesHistoryComparator({
  games,
  members = [],
  onClose,
  onOpenPrizeSplit
}: VolantesHistoryComparatorProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [contestsCache, setContestsCache] = useState<Record<number, ContestInfo>>({});
  const [selectedContestFilter, setSelectedContestFilter] = useState<string>('all');
  const [onlyWinnersFilter, setOnlyWinnersFilter] = useState<boolean>(false);
  const [latestCaixaContest, setLatestCaixaContest] = useState<ContestInfo | null>(null);
  const [manualContestOverrides, setManualContestOverrides] = useState<Record<string, number>>({});
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Mapeia todos os números de concursos únicos mencionados nos jogos
  const uniqueContestNumbers = useMemo(() => {
    const set = new Set<number>();
    games.forEach(g => {
      const c = extractContestNumber(g.contest);
      if (c && c > 1000) {
        set.add(c);
      }
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [games]);

  // Função para buscar um concurso específico na API da Caixa
  const fetchContestData = async (contestNum: number): Promise<ContestInfo | null> => {
    try {
      const res = await fetch(`/api/lotofacil/contest/${contestNum}`);
      const data = await res.json();
      if (data.success && data.result) {
        return {
          contest: data.result.contest,
          date: data.result.date,
          numbers: Array.isArray(data.result.numbers) ? data.result.numbers.map(Number) : [],
          accumulated: data.result.accumulated,
          prize15Winners: data.result.prize15Winners,
          prize15Amount: data.result.prize15Amount,
          prize14Winners: data.result.prize14Winners,
          prize14Amount: data.result.prize14Amount,
          prize13Winners: data.result.prize13Winners,
          prize12Winners: data.result.prize12Winners,
          prize11Winners: data.result.prize11Winners
        };
      }
    } catch (e) {
      console.warn(`Erro ao buscar dados do concurso ${contestNum}:`, e);
    }
    return null;
  };

  // Busca também o concurso mais recente oficial da Caixa para jogos sem concurso definido
  const fetchLatestCaixa = async () => {
    try {
      const res = await fetch('/api/lotofacil/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest: 'latest' })
      });
      const data = await res.json();
      if (data.success && data.result) {
        const info: ContestInfo = {
          contest: data.result.contest,
          date: data.result.date,
          numbers: Array.isArray(data.result.numbers) ? data.result.numbers.map(Number) : [],
          accumulated: data.result.accumulated,
          prize15Winners: data.result.prize15Winners,
          prize15Amount: data.result.prize15Amount,
          prize14Winners: data.result.prize14Winners,
          prize14Amount: data.result.prize14Amount,
          prize13Winners: data.result.prize13Winners,
          prize12Winners: data.result.prize12Winners,
          prize11Winners: data.result.prize11Winners
        };
        setLatestCaixaContest(info);
        setContestsCache(prev => ({ ...prev, [info.contest]: info }));
        return info;
      }
    } catch (e) {
      console.warn('Erro ao obter último resultado da Caixa:', e);
    }
    return null;
  };

  // Carrega automaticamente todos os concursos necessários
  const runAutoComparison = async () => {
    setIsLoading(true);
    addToast('⚡ Varredura iniciada: Cruzando todas as apostas com os concursos oficiais da Caixa...', 'info');
    const timeoutId = setTimeout(() => setIsLoading(false), 3500);
    try {
      // 1. Puxa o mais recente
      const latest = await fetchLatestCaixa();

      // 2. Para cada concurso único identificado nos volantes
      const neededContests = [...uniqueContestNumbers];
      const newCache: Record<number, ContestInfo> = { ...(latest ? { [latest.contest]: latest } : {}) };

      await Promise.all(
        neededContests.map(async (cNum) => {
          if (newCache[cNum]) return;
          const info = await fetchContestData(cNum);
          if (info) {
            newCache[cNum] = info;
          } else if (latest && cNum > latest.contest) {
            // Concurso futuro ainda não apurado pela Caixa
            newCache[cNum] = {
              contest: cNum,
              numbers: [],
              isFuture: true
            };
          }
        })
      );

      setContestsCache(prev => ({ ...prev, ...newCache }));
      addToast('✅ Varredura concluída! Todas as apostas foram conferidas.', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAutoComparison();
  }, [uniqueContestNumbers]);

  // Avaliação Jogo a Jogo com o concurso correto
  const auditedGames = useMemo(() => {
    return games.map((game, idx) => {
      const explicitNum = manualContestOverrides[game.id] || extractContestNumber(game.contest);
      const targetContestNum = explicitNum || (latestCaixaContest ? latestCaixaContest.contest : null);

      const contestData = targetContestNum ? contestsCache[targetContestNum] : null;
      const drawnNumbers = contestData?.numbers || [];
      const isFuture = contestData?.isFuture || (latestCaixaContest && targetContestNum ? targetContestNum > latestCaixaContest.contest : false);

      const gameNumbers: number[] = Array.isArray(game.numbers)
        ? game.numbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b)
        : [];

      const prizeInfo = !isFuture && drawnNumbers.length === 15
        ? calculateGamePrize(gameNumbers, drawnNumbers, game.customPrize, contestData)
        : { hits: 0, prizeAmount: 0, isWinner: false, badgeColor: 'bg-gray-100 text-gray-500' };

      const cost = game.totalCost || LOTOFACIL_PRICES[gameNumbers.length] || 3.50;

      return {
        ...game,
        gameIndex: idx + 1,
        targetContestNum,
        contestData,
        drawnNumbers,
        isFuture,
        gameNumbers,
        prizeInfo,
        cost
      };
    });
  }, [games, contestsCache, manualContestOverrides, latestCaixaContest]);

  // Filtros aplicados
  const filteredAuditedGames = useMemo(() => {
    return auditedGames.filter(g => {
      if (onlyWinnersFilter && !g.prizeInfo.isWinner) return false;
      if (selectedContestFilter !== 'all') {
        const filterNum = Number(selectedContestFilter);
        if (g.targetContestNum !== filterNum) return false;
      }
      return true;
    });
  }, [auditedGames, onlyWinnersFilter, selectedContestFilter]);

  // KPIs e Estatísticas Globais
  const stats = useMemo(() => {
    const totalGames = auditedGames.length;
    const totalWinners = auditedGames.filter(g => g.prizeInfo.isWinner).length;
    const totalPrizes = auditedGames.reduce((acc, g) => acc + (g.prizeInfo.prizeAmount || 0), 0);
    const totalInvested = auditedGames.reduce((acc, g) => acc + (g.cost || 0), 0);
    const netBalance = totalPrizes - totalInvested;

    const hits15 = auditedGames.filter(g => g.prizeInfo.hits === 15).length;
    const hits14 = auditedGames.filter(g => g.prizeInfo.hits === 14).length;
    const hits13 = auditedGames.filter(g => g.prizeInfo.hits === 13).length;
    const hits12 = auditedGames.filter(g => g.prizeInfo.hits === 12).length;
    const hits11 = auditedGames.filter(g => g.prizeInfo.hits === 11).length;

    const totalPaidQuotas = members
      .filter(m => m.paymentStatus === 'Pago')
      .reduce((sum, m) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);

    const prizePerQuota = totalPaidQuotas > 0 ? totalPrizes / totalPaidQuotas : 0;

    return {
      totalGames,
      totalWinners,
      winRate: totalGames > 0 ? Math.round((totalWinners / totalGames) * 100) : 0,
      totalPrizes,
      totalInvested,
      netBalance,
      hits15,
      hits14,
      hits13,
      hits12,
      hits11,
      totalPaidQuotas,
      prizePerQuota
    };
  }, [auditedGames, members]);

  // Copia relatório de conferência para WhatsApp
  const handleCopyWhatsAppReport = () => {
    let report = `🍀 *AUDITORIA AUTOMÁTICA DE VOLANTES - BOLÃO LOTOFÁCIL*\n\n`;
    report += `📊 *RESUMO GERAL:*\n`;
    report += `• Total de Apostas: ${stats.totalGames} volantes\n`;
    report += `• Volantes Premiados: ${stats.totalWinners} (${stats.winRate}% de acerto)\n`;
    report += `• Total Premiado: R$ ${stats.totalPrizes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    report += `• Total Investido: R$ ${stats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    report += `• Saldo Líquido: ${stats.netBalance >= 0 ? '🟢 Lucro de' : '🔴'} R$ ${Math.abs(stats.netBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;

    if (stats.totalPaidQuotas > 0) {
      report += `• Valor por Cota: *R$ ${stats.prizePerQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n`;
    }

    report += `\n🎯 *DETALHAMENTO DOS ACERTOS:*\n`;
    if (stats.hits15 > 0) report += `🏆 15 Pontos: ${stats.hits15} aposta(s)\n`;
    if (stats.hits14 > 0) report += `🥈 14 Pontos: ${stats.hits14} aposta(s)\n`;
    if (stats.hits13 > 0) report += `🥉 13 Pontos: ${stats.hits13} aposta(s) (R$ 35 cada)\n`;
    if (stats.hits12 > 0) report += `✨ 12 Pontos: ${stats.hits12} aposta(s) (R$ 14 cada)\n`;
    if (stats.hits11 > 0) report += `🍀 11 Pontos: ${stats.hits11} aposta(s) (R$ 7 cada)\n`;

    report += `\n📝 *VOLANTES PREMIADOS:*\n`;
    const winners = auditedGames.filter(g => g.prizeInfo.isWinner);
    if (winners.length === 0) {
      report += `Nenhum volante atingiu 11+ pontos ainda.\n`;
    } else {
      winners.forEach(w => {
        report += `• ${w.contest || `Jogo #${w.gameIndex}`}: *${w.prizeInfo.hits} ACERTOS* ➔ R$ ${w.prizeInfo.prizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      });
    }

    report += `\n_Conferência oficial sincronizada com a Caixa Econômica Federal._`;

    navigator.clipboard.writeText(report);
    addToast('📋 Relatório de auditoria copiado para a área de transferência!', 'success');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-200 my-4 overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho da Ferramenta */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-purple-200">
                Loterias Caixa • Auditor Oficial
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Sincronização Automática
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1 flex items-center gap-2 text-white">
              <span>⚡</span> Varredura e Auditoria Completa de Volantes
            </h2>
            <p className="text-xs text-purple-200">
              Cada volante cadastrado é varrido e comparado diretamente com seu respectivo concurso oficial
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={runAutoComparison}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-2 rounded-xl transition border border-emerald-400/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              title="Executar varredura completa nas apostas"
            >
              <span>{isLoading ? '⏳' : '⚡'}</span>
              <span>{isLoading ? 'Varrendo...' : 'Varrer Apostas'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsAppReport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Copiar resumo de auditoria para o WhatsApp"
            >
              <span>📢</span> WhatsApp
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-white/30"
              title="Fechar janela"
            >
              <span>✕</span> <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Dashboard de KPIs e Resultados do Bolão */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Volantes Auditados
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-purple-950">{stats.totalGames}</span>
                <span className="text-xs font-bold text-purple-700">jogos</span>
              </div>
              <span className="text-[11px] text-purple-600 block mt-0.5">
                {uniqueContestNumbers.length > 0 ? `${uniqueContestNumbers.length} concursos vinculados` : 'Conferência ativa'}
              </span>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Volantes Premiados
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-800">{stats.totalWinners}</span>
                <span className="text-xs font-black text-emerald-600">({stats.winRate}%)</span>
              </div>
              <span className="text-[11px] text-emerald-700 block mt-0.5">
                11 a 15 acertos
              </span>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Total Premiado
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
                R$ {stats.totalPrizes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              {stats.prizePerQuota > 0 && (
                <span className="text-[11px] font-bold text-amber-800 block mt-0.5">
                  R$ {stats.prizePerQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / cota
                </span>
              )}
            </div>

            <div className={`p-3 rounded-xl border ${stats.netBalance >= 0 ? 'bg-teal-50/80 border-teal-200 text-teal-950' : 'bg-rose-50/80 border-rose-200 text-rose-950'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                {stats.netBalance >= 0 ? 'Lucro Líquido' : 'Balanço Atual'}
              </span>
              <div className="text-xl sm:text-2xl font-black mt-1">
                {stats.netBalance >= 0 ? '+' : '-'} R$ {Math.abs(stats.netBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] block mt-0.5 opacity-80">
                Apostado: R$ {stats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Faixas de Premiação Atingidas */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-black text-gray-700 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <span>📊</span> Resumo por Faixa de Pontos:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg font-bold ${stats.hits15 > 0 ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'}`}>
                🏆 15 pts: <strong>{stats.hits15}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${stats.hits14 > 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'}`}>
                🥈 14 pts: <strong>{stats.hits14}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${stats.hits13 > 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'}`}>
                🥉 13 pts: <strong>{stats.hits13}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${stats.hits12 > 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'}`}>
                ✨ 12 pts: <strong>{stats.hits12}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${stats.hits11 > 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'}`}>
                🍀 11 pts: <strong>{stats.hits11}</strong>
              </span>
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-xs font-black text-gray-600 uppercase">Filtrar por Concurso:</span>
              <select
                value={selectedContestFilter}
                onChange={e => setSelectedContestFilter(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">Todos os Concursos ({auditedGames.length})</option>
                {uniqueContestNumbers.map(cNum => {
                  const count = auditedGames.filter(g => g.targetContestNum === cNum).length;
                  return (
                    <option key={cNum} value={cNum}>
                      Concurso #{cNum} ({count} apostas)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyWinnersFilter}
                  onChange={e => setOnlyWinnersFilter(e.target.checked)}
                  className="rounded text-purple-600 w-4 h-4 cursor-pointer"
                />
                <span>Mostrar Apenas Premiados (11+ pts) 🏆</span>
              </label>

              {onOpenPrizeSplit && stats.totalPrizes > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenPrizeSplit(stats.totalPrizes, 'Auditoria Histórica')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>💰</span> Ratear Prêmio (R$ {stats.totalPrizes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </button>
              )}
            </div>
          </div>

          {/* Lista de Volantes com Auditoria Detalhada */}
          <div className="space-y-3">
            {filteredAuditedGames.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <span className="text-3xl block mb-2">🔍</span>
                <h4 className="text-sm font-bold text-gray-700">Nenhum volante encontrado com os filtros selecionados.</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Desmarque a opção de apenas premiados ou selecione outro concurso para conferir.
                </p>
              </div>
            ) : (
              filteredAuditedGames.map((game) => {
                const contestInfo = game.contestData;
                const drawnNumbers = game.drawnNumbers || [];
                const hits = game.prizeInfo.hits;
                const isWinner = game.prizeInfo.isWinner;
                const prizeAmount = game.prizeInfo.prizeAmount;

                return (
                  <div
                    key={game.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition ${
                      isWinner
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Linha Superior do Card: Nome do Jogo + Concurso Vinculado + Prêmio */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-gray-800">
                            Volante #{game.gameIndex}
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            {game.contest || 'Aposta Padrão'}
                          </span>
                          {game.month && (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                              {game.month}
                            </span>
                          )}
                        </div>

                        {/* Informações do Concurso Específico */}
                        <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                          <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                            🎯 Comparado com: Concurso {game.targetContestNum || 'Geral'}
                          </span>
                          {contestInfo?.date && (
                            <span className="text-gray-500 text-[11px]">
                              Sorteio em: <strong>{contestInfo.date}</strong>
                            </span>
                          )}
                          {contestInfo?.accumulated !== undefined && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${contestInfo.accumulated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {contestInfo.accumulated ? 'Acumulou' : 'Saiu Prêmio'}
                            </span>
                          )}
                          {game.isFuture && (
                            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              ⏳ Concurso Futuro (Aguardando Sorteio)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badge de Acertos e Premiação */}
                      <div className="flex items-center gap-2 sm:self-center shrink-0">
                        {game.isFuture ? (
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            Aguardando Apuração
                          </span>
                        ) : (
                          <>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-gray-400 block uppercase">Resultado</span>
                              <span className={`text-xs sm:text-sm font-black px-2 py-0.5 rounded-md ${
                                hits >= 14
                                  ? 'bg-purple-700 text-white animate-pulse'
                                  : hits >= 11
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {hits} Acertos
                              </span>
                            </div>

                            {prizeAmount > 0 && (
                              <div className="text-right bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg">
                                <span className="text-[9px] font-bold text-emerald-800 uppercase block">Prêmio Ganho</span>
                                <span className="text-xs sm:text-sm font-black text-emerald-950 whitespace-nowrap">
                                  R$ {prizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {game.receiptURL && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptUrl(game.receiptURL)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg border border-indigo-200 transition cursor-pointer"
                            title="Ver bilhete/comprovante oficial"
                          >
                            📷 Bilhete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dezenas com Destaque Visual dos Acertos */}
                    <div className="mt-2.5">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {game.gameNumbers.map((num: number) => {
                          const isHit = drawnNumbers.includes(num);
                          return (
                            <span
                              key={num}
                              title={isHit ? `Número ${num} sorteado no Concurso ${game.targetContestNum}!` : `Número ${num}`}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs flex items-center justify-center transition shadow-2xs ${
                                isHit
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 font-black scale-105 shadow-sm'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {String(num).padStart(2, '0')}
                            </span>
                          );
                        })}
                      </div>

                      {/* Dezenas Oficiais do Concurso em Miniatura para Conferência Direta */}
                      {drawnNumbers.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap text-[11px] text-gray-500">
                          <span className="font-bold text-gray-700">Dezenas Sorteadas Caixa #{game.targetContestNum}:</span>
                          <span className="font-mono text-purple-900 font-semibold">
                            {drawnNumbers.map((n: number) => String(n).padStart(2, '0')).join(' - ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal de Exibição do Bilhete/Comprovante */}
        {selectedReceiptUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl max-w-lg w-full p-4 overflow-hidden relative shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-sm text-gray-900">Comprovante Oficial da Aposta</h4>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptUrl(null)}
                  className="text-gray-400 hover:text-gray-700 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-gray-100 rounded-xl p-2">
                <img
                  src={selectedReceiptUrl}
                  alt="Comprovante de Jogo"
                  className="max-w-full h-auto rounded-lg shadow"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
