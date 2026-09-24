import { useState, useMemo } from 'react';
import { calculateGamePrize } from '../lib/prizes';
import { useToast } from './NotificationManager';
import PrizeSplitModal from './PrizeSplitModal';

interface GameHistoryProps {
  games: any[];
  savedResultsList?: any[];
  members?: any[];
  onClose?: () => void;
  onOpenNewGame?: () => void;
}

export const parseDateSafely = (dateVal: any): Date => {
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

export const extractContestNumber = (contestVal: any): number | null => {
  if (!contestVal) return null;
  if (typeof contestVal === 'number' && !isNaN(contestVal)) return contestVal;
  const match = String(contestVal).match(/\b(\d{3,5})\b/);
  return match ? Number(match[1]) : null;
};

export default function GameHistory({
  games,
  savedResultsList = [],
  members = [],
  onClose,
  onOpenNewGame
}: GameHistoryProps) {
  const { addToast } = useToast();

  const [searchContestQuery, setSearchContestQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');
  const [selectedPrizeFilter, setSelectedPrizeFilter] = useState<'all' | 'winning' | 'non_winning' | '15_hits' | '14_hits' | '13_hits'>('all');
  const [selectedNumbersFilter, setSelectedNumbersFilter] = useState<number[]>([]);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [splitModalData, setSplitModalData] = useState<{ totalPrize: number; contestName?: string } | null>(null);
  const [expandedContests, setExpandedContests] = useState<Record<string, boolean>>({});

  // Avaliação dos jogos e filtragem para ARQUIVAMENTO AUTOMÁTICO (apenas datas passadas)
  const processedGames = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return games.map(game => {
      const gDate = parseDateSafely(game.date);
      const gameDay = new Date(gDate);
      gameDay.setHours(0, 0, 0, 0);

      const dayTimestamp = gameDay.getTime();
      const isToday = dayTimestamp === today.getTime();
      const isFuture = dayTimestamp > today.getTime();
      const isPast = dayTimestamp < today.getTime();

      const contestNumber = extractContestNumber(game.contest);

      // Encontra o resultado oficial gravado no histórico para este concurso
      let targetResult: any = null;
      if (contestNumber) {
        targetResult = savedResultsList.find(r => Number(r.contest) === contestNumber);
      }

      const resDrawn = Array.isArray(targetResult?.numbers)
        ? targetResult.numbers.map((n: any) => Number(n))
        : [];

      const gameNumbers: number[] = Array.isArray(game.numbers)
        ? game.numbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b)
        : [];

      const isFutureContestTitle = String(game.contest || '').toLowerCase().includes('futuro');
      const isPendingFuture = isFuture || isFutureContestTitle || (contestNumber !== null && contestNumber >= 3788);

      const prizeInfo = (isPendingFuture || !targetResult)
        ? { hits: 0, prizeAmount: 0, isWinner: false, hitsText: 'Aguardando Sorteio', statusText: 'Aguardando Sorteio (Zerado)', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' }
        : calculateGamePrize(gameNumbers, resDrawn, game.customPrize, targetResult);

      const monthStr = game.month || `${String(gDate.getMonth() + 1).padStart(2, '0')}/${gDate.getFullYear()}`;
      const dateStr = gDate.toLocaleDateString('pt-BR');

      return {
        ...game,
        gDate,
        dayTimestamp,
        isToday,
        isFuture,
        isPast,
        // É arquivado se a data do sorteio já passou
        isArchived: isPast,
        contestNumber,
        gameNumbers,
        prizeInfo,
        targetResult,
        monthStr,
        dateStr
      };
    });
  }, [games, savedResultsList]);

  // Apenas os jogos arquivados (sorteio já realizado)
  const archivedGames = useMemo(() => {
    return processedGames.filter(g => g.isArchived);
  }, [processedGames]);

  // Lista de meses disponíveis no histórico
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    archivedGames.forEach(g => {
      if (g.monthStr) set.add(g.monthStr);
    });
    return Array.from(set).sort((a, b) => {
      const [mA, yA] = a.split('/').map(Number);
      const [mB, yB] = b.split('/').map(Number);
      if (yA !== yB) return yB - yA;
      return mB - mA;
    });
  }, [archivedGames]);

  // Filtros aplicados sobre o histórico
  const filteredArchivedGames = useMemo(() => {
    return archivedGames.filter(game => {
      // Filtro de Busca por Concurso ou Data
      if (searchContestQuery.trim()) {
        const query = searchContestQuery.trim().toLowerCase();
        const matchesContest = game.contestNumber && String(game.contestNumber).includes(query);
        const matchesLabel = game.contest && String(game.contest).toLowerCase().includes(query);
        const matchesDate = game.dateStr && game.dateStr.includes(query);
        if (!matchesContest && !matchesLabel && !matchesDate) return false;
      }

      // Filtro de Mês
      if (selectedMonthFilter !== 'all' && game.monthStr !== selectedMonthFilter) {
        return false;
      }

      // Filtro por Dezenas Selecionadas
      if (selectedNumbersFilter.length > 0) {
        const hasAllSelected = selectedNumbersFilter.every(num => game.gameNumbers.includes(num));
        if (!hasAllSelected) return false;
      }

      // Filtro de Premiação
      if (selectedPrizeFilter === 'winning' && !game.prizeInfo.isWinner) return false;
      if (selectedPrizeFilter === 'non_winning' && game.prizeInfo.isWinner) return false;
      if (selectedPrizeFilter === '15_hits' && game.prizeInfo.hits !== 15) return false;
      if (selectedPrizeFilter === '14_hits' && game.prizeInfo.hits !== 14) return false;
      if (selectedPrizeFilter === '13_hits' && game.prizeInfo.hits !== 13) return false;

      return true;
    });
  }, [archivedGames, searchContestQuery, selectedMonthFilter, selectedPrizeFilter, selectedNumbersFilter]);

  // Agrupamento dos Jogos Arquivados por Concurso
  interface GroupedArchivedContest {
    key: string;
    contestNumber: number | null;
    contestTitle: string;
    dateStr: string;
    dayTimestamp: number;
    monthStr: string;
    games: typeof filteredArchivedGames;
    totalCost: number;
    totalPrize: number;
    winningGamesCount: number;
    targetResult: any;
  }

  const groupedContests = useMemo(() => {
    const map = new Map<string, GroupedArchivedContest>();

    filteredArchivedGames.forEach(game => {
      const cNum = game.contestNumber;
      const key = cNum ? `contest_${cNum}` : `date_${game.dateStr}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          contestNumber: cNum,
          contestTitle: cNum ? `Concurso #${cNum}` : `Sorteio de ${game.dateStr}`,
          dateStr: game.dateStr,
          dayTimestamp: game.dayTimestamp,
          monthStr: game.monthStr,
          games: [],
          totalCost: 0,
          totalPrize: 0,
          winningGamesCount: 0,
          targetResult: game.targetResult
        });
      }

      const grp = map.get(key)!;
      grp.games.push(game);
      grp.totalCost += Number(game.cost) || 3.5;
      grp.totalPrize += Number(game.prizeInfo.prizeAmount) || 0;
      if (game.prizeInfo.isWinner) grp.winningGamesCount++;
    });

    const list = Array.from(map.values());
    // Ordena do concurso mais recente para o mais antigo
    list.sort((a, b) => {
      if (a.dayTimestamp !== b.dayTimestamp) return b.dayTimestamp - a.dayTimestamp;
      const numA = a.contestNumber || 0;
      const numB = b.contestNumber || 0;
      return numB - numA;
    });

    return list;
  }, [filteredArchivedGames]);

  // Estatísticas Gerais do Histórico Arquivado
  const statsSummary = useMemo(() => {
    const totalContests = groupedContests.length;
    const totalGamesCount = filteredArchivedGames.length;
    const totalPrizesAmount = filteredArchivedGames.reduce((sum, g) => sum + g.prizeInfo.prizeAmount, 0);
    const totalWinningGames = filteredArchivedGames.filter(g => g.prizeInfo.isWinner).length;
    const maxPrizeSingleContest = groupedContests.reduce((max, c) => Math.max(max, c.totalPrize), 0);

    return {
      totalContests,
      totalGamesCount,
      totalPrizesAmount,
      totalWinningGames,
      maxPrizeSingleContest
    };
  }, [groupedContests, filteredArchivedGames]);

  const toggleContestExpand = (key: string) => {
    setExpandedContests(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    groupedContests.forEach(c => { next[c.key] = true; });
    setExpandedContests(next);
  };

  const collapseAll = () => {
    setExpandedContests({});
  };

  const toggleNumberFilter = (num: number) => {
    if (selectedNumbersFilter.includes(num)) {
      setSelectedNumbersFilter(selectedNumbersFilter.filter(n => n !== num));
    } else {
      if (selectedNumbersFilter.length >= 15) {
        addToast('Você pode selecionar no máximo 15 dezenas para filtrar.', 'error');
        return;
      }
      setSelectedNumbersFilter([...selectedNumbersFilter, num].sort((a, b) => a - b));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
      
      {/* Modal de Comprovante de Aposta */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm">Bilhete do Histórico</h3>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="text-gray-500 hover:text-gray-800 font-bold p-1 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-gray-100 rounded-lg p-2">
              <img
                src={selectedReceiptUrl}
                alt="Comprovante arquivado"
                className="max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rateio Automático */}
      {splitModalData && (
        <PrizeSplitModal
          totalPrize={splitModalData.totalPrize}
          members={members}
          contestName={splitModalData.contestName}
          onClose={() => setSplitModalData(null)}
        />
      )}

      {/* Cabeçalho do Componente */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-gray-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
              🏛️ Arquivamento Automático
            </span>
            <span className="bg-white/20 text-purple-100 font-bold text-[10px] px-2 py-0.5 rounded-full">
              {archivedGames.length} Apostas Arquivadas
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
            <span>📜</span> Histórico & Arquivo de Concursos
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Os concursos são arquivados automaticamente nesta seção após a data do sorteio, mantendo a tela principal focada nas apostas vigentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              ✕ Fechar
            </button>
          )}
        </div>
      </div>

      {/* Cards com Resumo de Estatísticas do Histórico */}
      <div className="p-4 bg-purple-50/60 border-b border-purple-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Concursos Arquivados</span>
          <span className="text-base font-black text-purple-950">{statsSummary.totalContests}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Apostas no Histórico</span>
          <span className="text-base font-black text-indigo-900">{statsSummary.totalGamesCount}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Total em Prêmios Ganho</span>
          <span className="text-base font-black text-emerald-700">
            R$ {statsSummary.totalPrizesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Apostas Premiadas</span>
          <span className="text-base font-black text-amber-600">
            {statsSummary.totalWinningGames} {statsSummary.totalWinningGames === 1 ? 'jogo' : 'jogos'}
          </span>
        </div>
      </div>

      {/* Barra de Busca e Filtros Avançados */}
      <div className="p-4 bg-gray-50/80 border-b space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Campo de Busca Rápida por Concurso / Data */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔎</span>
            <input
              type="text"
              placeholder="Buscar por Concurso (ex: 3785) ou Data (ex: 20/09)..."
              value={searchContestQuery}
              onChange={(e) => setSearchContestQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-purple-600"
            />
            {searchContestQuery && (
              <button
                onClick={() => setSearchContestQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Mês */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-xs font-bold text-gray-600">Mês:</span>
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="text-xs font-bold text-purple-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">Todos os Meses</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Faixa de Premiação */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-bold text-gray-600">Status:</span>
            <select
              value={selectedPrizeFilter}
              onChange={(e: any) => setSelectedPrizeFilter(e.target.value)}
              className="text-xs font-bold text-purple-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Apostas</option>
              <option value="winning">🎉 Apenas Premiadas</option>
              <option value="non_winning">Apenas Sem Prêmio</option>
              <option value="15_hits">⭐ 15 Acertos</option>
              <option value="14_hits">🏆 14 Acertos</option>
              <option value="13_hits">🎯 13 Acertos</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={expandAll}
              className="px-2.5 py-2 bg-white hover:bg-gray-100 text-purple-900 border border-gray-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Expandir todos os concursos arquivados"
            >
              🔓 Expandir
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Recolher todos os concursos"
            >
              🔒 Recolher
            </button>
          </div>
        </div>

        {/* Mini Filtro Tático de Dezenas */}
        <div className="pt-2 border-t border-gray-200/70">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-black text-purple-900 uppercase tracking-wide flex items-center gap-1">
              <span>🎯</span> Filtrar Jogos do Histórico que Contenham Dezenas Específicas:
            </span>
            {selectedNumbersFilter.length > 0 && (
              <button
                onClick={() => setSelectedNumbersFilter([])}
                className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
              >
                Limpar Filtro ({selectedNumbersFilter.length} dezenas)
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
              const isSelected = selectedNumbersFilter.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => toggleNumberFilter(num)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md font-bold text-[11px] transition cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-purple-700 text-white font-black shadow-xs ring-2 ring-purple-400 scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
                  }`}
                >
                  {String(num).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Concursos Arquivados */}
      <div className="p-3 sm:p-4 space-y-4 bg-gray-50/50">
        {groupedContests.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-4xl block mb-2">📜</span>
            <h3 className="font-bold text-gray-800 text-base mb-1">Nenhum concurso arquivado encontrado.</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Os jogos dos concursos são movidos automaticamente para o histórico após a data do sorteio ter passado.
            </p>
            {(searchContestQuery || selectedMonthFilter !== 'all' || selectedPrizeFilter !== 'all' || selectedNumbersFilter.length > 0) && (
              <button
                onClick={() => {
                  setSearchContestQuery('');
                  setSelectedMonthFilter('all');
                  setSelectedPrizeFilter('all');
                  setSelectedNumbersFilter([]);
                }}
                className="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Limpar Todos os Filtros
              </button>
            )}
          </div>
        ) : (
          groupedContests.map(group => {
            const isExpanded = expandedContests[group.key] ?? false;

            return (
              <div
                key={group.key}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition"
              >
                {/* Header do Concurso Arquivado */}
                <div
                  onClick={() => toggleContestExpand(group.key)}
                  className="p-3.5 sm:px-4 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 bg-gray-100/90 hover:bg-gray-200/80 cursor-pointer select-none transition border-b border-gray-200"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="bg-gray-300 text-gray-800 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span>📁</span> Arquivado
                    </span>

                    <span className="font-black text-sm sm:text-base text-purple-950">
                      {group.contestTitle}
                    </span>

                    <span className="text-xs text-gray-600">
                      • Data: <strong>{group.dateStr}</strong>
                    </span>

                    <span className="text-xs bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded-md font-semibold">
                      {group.games.length} {group.games.length === 1 ? 'aposta' : 'apostas'}
                    </span>

                    {group.totalCost > 0 && (
                      <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                        Custo: R$ {group.totalCost.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    {group.totalPrize > 0 && (
                      <span className="bg-amber-400 text-gray-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                        <span>🎉</span> R$ {group.totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const text = encodeURIComponent(
                          `🍀 *HISTÓRICO DO BOLÃO - ${group.contestTitle}* 🍀\n\n` +
                          `📅 Data do Sorteio: ${group.dateStr}\n` +
                          `🎟️ Total de Apostas Arquivadas: ${group.games.length}\n` +
                          `💰 Custo Total: R$ ${group.totalCost.toFixed(2)}\n` +
                          `🏆 Prêmios Conquistados: R$ ${group.totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                          `⭐ Apostas Premiadas: ${group.winningGamesCount}\n\n` +
                          `📊 Veja o arquivo completo no app do Bolão!`
                        );
                        window.open(`https://wa.me/?text=${text}`, '_blank');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                      title="Enviar balanço deste concurso arquivado no WhatsApp"
                    >
                      <span>📲</span> WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleContestExpand(group.key);
                      }}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-200"
                    >
                      <span>{isExpanded ? '▲ Recolher' : `▼ Ver Apostas (${group.games.length})`}</span>
                    </button>
                  </div>
                </div>

                {/* Exibição dos Jogos Arquivados quando Expandido */}
                {isExpanded ? (
                  <div className="divide-y divide-gray-100 animate-fadeIn p-2 sm:p-3 space-y-3">
                    {group.targetResult && Array.isArray(group.targetResult.numbers) && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-purple-950">🎰 Resultado Oficial do Concurso:</span>
                          <div className="flex flex-wrap gap-1">
                            {group.targetResult.numbers.map((num: any) => (
                              <span key={num} className="w-6 h-6 rounded-full bg-purple-900 text-white font-black text-[10px] flex items-center justify-center">
                                {String(num).padStart(2, '0')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {group.games.map((game, gameIndex) => {
                      const hitsInfo = game.prizeInfo;
                      const drawnNumbers = Array.isArray(game.targetResult?.numbers) ? game.targetResult.numbers.map((n: any) => Number(n)) : [];

                      return (
                        <div
                          key={game.id || gameIndex}
                          className={`p-3.5 sm:p-4 transition rounded-xl ${
                            hitsInfo.isWinner
                              ? 'bg-gradient-to-r from-emerald-100 via-amber-50 to-teal-100 border-2 border-emerald-500 shadow-md'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-900 text-xs font-black flex items-center justify-center">
                                #{gameIndex + 1}
                              </span>
                              <span className="font-bold text-sm text-gray-800">
                                Aposta {gameIndex + 1}
                              </span>
                              {game.monthStr && (
                                <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 font-bold px-1.5 py-0.5 rounded">
                                  Mês: {game.monthStr}
                                </span>
                              )}
                              {game.cost && (
                                <span className="text-xs text-gray-500">
                                  • R$ {Number(game.cost).toFixed(2)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-3 py-1 rounded-md shadow-xs ${hitsInfo.badgeColor}`}>
                                {hitsInfo.statusText}
                              </span>

                              {hitsInfo.prizeAmount > 0 && (
                                <button
                                  onClick={() => setSplitModalData({
                                    totalPrize: hitsInfo.prizeAmount,
                                    contestName: `Jogo Arquivado #${gameIndex + 1} (${group.contestTitle})`
                                  })}
                                  className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-2.5 py-1 rounded shadow transition cursor-pointer flex items-center gap-1"
                                >
                                  <span>💰</span> Dividir Cota
                                </button>
                              )}

                              {game.receiptURL && (
                                <button
                                  onClick={() => setSelectedReceiptUrl(game.receiptURL)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                                >
                                  Ver Bilhete
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dezenas do Jogo Arquivado */}
                          <div className="flex flex-wrap gap-1.5 items-center mt-2">
                            {game.gameNumbers.map((num: number) => {
                              const isHit = drawnNumbers.includes(num);
                              return (
                                <span
                                  key={num}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs flex items-center justify-center transition shadow-xs ${
                                    isHit
                                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-black scale-105'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                                  }`}
                                >
                                  {String(num).padStart(2, '0')}
                                </span>
                              );
                            })}
                          </div>

                          {/* Detalhamento do Resultado */}
                          {drawnNumbers.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                              {hitsInfo.matchedNumbers && hitsInfo.matchedNumbers.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                                    <span>🎯</span> Acertos ({hitsInfo.matchedNumbers.length}):
                                  </span>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {hitsInfo.matchedNumbers.map((n: number) => (
                                      <span key={n} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300">
                                        {String(n).padStart(2, '0')}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500 font-medium">Nenhum acerto gravado para este concurso.</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    onClick={() => toggleContestExpand(group.key)}
                    className="px-4 py-2.5 bg-gray-50/70 hover:bg-gray-100 cursor-pointer flex items-center justify-between text-xs text-gray-600 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">🔒</span>
                      <span>{group.games.length} apostas arquivadas.</span>
                    </div>
                    <span className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1">
                      Ver Apostas ▼
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
