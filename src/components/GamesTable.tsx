import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, deleteDoc, doc, getDocs, addDoc, writeBatch } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { useResponsiveLayout } from '../lib/useResponsiveLayout';
import { calculateGamePrize, MEGASENA_STATS, LOTOFACIL_STATS } from '../lib/prizes';
import PrizeSplitModal from './PrizeSplitModal';
import ContestHistoryChecker from './ContestHistoryChecker';
import StatsThermometer from './StatsThermometer';
import LottoFlyerGenerator from './LottoFlyerGenerator';
import VolantesHistoryComparator from './VolantesHistoryComparator';
import GameHistory, { parseDateSafely } from './GameHistory';

interface GamesTableProps {
  onOpenNewGame?: () => void;
}

export default function GamesTable({ onOpenNewGame }: GamesTableProps) {
  const { addToast } = useToast();
  const { activePool, isQuotaExceeded, setIsQuotaExceeded } = usePool();
  const { isMobile } = useResponsiveLayout(640);

  const [games, setGames] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_games');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [latestResult, setLatestResult] = useState<any | null>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_latest_result');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cNum = Number(parsed?.contest);
        // Garante que o estado inicial nunca carregue concursos futuros (>= 3788) ou simulados
        if (cNum > 0 && cNum < 3788 && !parsed?.isSimulated) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });
  const [savedResultsList, setSavedResultsList] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_results');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter(r => {
            const cNum = Number(r?.contest);
            return cNum > 0 && cNum < 3788 && !r?.isSimulated;
          });
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<any | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [members, setMembers] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_members');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showVolantesComparator, setShowVolantesComparator] = useState(false);
  const [showThermometer, setShowThermometer] = useState(false);
  const [showPrizeTable, setShowPrizeTable] = useState(false);
  const [isUpdatingResult, setIsUpdatingResult] = useState(false);
  const [showManualResultModal, setShowManualResultModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [manualContest, setManualContest] = useState('');
  const [manualNumbers, setManualNumbers] = useState<number[]>([]);
  const [jumpContestInput, setJumpContestInput] = useState('');

  const isMegaSena = activePool?.lotteryType === 'megasena';
  const stats = isMegaSena ? MEGASENA_STATS : LOTOFACIL_STATS;
  const resultsCollection = isMegaSena ? 'megasena_results' : 'lotofacil_results';
  const resultsApi = isMegaSena ? '/api/megasena/results' : '/api/lotofacil/results';

  const handleManualResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualNumbers.length !== (isMegaSena ? 6 : 15)) {
      addToast(`Selecione exatamente ${isMegaSena ? 6 : 15} números para o concurso.`, 'error');
      return;
    }
    if (!manualContest) {
      addToast('Informe o número do concurso.', 'error');
      return;
    }
    
    setIsUpdatingResult(true);
    try {
      const formattedData = {
        contest: Number(manualContest) || 0,
        date: new Date().toLocaleDateString('pt-BR'),
        numbers: [...manualNumbers].sort((a, b) => a - b),
        accumulated: false,
        createdAt: new Date(),
        isManual: true
      };

      await addDoc(collection(db, resultsCollection), formattedData);
      setLatestResult(formattedData);
      addToast(`Resultado do Concurso ${manualContest} corrigido manualmente com sucesso!`, 'success');
      setShowManualResultModal(false);
      setManualNumbers([]);
      setManualContest('');
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao salvar correção manual.', 'error');
    } finally {
      setIsUpdatingResult(false);
    }
  };

  const toggleManualNumber = (n: number) => {
    if (manualNumbers.includes(n)) {
      setManualNumbers(manualNumbers.filter(num => num !== n));
    } else {
      if (manualNumbers.length >= (isMegaSena ? 6 : 15)) return;
      setManualNumbers([...manualNumbers, n]);
    }
  };

  // Filtro de mês de referência para gerenciar meses anteriores e atuais (mantendo mês vigente ativo por padrão)
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${yyyy}`;
  }, []);

  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(currentMonthStr);

  // Aba selecionada: 'active' (jogos do dia/futuros) ou 'history' (jogos de dias passados)
  const [gamesTab, setGamesTab] = useState<'active' | 'history'>('active');

  // Controle de grupos de concursos expandidos/retraídos
  // Ao iniciar o app, todas as informações do dia ficam abertas por padrão (mesmo sem dia atual cadastrado).
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isGroupExpanded = (groupKey: string, isToday: boolean, isFirstGroup?: boolean): boolean => {
    if (expandedGroups[groupKey] !== undefined) {
      return expandedGroups[groupKey];
    }
    // Ao iniciar o app, todas as informações do dia devem ficar abertas por padrão (mesmo sem dia atual cadastrado)
    if (gamesTab === 'active') {
      return true;
    }
    return isToday || !!isFirstGroup;
  };

  const toggleGroup = (groupKey: string, isToday: boolean, isFirstGroup?: boolean) => {
    const current = isGroupExpanded(groupKey, isToday, isFirstGroup);
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !current }));
  };

  const expandAllGroups = () => {
    const next: Record<string, boolean> = {};
    groupedGames.forEach(g => { next[g.key] = true; });
    setExpandedGroups(next);
  };

  const collapseAllNonToday = () => {
    const next: Record<string, boolean> = {};
    groupedGames.forEach((g, idx) => {
      // Mantém o sorteio do dia aberto (seja hoje ou o primeiro grupo da lista ativa)
      next[g.key] = !!g.isToday || (gamesTab === 'active' && idx === 0);
    });
    setExpandedGroups(next);
  };

  // Estado para o Modal de Rateio Automático
  const [splitModalData, setSplitModalData] = useState<{
    totalPrize: number;
    contestName?: string;
  } | null>(null);

  // Busca e navegação com busca prioritária na memória salva local/Firestore
  const handleNavigateContest = async (target: 'prev' | 'next' | number) => {
    if (isUpdatingResult) return;
    const currentNum = Number(latestResult?.contest || 0);
    let targetNum: number;

    if (target === 'prev') {
      targetNum = currentNum > 1 ? currentNum - 1 : currentNum;
    } else if (target === 'next') {
      targetNum = currentNum + 1;
    } else {
      targetNum = target;
    }

    if (!targetNum || targetNum <= 0) {
      addToast('Informe um número de concurso válido.', 'error');
      return;
    }

    if (targetNum === currentNum && currentNum > 0) {
      addToast(`Você já está no Concurso #${currentNum}.`, 'info');
      return;
    }

    // 1. Prioridade absoluta: Buscar na memória salva (Firestore / Cache de resultados)
    const foundInMemory = savedResultsList.find(r => Number(r.contest) === targetNum);
    if (foundInMemory) {
      setLatestResult(foundInMemory);
      return;
    }

    // 2. Se não estiver na memória salva, consulta a API e salva automaticamente no banco para as próximas consultas
    setIsUpdatingResult(true);
    try {
      const res = await fetch(resultsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest: String(targetNum) })
      });
      const data = await res.json();
      if (data.success && data.result) {
        const formatted = {
          contest: Number(data.result.contest) || targetNum,
          date: data.result.date || new Date().toLocaleDateString('pt-BR'),
          numbers: data.result.numbers,
          accumulated: !!data.result.accumulated,
          createdAt: new Date(),
          isManual: false
        };

        const limitContest = isMegaSena ? 2780 : 3788;
        const isOfficialDraw = formatted.contest > 0 && 
                              formatted.contest < limitContest && 
                              Array.isArray(formatted.numbers) && 
                              formatted.numbers.length === (isMegaSena ? 6 : 15);

        if (isOfficialDraw) {
          await addDoc(collection(db, resultsCollection), formatted);
        }
        setLatestResult(formatted);
      } else {
        const errorMsg = data.message || `Concurso #${targetNum} não encontrado.`;
        addToast(`Aviso: ${errorMsg}`, 'info');
      }
    } catch (err: any) {
      console.error("Erro ao buscar concurso:", err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast(`Erro ao carregar Concurso #${targetNum}.`, 'error');
    } finally {
      setIsUpdatingResult(false);
    }
  };

  const handleFetchLatestCaixa = async () => {
    if (isUpdatingResult) return;
    setIsUpdatingResult(true);
    try {
      const res = await fetch(resultsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest: 'latest' })
      });
      const data = await res.json();
      if (data.success && data.result) {
        const formatted = {
          contest: Number(data.result.contest) || 0,
          date: data.result.date || new Date().toLocaleDateString('pt-BR'),
          numbers: data.result.numbers,
          accumulated: !!data.result.accumulated,
          createdAt: new Date(),
          isManual: false
        };
        // Salva na memória caso ainda não exista e seja um sorteio oficial já realizado
        const limitContest = isMegaSena ? 2780 : 3788;
        const isOfficialDraw = formatted.contest > 0 && 
                              formatted.contest < limitContest && 
                              Array.isArray(formatted.numbers) && 
                              formatted.numbers.length === (isMegaSena ? 6 : 15);

        const alreadyExists = savedResultsList.some(r => Number(r.contest) === formatted.contest);
        if (!alreadyExists && isOfficialDraw) {
          await addDoc(collection(db, resultsCollection), formatted);
        }
        setLatestResult(formatted);
      } else {
        const errorMsg = data.message || 'Não foi possível obter o resultado oficial da Caixa.';
        addToast(errorMsg, 'error');
        if (errorMsg.includes('antigo') || errorMsg.includes('limite')) {
          setShowManualResultModal(true);
        }
      }
    } catch (err: any) {
      console.error("Erro ao buscar resultado da Caixa:", err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast(`Erro ao atualizar resultado: ${err.message || 'Tente novamente.'}`, 'error');
    } finally {
      setIsUpdatingResult(false);
    }
  };

  useEffect(() => {
    if (!activePool) return;

    // Escuta os jogos cadastrados com suporte a bolão ativo e retrocompatibilidade
    // Adicionando um limite para evitar ler milhares de jogos antigos desnecessariamente
    const qGames = query(collection(db, 'games'), orderBy('date', 'desc'), limit(500));
    const unsubGames = onSnapshot(qGames, snapshot => {
      const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const list = allDocs.filter((g: any) => {
        if (!activePool) return true;
        if (g.poolId === activePool.id) return true;
        // Suporte retroativo para jogos cadastrados sem poolId ou com ID padrão
        const isPrincipalPool = activePool.id === 'default_lotofacil_pool' || 
          activePool.name?.toLowerCase().includes('principal') || 
          activePool.name?.toLowerCase().includes('lotofácil');
        if (!g.poolId && isPrincipalPool) return true;
        if (g.poolId === 'default_lotofacil_pool' && isPrincipalPool) return true;
        return false;
      });

      list.sort((a: any, b: any) => {
        const dateA = a.date && typeof a.date.toDate === 'function' ? a.date.toDate().getTime() : 0;
        const dateB = b.date && typeof b.date.toDate === 'function' ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      });
      setGames(list);
      try {
        localStorage.setItem('bolao_cache_games', JSON.stringify(list));
      } catch (cacheErr) {
        console.warn('Failed to save games to localStorage cache:', cacheErr);
      }
    }, err => {
      console.warn('Games snapshot error, loading cache:', err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
      }
      const cached = localStorage.getItem('bolao_cache_games');
      if (cached) {
        setGames(JSON.parse(cached));
      }
    });

    // Função para limpar qualquer resultado futuro simulado que possa ter ficado gravado no Firestore
    const cleanFutureResults = async () => {
      // Evita rodar múltiplas vezes na mesma sessão para economizar cota de escrita
      if (sessionStorage.getItem('bolao_cleanup_done')) return;

      try {
        const limitContest = isMegaSena ? 2780 : 3788;
        const qFuture = query(
          collection(db, resultsCollection),
          where('contest', '>=', limitContest)
        );
        const snap = await getDocs(qFuture);
        
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach((d) => {
            batch.delete(d.ref);
            console.log(`[Database Cleanup] Agendado para deletar concurso futuro simulado: #${d.data().contest}`);
          });
          await batch.commit();
        }
        sessionStorage.setItem('bolao_cleanup_done', 'true');
      } catch (err: any) {
        console.warn('Erro ao limpar resultados futuros do banco:', err);
        if (isQuotaError(err)) {
          setIsQuotaExceeded(true);
        }
      }
    };
    cleanFutureResults();

    // Escuta todo o histórico de resultados salvos na memória local do Firestore
    const qAllResults = query(collection(db, resultsCollection), orderBy('createdAt', 'desc'), limit(150));
    const unsubResults = onSnapshot(qAllResults, snapshot => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Deduplica por concurso e ordena do maior para o menor
        const uniqueMap = new Map<number, any>();
        list.forEach((item: any) => {
          const cNum = Number(item.contest);
          if (cNum && !uniqueMap.has(cNum)) {
            uniqueMap.set(cNum, item);
          }
        });
        const sorted = Array.from(uniqueMap.values()).sort((a, b) => Number(b.contest) - Number(a.contest));
        setSavedResultsList(sorted);
        try {
          localStorage.setItem('bolao_cache_results', JSON.stringify(sorted));
        } catch (cacheErr) {
          console.warn('Failed to save results to localStorage cache:', cacheErr);
        }

        // Atualiza para o concurso vigente mais recente (deve ser menor que o limite de concurso futuro: 3788 para Lotofácil / 2780 para MegaSena)
        const limitContest = isMegaSena ? 2780 : 3788;
        const officialSorted = sorted.filter((r: any) => Number(r.contest) < limitContest);
        const defaultLatest = officialSorted.length > 0 ? officialSorted[0] : sorted[0];

        setLatestResult((prev: any) => {
          const nextLatest = prev && sorted.some((r: any) => Number(r.contest) === Number(prev.contest)) ? prev : defaultLatest;
          if (nextLatest) {
            try {
              localStorage.setItem('bolao_cache_latest_result', JSON.stringify(nextLatest));
            } catch (cacheErr) {
              console.warn('Failed to save latestResult to cache:', cacheErr);
            }
          }
          return nextLatest;
        });
      }
    }, err => {
      console.warn('Results snapshot error, loading cache:', err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
      }
      const cached = localStorage.getItem('bolao_cache_results');
      if (cached) {
        try {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) {
            setSavedResultsList(list.filter((r: any) => Number(r.contest) < (isMegaSena ? 2780 : 3788) && !r.isSimulated));
          }
        } catch {}
      }
      const cachedLatest = localStorage.getItem('bolao_cache_latest_result');
      if (cachedLatest) {
        try {
          const parsed = JSON.parse(cachedLatest);
          const cNum = Number(parsed?.contest);
          if (cNum > 0 && cNum < (isMegaSena ? 2780 : 3788) && !parsed?.isSimulated) {
            setLatestResult(parsed);
          }
        } catch {}
      }
    });

    // Carrega membros para cálculo de cotas
    const loadMembers = async () => {
      try {
        const [usersSnap, membersSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);
        const list: any[] = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        membersSnap.docs.forEach(d => {
          const data = d.data();
          if (!list.some(u => u.id === d.id || (data.email && u.email === data.email))) {
            list.push({ id: d.id, ...data });
          }
        });
        setMembers(list);
        try {
          localStorage.setItem('bolao_cache_members', JSON.stringify(list));
        } catch (cacheErr) {
          console.warn('Failed to save members to localStorage cache:', cacheErr);
        }
      } catch (e: any) {
        console.warn('Erro ao buscar membros para rateio, carregando cache:', e);
        if (e && (e.message?.includes('Quota exceeded') || e.message?.includes('quota') || e.code === 'resource-exhausted')) {
          setIsQuotaExceeded(true);
        }
        const cached = localStorage.getItem('bolao_cache_members');
        if (cached) {
          setMembers(JSON.parse(cached));
        }
      }
    };
    loadMembers();

    return () => {
      unsubGames();
      unsubResults();
    };
  }, [activePool]);

  const drawnNumbers: number[] = Array.isArray(latestResult?.numbers)
    ? latestResult.numbers.map((n: any) => Number(n))
    : [];

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteDoc(doc(db, 'games', gameId));
      addToast('Aposta removida com sucesso.', 'info');
      setDeletingId(null);
    } catch (err) {
      console.error('Erro ao deletar jogo:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao remover aposta.', 'error');
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!groupToDelete || !groupToDelete.games || groupToDelete.games.length === 0) {
      setGroupToDelete(null);
      return;
    }

    setIsDeletingGroup(true);
    try {
      const deletePromises = groupToDelete.games.map((g: any) =>
        deleteDoc(doc(db, 'games', g.id))
      );
      await Promise.all(deletePromises);

      addToast(`Todas as ${groupToDelete.games.length} apostas do ${groupToDelete.contestTitle} foram excluídas com sucesso.`, 'success');
      setGroupToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir grupo de apostas:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao excluir apostas do concurso.', 'error');
    } finally {
      setIsDeletingGroup(false);
    }
  };
  
  const handleDeleteAllArchived = async () => {
    try {
      const archivedGames = games.filter(g => !isGameActiveOrToday(g));
      if (archivedGames.length === 0) return;

      const batch = writeBatch(db);
      archivedGames.forEach(g => {
        batch.delete(doc(db, 'games', g.id));
      });
      await batch.commit();
      addToast(`${archivedGames.length} apostas arquivadas foram removidas com sucesso.`, 'success');
    } catch (err) {
      console.error('Erro ao excluir histórico de apostas:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao limpar histórico de apostas.', 'error');
    }
  };

  const extractContestNumber = (contestVal: any): number | null => {
    if (!contestVal) return null;
    if (typeof contestVal === 'number' && !isNaN(contestVal)) return contestVal;
    const match = String(contestVal).match(/\b(\d{3,5})\b/);
    return match ? Number(match[1]) : null;
  };

  // Determina se a aposta é ativa (sorteio hoje ou em data futura)
  const getGameDateInfo = (game: any) => {
    let gDate: Date | null = null;
    if (game?.date) {
      gDate = parseDateSafely(game.date);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!gDate || isNaN(gDate.getTime())) {
      return { 
        gDate: null, 
        dayTimestamp: today.getTime(),
        isToday: true, 
        isTomorrow: false,
        isFuture: false, 
        isPast: false, 
        isActive: true, 
        dateStr: 'Data não informada' 
      };
    }

    const gameDay = new Date(gDate);
    gameDay.setHours(0, 0, 0, 0);

    const dayTimestamp = gameDay.getTime();
    const isToday = dayTimestamp === today.getTime();
    const isTomorrow = dayTimestamp === tomorrow.getTime();
    const isFuture = dayTimestamp > today.getTime();
    const isPast = dayTimestamp < today.getTime();
    // Arquivamento automático: jogos cuja data de sorteio já passou (isPast) vão automaticamente para o Histórico!
    const isActive = isToday || isFuture;
    const dateStr = gDate.toLocaleDateString('pt-BR');

    return { gDate, dayTimestamp, isToday, isTomorrow, isFuture, isPast, isActive, dateStr };
  };

  const isGameActiveOrToday = (game: any): boolean => {
    return getGameDateInfo(game).isActive;
  };

  const uniqueGames = useMemo(() => {
    const seen = new Set<string>();
    return games.filter(g => {
      const cNum = extractContestNumber(g.contest);
      const dateInfo = getGameDateInfo(g);
      const numbersKey = Array.isArray(g.numbers)
        ? g.numbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b).join('-')
        : '';
      const sig = `${g.poolId || ''}::${cNum || dateInfo.dateStr}::${numbersKey}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }, [games]);

  const gamesWithPrizes = uniqueGames.map(game => {
    const gameNumbers: number[] = Array.isArray(game.numbers)
      ? game.numbers.map((n: any) => Number(n))
      : [];
    const dateInfo = getGameDateInfo(game);
    const contestNumber = extractContestNumber(game.contest);

    let targetResult = latestResult;
    if (contestNumber) {
      const found = savedResultsList.find(r => Number(r.contest) === contestNumber);
      if (found) targetResult = found;
    }

    const resDrawn = Array.isArray(targetResult?.numbers)
      ? targetResult.numbers.map((n: any) => Number(n))
      : drawnNumbers;

    // Só considera pendente futuro se o concurso ainda não ocorreu e não há resultado gravado
    const isFutureContestTitle = String(game.contest || '').toLowerCase().includes('futuro');
    const isPendingFuture = (!targetResult || !targetResult.numbers || targetResult.numbers.length === 0) && (
      dateInfo.isFuture || 
      isFutureContestTitle || 
      (contestNumber !== null && (contestNumber >= 3788 || (latestResult?.contest && contestNumber > Number(latestResult.contest))))
    );

    const prizeInfo = isPendingFuture
      ? { hits: 0, prizeAmount: 0, isWinner: false, hitsText: 'Aguardando Sorteio', statusText: 'Aguardando Sorteio (Zerado)', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' }
      : calculateGamePrize(gameNumbers, resDrawn, game.customPrize, targetResult);

    return { ...game, gameNumbers, prizeInfo, contestNumber, isPendingFuture, ...dateInfo };
  });

  // Se houver jogos de hoje ou futuros, eles são os ativos.
  // Caso não haja jogos na data de hoje ou futuros ("sem dia atual" cadastrado),
  // traz automaticamente os jogos do concurso/dia mais recente para ficarem expostos como os "Jogos do Dia"!
  const rawActiveGames = useMemo(() => {
    return gamesWithPrizes.filter(g => g.isActive);
  }, [gamesWithPrizes]);

  const activeGames = useMemo(() => {
    if (rawActiveGames.length > 0) return rawActiveGames;
    if (gamesWithPrizes.length === 0) return [];
    
    // Encontra o concurso ou dia mais recente presente na lista de jogos
    const sorted = [...gamesWithPrizes].sort((a, b) => {
      if (a.dayTimestamp !== b.dayTimestamp) return b.dayTimestamp - a.dayTimestamp;
      return (b.contestNumber || 0) - (a.contestNumber || 0);
    });
    
    const latestTimestamp = sorted[0]?.dayTimestamp;
    const latestContestNum = sorted[0]?.contestNumber;
    
    return sorted.filter(g => 
      (latestContestNum && g.contestNumber === latestContestNum) || 
      (g.dayTimestamp === latestTimestamp)
    );
  }, [rawActiveGames, gamesWithPrizes]);

  const activeGameIds = useMemo(() => new Set(activeGames.map(g => g.id)), [activeGames]);
  const historyGames = useMemo(() => {
    return gamesWithPrizes.filter(g => !activeGameIds.has(g.id));
  }, [gamesWithPrizes, activeGameIds]);

  // Ao iniciar o app, todas as informações devem ser do dia: sincroniza automaticamente o resultado com o concurso ativo (mesmo sem dia atual cadastrado)
  const initialSyncDoneRef = useRef(false);
  useEffect(() => {
    if (!initialSyncDoneRef.current && activeGames.length > 0 && savedResultsList.length > 0) {
      const activeContestNum = activeGames[0]?.contestNumber;
      if (activeContestNum) {
        const matchingResult = savedResultsList.find(r => Number(r.contest) === activeContestNum);
        if (matchingResult) {
          setLatestResult(matchingResult);
          initialSyncDoneRef.current = true;
        }
      }
    }
  }, [activeGames, savedResultsList]);

  // Lista de jogos da aba selecionada
  const currentTabGames = gamesTab === 'active' ? activeGames : historyGames;

  // Lista de meses disponíveis para filtro na aba atual (incluindo o mês vigente)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonthStr);
    currentTabGames.forEach(g => {
      if (g.month) monthSet.add(g.month);
    });
    return Array.from(monthSet).sort((a, b) => {
      const [mA, yA] = a.split('/').map(Number);
      const [mB, yB] = b.split('/').map(Number);
      if (yA !== yB) return yB - yA;
      return mB - mA;
    });
  }, [currentTabGames, currentMonthStr]);

  // Se o mês vigente não possuir apostas cadastradas, ajusta automaticamente o filtro para 'all' para exibir os jogos
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonthFilter !== 'all') {
      const hasInSelected = currentTabGames.some(g => g.month === selectedMonthFilter);
      if (!hasInSelected) {
        setSelectedMonthFilter('all');
      }
    }
  }, [availableMonths, currentTabGames, selectedMonthFilter]);

  // Jogos filtrados pelo mês selecionado
  const filteredGames = selectedMonthFilter === 'all'
    ? currentTabGames
    : currentTabGames.filter(g => g.month === selectedMonthFilter);

  // AGRUPAMENTO DOS JOGOS POR CONCURSO / DATA EM ORDEM DE DIAS
  interface ContestGroup {
    key: string;
    contestNumber: number | null;
    contestTitle: string;
    dateStr: string;
    dayTimestamp: number;
    isToday: boolean;
    isTomorrow: boolean;
    isFuture: boolean;
    isPast: boolean;
    games: typeof filteredGames;
    totalCost: number;
    totalPrize: number;
    winningGamesCount: number;
  }

  const groupedGames = useMemo(() => {
    const map = new Map<string, ContestGroup>();

    filteredGames.forEach(game => {
      const cNum = game.contestNumber;
      const key = cNum ? `contest_${cNum}` : `date_${game.dateStr}`;
      
      if (!map.has(key)) {
        map.set(key, {
          key,
          contestNumber: cNum,
          contestTitle: cNum ? `Concurso #${cNum}` : `Sorteio de ${game.dateStr}`,
          dateStr: game.dateStr,
          dayTimestamp: game.dayTimestamp,
          isToday: !!game.isToday,
          isTomorrow: !!game.isTomorrow,
          isFuture: !!game.isFuture,
          isPast: !!game.isPast,
          games: [],
          totalCost: 0,
          totalPrize: 0,
          winningGamesCount: 0
        });
      }

      const group = map.get(key)!;
      group.games.push(game);
      group.totalCost += Number(game.cost) || 3.5;
      group.totalPrize += Number(game.prizeInfo.prizeAmount) || 0;
      if (game.prizeInfo.isWinner) {
        group.winningGamesCount++;
      }
      if (game.isToday) group.isToday = true;
      if (game.isTomorrow) group.isTomorrow = true;
    });

    const list = Array.from(map.values());

    // Ordenação dos grupos RIGOROSA POR DIAS
    if (gamesTab === 'active') {
      // Ativos: Ordena cronologicamente do dia mais próximo para os dias seguintes (Hoje 24 -> Amanhã 25 -> 26 -> 28 ...)
      list.sort((a, b) => {
        if (a.dayTimestamp !== b.dayTimestamp) {
          return a.dayTimestamp - b.dayTimestamp;
        }
        const numA = a.contestNumber || 0;
        const numB = b.contestNumber || 0;
        return numA - numB;
      });
    } else {
      // Histórico: Concursos e dias passados mais recentes primeiro
      list.sort((a, b) => {
        if (a.dayTimestamp !== b.dayTimestamp) {
          return b.dayTimestamp - a.dayTimestamp;
        }
        const numA = a.contestNumber || 0;
        const numB = b.contestNumber || 0;
        return numB - numA;
      });
    }

    return list;
  }, [filteredGames, gamesTab]);

  const totalBolaoPrize = filteredGames.reduce((sum, g) => sum + g.prizeInfo.prizeAmount, 0);
  const winningGamesCount = filteredGames.filter(g => g.prizeInfo.isWinner).length;

  // Estatísticas de faixas de acertos do bolão no concurso atual
  const bolaoTierStats = useMemo(() => {
    if (!drawnNumbers || drawnNumbers.length === 0) return null;
    const tiers: Record<number, { count: number; prizeUnit: number; total: number }> = {
      15: { count: 0, prizeUnit: latestResult?.prize15Amount || 1500000, total: 0 },
      14: { count: 0, prizeUnit: latestResult?.prize14Amount || 1500, total: 0 },
      13: { count: 0, prizeUnit: 35.00, total: 0 },
      12: { count: 0, prizeUnit: 14.00, total: 0 },
      11: { count: 0, prizeUnit: 7.00, total: 0 },
    };

    filteredGames.forEach(g => {
      if (!g.isPendingFuture && g.prizeInfo) {
        const hits = g.prizeInfo.hits;
        if (tiers[hits]) {
          tiers[hits].count++;
          tiers[hits].total += g.prizeInfo.prizeAmount;
        }
      }
    });

    return tiers;
  }, [filteredGames, drawnNumbers, latestResult]);

  const totalPaidQuotasCount = members
    .filter(m => m.paymentStatus === 'Pago')
    .reduce((sum, m) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);
  const prizePerCota = totalPaidQuotasCount > 0 ? totalBolaoPrize / totalPaidQuotasCount : 0;

  return (
    <div className="space-y-4">
      {/* Modal de Auditoria e Comparação Automática com Histórico */}
      {showVolantesComparator && (
        <VolantesHistoryComparator
          games={games}
          members={members}
          onClose={() => setShowVolantesComparator(false)}
          onOpenPrizeSplit={(totalPrize, contestName) => {
            setShowVolantesComparator(false);
            setSplitModalData({ totalPrize, contestName });
          }}
        />
      )}

      {/* Modal de Consulta e Histórico de Concursos */}
      {showHistoryModal && (
        <ContestHistoryChecker
          games={games}
          onClose={() => setShowHistoryModal(false)}
          onOpenVolantesComparator={() => setShowVolantesComparator(true)}
          onApplyResultAsCurrent={(result) => {
            setLatestResult(result);
            addToast(`Concurso ${result.contest} aplicado na tela de conferência!`, 'success');
          }}
        />
      )}

      {/* Modal de Rateio Automático das Cotas */}
      {splitModalData && (
        <PrizeSplitModal
          totalPrize={splitModalData.totalPrize}
          members={members}
          contestName={splitModalData.contestName}
          onClose={() => setSplitModalData(null)}
        />
      )}

      {/* Modal de Comprovante de Aposta */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm">Bilhete Oficial da Aposta</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-800 font-bold p-1 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-gray-100 rounded-lg p-2">
              <img
                src={selectedReceipt}
                alt="Comprovante da aposta"
                className="max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-xs w-full">
            <h3 className="font-bold text-gray-800 text-sm mb-2">Excluir Jogo</h3>
            <p className="text-gray-600 text-xs mb-4">Tem certeza que deseja excluir esta aposta do bolão?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 rounded text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteGame(deletingId)}
                className="px-3 py-1.5 rounded text-xs text-white bg-red-600 hover:bg-red-700 font-semibold cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão de Todos os Jogos do Concurso */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70] backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-red-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 font-black text-2xl flex items-center justify-center mx-auto shadow-xs">
              🗑️
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                Excluir todas as apostas?
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Você está prestes a excluir todos os <strong className="text-red-600 font-black">{groupToDelete.games.length} jogo(s)</strong> do <strong className="text-gray-900 font-black">{groupToDelete.contestTitle}</strong> ({groupToDelete.dateStr}).
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-left">
              <p className="text-[11px] text-red-900 font-semibold leading-relaxed">
                ⚠️ <strong>Atenção:</strong> Essa ação removerá permanentemente todos esses jogos do bolão e não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                disabled={isDeletingGroup}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGroup}
                disabled={isDeletingGroup}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isDeletingGroup ? 'Excluindo...' : `Excluir ${groupToDelete.games.length} Jogo(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. ORDEM PRIMÁRIA: Tabela / Lista de Apostas do Bolão com Abas (Do Dia / Ativos vs Histórico) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        {/* Abas: Jogos do Sorteio Atual vs Histórico */}
        <div className="flex border-b border-gray-200 bg-gray-100/80 p-1 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setGamesTab('active')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer font-bold ${
              gamesTab === 'active'
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <span>🎯</span>
            <span>Apostas do Dia ({activeGames.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setGamesTab('history')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer font-bold ${
              gamesTab === 'history'
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <span>📜</span>
            <span>Histórico de Jogos Arquivados ({historyGames.length})</span>
          </button>
        </div>

        {gamesTab === 'history' ? (
          <GameHistory
            games={games}
            savedResultsList={savedResultsList}
            members={members}
            onOpenNewGame={onOpenNewGame}
            onDeleteGame={handleDeleteGame}
            onDeleteAllArchived={handleDeleteAllArchived}
          />
        ) : (
          <>

            <div className="p-3 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Apostas do Dia ({filteredGames.length})
                </span>

                {availableMonths.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-300 rounded-xl px-2.5 py-1 shadow-2xs">
                    <span className="text-xs font-bold text-purple-900">Mês:</span>
                    <select
                      value={selectedMonthFilter}
                      onChange={(e) => setSelectedMonthFilter(e.target.value)}
                      className="text-xs font-bold text-purple-900 bg-transparent focus:outline-none cursor-pointer"
                    >
                      {availableMonths.map(m => (
                        <option key={m} value={m}>
                          {m === currentMonthStr ? `${m} (Mês Vigente)` : m}
                        </option>
                      ))}
                      <option value="all">Todos os Meses</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                {onOpenNewGame && (
                  <button
                    onClick={onOpenNewGame}
                    className="text-xs font-black text-white bg-purple-700 hover:bg-purple-800 border border-purple-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-95"
                    title="Adicionar uma nova aposta de forma manual ou lendo foto do bilhete"
                  >
                    <span>➕</span> Adicionar Aposta
                  </button>
                )}
                <button
                  onClick={collapseAllNonToday}
                  className="text-xs font-bold text-gray-700 hover:text-gray-950 bg-white hover:bg-gray-100 border border-gray-300 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                  title="Manter expostas apenas as apostas do dia, recolhendo os demais concursos"
                >
                  <span>🔒</span> Apenas o do Dia Aberto
                </button>
                <button
                  onClick={expandAllGroups}
                  className="text-xs font-bold text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                  title="Expandir todos os concursos e ver todas as apostas"
                >
                  <span>🔓</span> Expandir Todos
                </button>
                <button
                  onClick={() => setShowVolantesComparator(true)}
                  className="text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95"
                  title="Varrer e auditar todas as apostas do bolão contra os concursos oficiais da Caixa"
                >
                  <span>⚡</span> Varrer Apostas
                </button>
                <button
                  onClick={() => setShowVolantesComparator(true)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                  title="Comparar automaticamente os volantes com o concurso correto no histórico da Lotofácil"
                >
                  <span>🎯</span> Auditor
                </button>
                <button
                  onClick={() => setShowFlyerModal(true)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                  title="Gerar PDF para imprimir volantes oficiais"
                >
                  <span>🖨️</span> Imprimir Volantes
                </button>
              </div>
            </div>

        {groupedGames.length === 0 ? (
          <div className="p-8 text-center">
            {gamesTab === 'active' ? (
              <div>
                <span className="text-3xl block mb-2">🎟️</span>
                <p className="text-gray-700 text-sm font-semibold mb-1">
                  Nenhuma aposta cadastrada para o sorteio de hoje/futuro {selectedMonthFilter !== 'all' ? `no mês ${selectedMonthFilter}` : ''}.
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  Jogos anteriores ficam no Histórico.
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {onOpenNewGame && (
                    <button
                      onClick={onOpenNewGame}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span>➕</span> Adicionar Aposta
                    </button>
                  )}
                  {selectedMonthFilter !== 'all' && currentTabGames.length > 0 && (
                    <button
                      onClick={() => setSelectedMonthFilter('all')}
                      className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-xl border border-purple-300 transition cursor-pointer active:scale-95"
                    >
                      Ver Todos os Meses ({currentTabGames.length})
                    </button>
                  )}
                  {historyGames.length > 0 && (
                    <button
                      onClick={() => setGamesTab('history')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-300 transition cursor-pointer active:scale-95"
                    >
                      Ver Histórico ({historyGames.length})
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl block mb-2">📜</span>
                <p className="text-gray-500 text-sm mb-3">Nenhum jogo arquivado no histórico para os filtros selecionados.</p>
                {selectedMonthFilter !== 'all' && historyGames.length > 0 && (
                  <button
                    onClick={() => setSelectedMonthFilter('all')}
                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-xl border border-purple-300 transition cursor-pointer active:scale-95"
                  >
                    Ver Histórico de Todos os Meses ({historyGames.length})
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-4 bg-gray-50/50">
            {groupedGames.map((group: any, idx: number) => {
              const isGroupOfCurrentResult = latestResult?.contest && Number(latestResult.contest) === group.contestNumber;
              const isFirstGroup = idx === 0;
              const isDayGroup = group.isToday || (gamesTab === 'active' && !group.isFuture);
              const isExpanded = isGroupExpanded(group.key, !!group.isToday, isFirstGroup);

              return (
                <div 
                  key={group.key} 
                  className={`bg-white rounded-xl border shadow-xs overflow-hidden transition ${
                    isDayGroup 
                      ? 'border-emerald-400 ring-2 ring-emerald-400/20' 
                      : group.isFuture 
                        ? 'border-blue-300' 
                        : 'border-gray-200'
                  }`}
                >
                  {/* Cabeçalho do Grupo do Concurso - Clicável em qualquer lugar para expandir/recolher */}
                  <div 
                    onClick={() => toggleGroup(group.key, !!group.isToday, isFirstGroup)}
                    className={`p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 border-b cursor-pointer select-none transition ${
                      isDayGroup 
                        ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white border-emerald-700/50 hover:brightness-110' 
                        : group.isFuture 
                          ? 'bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white border-blue-700/50 hover:brightness-110' 
                          : 'bg-gray-100/90 text-gray-800 border-gray-200 hover:bg-gray-200/80'
                    }`}
                    title={isExpanded ? "Clique para recolher este concurso" : "Clique para expandir as apostas deste concurso"}
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isDayGroup ? (
                        <span className="bg-emerald-500 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                          Sorteio do Dia ({group.dateStr})
                        </span>
                      ) : group.isTomorrow ? (
                        <span className="bg-amber-500 text-gray-950 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <span>⏳</span> Próximo Sorteio ({group.dateStr})
                        </span>
                      ) : group.isFuture ? (
                        <span className="bg-blue-500 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <span>📅</span> Sorteio Futuro ({group.dateStr})
                        </span>
                      ) : (
                        <span className="bg-gray-300 text-gray-800 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>📁</span> Histórico ({group.dateStr})
                        </span>
                      )}

                      <span className={`font-black text-sm sm:text-base ${isDayGroup || group.isFuture ? 'text-amber-300' : 'text-purple-950'}`}>
                        {group.contestTitle}
                      </span>

                      <span className={`text-xs ${isDayGroup || group.isFuture ? 'text-gray-200' : 'text-gray-600'}`}>
                        • Data: <strong>{group.dateStr}</strong>
                      </span>

                      <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                        isDayGroup || group.isFuture 
                          ? 'bg-white/15 text-white' 
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}>
                        {group.games.length} {group.games.length === 1 ? 'aposta' : 'apostas'}
                      </span>

                      {group.totalCost > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                          isDayGroup || group.isFuture 
                            ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
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

                      {!isDayGroup && !group.isFuture && group.contestNumber && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateContest(group.contestNumber!);
                          }}
                          disabled={isUpdatingResult}
                          className={`text-xs font-black px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-40 shadow-xs ${
                            isGroupOfCurrentResult
                              ? 'bg-amber-400 text-gray-950 ring-2 ring-amber-300'
                              : 'bg-purple-900 hover:bg-purple-800 text-white'
                          }`}
                          title={`Conferir resultados do Concurso #${group.contestNumber}`}
                        >
                          <span>{isGroupOfCurrentResult ? '✓ Conferindo este' : '🎯 Conferir Concurso'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const text = encodeURIComponent(
                            `🍀 *BALANÇO DO BOLÃO - ${group.contestTitle}* 🍀\n\n` +
                            `📅 Data: ${group.dateStr}\n` +
                            `🎟️ Total de Apostas: ${group.games.length}\n` +
                            `💰 Custo Total: R$ ${group.totalCost.toFixed(2)}\n` +
                            `🏆 Prêmios Ganhos: R$ ${group.totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                            `⭐ Apostas Premiadas: ${group.winningGamesCount}\n\n` +
                            `📊 Confira o balanço completo no aplicativo do Bolão!`
                          );
                          window.open(`https://wa.me/?text=${text}`, '_blank');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                        title="Enviar balanço deste concurso no WhatsApp"
                      >
                        <span>📲</span> WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupToDelete(group);
                        }}
                        className={`text-xs font-black px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs border ${
                          isDayGroup || group.isFuture
                            ? 'bg-red-600 hover:bg-red-500 text-white border-red-400/50'
                            : 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300'
                        }`}
                        title="Excluir todas as apostas cadastradas para este concurso"
                      >
                        <span>🗑️</span> Excluir Jogos
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.key, !!group.isToday, isFirstGroup);
                        }}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs ${
                          isDayGroup || group.isFuture
                            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                        title={isExpanded ? "Recolher apostas deste concurso" : "Expandir para ver as dezenas"}
                      >
                        <span>{isExpanded ? '▲ Recolher' : `▼ Ver Apostas (${group.games.length})`}</span>
                      </button>
                    </div>
                  </div>

                  {/* Visualização Expandida ou Retraída das Apostas */}
                  {isExpanded ? (
                    <div className="divide-y divide-gray-100 animate-fadeIn">
                      {group.games.map((game: any, gameIndex: number) => {
                        const hitsInfo = game.prizeInfo;

                        return (
                          <div 
                            key={game.id} 
                            className={`p-3.5 sm:p-5 transition rounded-xl ${
                              hitsInfo.isWinner 
                                ? 'bg-gradient-to-r from-emerald-100 via-amber-50 to-teal-100 border-2 border-emerald-500 shadow-xl ring-4 ring-emerald-300/50' 
                                : 'hover:bg-gray-50/70'
                            }`}
                          >
                            {/* Destaque Eminente para Aposta Premiada */}
                            {hitsInfo.isWinner && (
                              <div className="mb-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-3.5 py-2 rounded-lg flex flex-wrap items-center justify-between shadow-md gap-2">
                                <div className="flex items-center gap-2 font-black text-xs sm:text-sm tracking-wide">
                                  <span className="text-base animate-bounce">🏆</span>
                                  <span>APOSTA PREMIADA COM {hitsInfo.hits} PONTOS!</span>
                                </div>
                                {hitsInfo.prizeAmount > 0 && (
                                  <span className="bg-white text-emerald-900 px-2.5 py-1 rounded font-black text-xs shadow-xs border border-emerald-200">
                                    Prêmio: R$ {hitsInfo.prizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-900 text-xs font-black flex items-center justify-center">
                                  #{gameIndex + 1}
                                </span>
                                <span className="font-bold text-sm text-gray-800">
                                  Aposta {gameIndex + 1}
                                </span>
                                {game.month && (
                                  <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 font-bold px-1.5 py-0.5 rounded">
                                    Mês: {game.month}
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
                                      contestName: `Jogo #${gameIndex + 1} (${group.contestTitle})`
                                    })}
                                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-2.5 py-1 rounded shadow transition cursor-pointer flex items-center gap-1"
                                    title="Ratear este prêmio entre as cotas"
                                  >
                                    <span>💰</span> Dividir Cota
                                  </button>
                                )}

                                {game.receiptURL && (
                                  <button
                                    onClick={() => setSelectedReceipt(game.receiptURL)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                                  >
                                    Ver Bilhete
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeletingId(game.id)}
                                  className="text-xs text-red-500 hover:text-red-700 p-1 font-bold cursor-pointer"
                                  title="Excluir aposta"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {/* Dezenas do Jogo com Destaque de Acertos */}
                            <div className="mt-2.5">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {game.gameNumbers.sort((a: number, b: number) => a - b).map((num: number) => {
                                  const isHit = !game.isPendingFuture && drawnNumbers.includes(num);
                                  return (
                                    <span
                                      key={num}
                                      title={game.isPendingFuture ? `Número ${num} (Aguardando Sorteio)` : (isHit ? `Número ${num} sorteado!` : `Número ${num}`)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs flex items-center justify-center transition shadow-sm ${
                                        isHit
                                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-400 font-black scale-110 shadow-lg animate-pulse'
                                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                                      }`}
                                    >
                                      {String(num).padStart(2, '0')}
                                    </span>
                                  );
                                })}
                              </div>
                              
                              {!game.isPendingFuture && drawnNumbers.length > 0 && (
                                <button
                                  onClick={() => setShowVolantesComparator(true)}
                                  className="mt-2.5 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer"
                                >
                                  <span>🔍</span> Detalhar Acertos do Concurso #{game.contestNumber || latestResult?.contest}
                                </button>
                              )}
                            </div>

                            {/* Detalhamento Completo da Premiação e Números */}
                            {!game.isPendingFuture && drawnNumbers.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
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
                                  <span className="text-gray-500 font-medium">Nenhum acerto neste concurso.</span>
                                )}

                                {hitsInfo.missedGameNumbers && hitsInfo.missedGameNumbers.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-600 flex items-center gap-1">
                                      <span>❌</span> Não saíram ({hitsInfo.missedGameNumbers.length}):
                                    </span>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {hitsInfo.missedGameNumbers.map((n: number) => (
                                        <span key={n} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium text-[11px] border border-gray-200">
                                          {String(n).padStart(2, '0')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {hitsInfo.missingDrawnNumbers && hitsInfo.missingDrawnNumbers.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-amber-800 flex items-center gap-1">
                                      <span>⏳</span> Faltaram do sorteio ({hitsInfo.missingDrawnNumbers.length}):
                                    </span>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {hitsInfo.missingDrawnNumbers.map((n: number) => (
                                        <span key={n} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold text-[11px] border border-amber-200">
                                          {String(n).padStart(2, '0')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div 
                      onClick={() => toggleGroup(group.key, !!group.isToday, isFirstGroup)}
                      className="px-4 py-2.5 bg-gray-50/70 hover:bg-gray-100 cursor-pointer flex items-center justify-between text-xs text-gray-600 transition"
                      title="Clique para expandir as dezenas deste concurso"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🔒</span>
                        <span>{group.games.length} {group.games.length === 1 ? 'aposta cadastrada' : 'apostas cadastradas'} (recolhidas).</span>
                      </div>
                      <span className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1">
                        Ver dezenas ▼
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    )}
  </div>

      {/* 2. ORDEM SECUNDÁRIA: Resultado do Último Sorteio Oficial da Caixa (Abaixo das apostas) */}
      <div className={`bg-gradient-to-r ${isMegaSena ? 'from-emerald-900 via-teal-900 to-emerald-800' : 'from-purple-900 via-indigo-900 to-purple-800'} text-white p-4 rounded-xl shadow-sm space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${isMegaSena ? 'bg-emerald-500/40 text-emerald-200' : 'bg-purple-500/40 text-purple-200'} px-2 py-0.5 rounded-full`}>
                Resultado Oficial Caixa
              </span>
              {latestResult?.isManual && (
                <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded font-bold">
                  ✏️ Manual
                </span>
              )}
            </div>
            <h3 className="font-bold text-base sm:text-lg mt-1 flex items-center gap-1.5">
              <span>🎰</span> {isMegaSena ? 'Mega-Sena' : 'Lotofácil'} {latestResult?.contest ? `Concurso #${latestResult.contest}` : 'Resultado'}
              {latestResult?.date && (
                <span className="text-xs font-normal text-purple-200 sm:inline ml-1">
                  ({latestResult.date})
                </span>
              )}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPrizeTable(!showPrizeTable)}
              className={`text-xs font-black px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs border ${
                showPrizeTable 
                  ? 'bg-amber-400 text-gray-950 border-amber-300 ring-2 ring-amber-300' 
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/20'
              }`}
              title="Ver tabela de faixas de premiação da Caixa e acertos do bolão"
            >
              <span>🏆</span> {showPrizeTable ? 'Ocultar Faixas' : 'Faixas de Premiação'}
            </button>

            <button
              onClick={() => setShowVolantesComparator(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs border border-emerald-400"
              title="Comparar todos os volantes cadastrados diretamente com o concurso correto"
            >
              <span>🎯</span> Conferir Volantes
            </button>

            <button
              onClick={() => setShowThermometer(!showThermometer)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Ver mapa de calor e termômetro das dezenas"
            >
              <span>🌡️</span> {showThermometer ? 'Ocultar Termômetro' : 'Termômetro'}
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer border border-white/20"
              title="Pesquisar outros concursos da Lotofácil"
            >
              <span>🔍</span> Buscar
            </button>

            <button
              onClick={handleFetchLatestCaixa}
              disabled={isUpdatingResult}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Puxar o sorteio mais recente da Caixa"
            >
              <span>{isUpdatingResult ? '⏳' : '🔄'}</span> {isUpdatingResult ? 'Buscando...' : 'Mais Recente'}
            </button>

            <button
              onClick={() => setShowManualResultModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer border border-white/20"
              title="Corrigir resultado manualmente"
            >
              <span>✏️</span> Corrigir
            </button>

            <button
              onClick={() => {
                if (!latestResult) return;
                const text = encodeURIComponent(
                  `🍀 *RESULTADO DO BOLÃO - CONCURSO #${latestResult.contest}* 🍀\n\n` +
                  `📅 Data: ${latestResult.date}\n` +
                  `🔢 Dezenas Sorteadas: ${drawnNumbers.join(', ')}\n\n` +
                  `📊 Confira o painel completo no app do Bolão!`
                );
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs border border-emerald-400"
              title="Compartilhar resultado no WhatsApp"
            >
              <span>📲</span> WhatsApp
            </button>
          </div>
        </div>

        {/* Barra de Navegação Rápida entre Concursos: Botões Pra Trás e Pra Frente */}
        <div className="bg-black/30 backdrop-blur-xs p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2.5 border border-white/10 text-xs">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => handleNavigateContest('prev')}
              disabled={isUpdatingResult || !latestResult?.contest}
              className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 active:scale-95 text-white font-black px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-sm border border-white/15"
              title="Voltar para o concurso anterior"
            >
              <span className="text-base">◀</span>
              <span>Anterior</span>
            </button>

            <div className="px-3 py-1.5 bg-purple-950/80 rounded-xl border border-purple-400/40 text-center">
              <span className="text-[10px] text-purple-300 block uppercase font-bold tracking-wider">Concurso</span>
              <span className="text-sm font-black text-amber-300">
                #{latestResult?.contest || '---'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateContest('next')}
              disabled={isUpdatingResult || !latestResult?.contest}
              className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 active:scale-95 text-white font-black px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-sm border border-white/15"
              title="Avançar para o próximo concurso"
            >
              <span>Próximo</span>
              <span className="text-base">▶</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const num = parseInt(jumpContestInput.trim(), 10);
              if (num > 0) {
                handleNavigateContest(num);
                setJumpContestInput('');
              }
            }}
            className="flex items-center gap-1.5 w-full sm:w-auto justify-end"
          >
            <input
              type="number"
              placeholder="Ir p/ Concurso..."
              value={jumpContestInput}
              onChange={(e) => setJumpContestInput(e.target.value)}
              className="bg-black/40 text-white placeholder-purple-300/60 text-xs px-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-amber-400 w-32"
            />
            <button
              type="submit"
              disabled={!jumpContestInput.trim() || isUpdatingResult}
              className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-black px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-40 shadow-sm"
            >
              Ir
            </button>
          </form>
        </div>

        {drawnNumbers.length > 0 ? (
          <div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {drawnNumbers.sort((a, b) => a - b).map(num => (
                <div
                  key={num}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-purple-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-md border-2 border-purple-300"
                >
                  {String(num).padStart(2, '0')}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
              <p className="text-[11px] text-purple-200 flex items-center gap-1">
                <span>✅</span> Dezenas sorteadas do Concurso #{latestResult?.contest} conferindo as apostas do bolão.
              </p>

              {latestResult?.contest && (
                <div className="text-[11px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <span>📅 Próximo Sorteio:</span> Concurso #{Number(latestResult.contest) + 1}
                  {latestResult?.nextEstimatedPrize ? (
                    <span className="text-amber-300 ml-1">
                      • Est: R$ {Number(latestResult.nextEstimatedPrize).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-purple-200 py-1">
            Nenhum resultado registrado ainda. Clique em <strong>"Atualizar"</strong> para puxar o sorteio mais recente da Caixa.
          </div>
        )}
      </div>

      {/* Seção Expansível: Quadro Oficial de Faixas de Premiação */}
      {showPrizeTable && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-base shadow-xs">
                🏆
              </span>
              <div>
                <h4 className="font-black text-gray-900 text-sm sm:text-base leading-tight">
                  Tabela Oficial de Faixas de Premiação {isMegaSena ? 'Mega-Sena' : 'Lotofácil'}
                </h4>
                <p className="text-xs text-gray-500">
                  {latestResult?.contest ? `Conferência baseada no Concurso #${latestResult.contest}` : 'Valores Oficiais da Caixa'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPrizeTable(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              ✕ Fechar
            </button>
          </div>

          {/* Grid de Faixas de Premiação */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { hits: 15, label: '15 Acertos', desc: 'Prêmio Principal', badge: 'bg-purple-600 text-white', prize: latestResult?.prize15Amount || 1500000 },
              { hits: 14, label: '14 Acertos', desc: 'Faixa 2', badge: 'bg-blue-600 text-white', prize: latestResult?.prize14Amount || 1500 },
              { hits: 13, label: '13 Acertos', desc: 'Fixo Caixa', badge: 'bg-emerald-600 text-white', prize: 35.00 },
              { hits: 12, label: '12 Acertos', desc: 'Fixo Caixa', badge: 'bg-emerald-500 text-white', prize: 14.00 },
              { hits: 11, label: '11 Acertos', desc: 'Fixo Caixa', badge: 'bg-teal-600 text-white', prize: 7.00 },
            ].map(tier => {
              const bolaoCount = bolaoTierStats ? bolaoTierStats[tier.hits]?.count || 0 : 0;
              const bolaoTotal = bolaoTierStats ? bolaoTierStats[tier.hits]?.total || 0 : 0;

              return (
                <div
                  key={tier.hits}
                  className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                    bolaoCount > 0
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-300/60 shadow-xs'
                      : 'bg-gray-50/70 border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${tier.badge}`}>
                        {tier.label}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {tier.desc}
                      </span>
                    </div>

                    <div className="text-sm font-black text-gray-900 mt-1">
                      R$ {tier.prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500">No Bolão:</span>
                    <span className={`font-black ${bolaoCount > 0 ? 'text-emerald-700 font-extrabold' : 'text-gray-400'}`}>
                      {bolaoCount} {bolaoCount === 1 ? 'aposta' : 'apostas'}
                      {bolaoTotal > 0 && ` (R$ ${bolaoTotal.toFixed(2)})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalBolaoPrize > 0 && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSplitModalData({
                  totalPrize: totalBolaoPrize,
                  contestName: latestResult?.contest ? `Concurso #${latestResult.contest}` : 'Concurso Atual'
                })}
                className="bg-purple-900 hover:bg-purple-800 text-white font-black px-3.5 py-2 rounded-lg shadow-xs transition cursor-pointer"
              >
                📊 Ratear Total (R$ {totalBolaoPrize.toFixed(2)})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seção Expansível: Termômetro das 25 Dezenas */}
      {showThermometer && (
        <div className="animate-in fade-in duration-200">
          <StatsThermometer />
        </div>
      )}

      {/* Painel de Rateio Geral do Bolão quando houver prêmios */}
      {totalBolaoPrize > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-xl p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <div>
                <h4 className="font-black text-base leading-tight">PREMIAÇÃO CONQUISTADA NO BOLÃO!</h4>
                <p className="text-xs text-amber-100">
                  {winningGamesCount} {winningGamesCount === 1 ? 'aposta premiada' : 'apostas premiadas'} neste concurso
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/20 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-white/20 text-right">
              <span className="text-[10px] uppercase font-bold text-amber-100 block">Total a Ratear</span>
              <span className="text-lg font-black">
                R$ {totalBolaoPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-white text-amber-950 px-3.5 py-1.5 rounded-lg shadow-sm font-bold text-right">
              <span className="text-[10px] uppercase font-extrabold text-amber-800 block">Por 1 Cota ({totalPaidQuotasCount} cotas)</span>
              <span className="text-lg font-black text-emerald-700">
                R$ {prizePerCota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => setSplitModalData({
                totalPrize: totalBolaoPrize,
                contestName: latestResult?.contest ? `Concurso ${latestResult.contest}` : 'Último Concurso'
              })}
              className="bg-white hover:bg-amber-50 text-amber-900 text-xs font-black px-3.5 py-2.5 rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📊</span> Ver Divisão Completa
            </button>
          </div>
        </div>
      )}

      {/* Modal de Correção Manual de Resultado */}
      {showManualResultModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-purple-700 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Corrigir Resultado</h3>
                <p className="text-[10px] text-purple-100 uppercase font-bold tracking-widest">Entrada Manual de Dados</p>
              </div>
              <button onClick={() => setShowManualResultModal(false)} className="text-white/70 hover:text-white transition cursor-pointer">
                <span className="text-2xl">✕</span>
              </button>
            </div>
            
            <form onSubmit={handleManualResultSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase">Número do Concurso</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 3786"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-purple-500 focus:outline-none transition"
                  value={manualContest}
                  onChange={(e) => setManualContest(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-gray-500 uppercase">Selecione as {isMegaSena ? 6 : 15} Dezenas</label>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${manualNumbers.length === (isMegaSena ? 6 : 15) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {manualNumbers.length}/{isMegaSena ? 6 : 15}
                  </span>
                </div>
                
                <div className={`grid ${isMegaSena ? 'grid-cols-6' : 'grid-cols-5'} gap-1.5`}>
                  {Array.from({ length: stats.totalNumbers }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleManualNumber(n)}
                      className={`h-10 rounded-lg font-black text-xs transition-all cursor-pointer ${
                        manualNumbers.includes(n)
                          ? (isMegaSena ? 'bg-emerald-600 text-white shadow-md' : 'bg-purple-600 text-white shadow-md')
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {String(n).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                <p className="text-[10px] text-amber-800 leading-relaxed italic">
                  * Use esta opção apenas se a busca automática falhar ou trouxer dados errados. Isso corrige a conferência de todos os jogos do bolão.
                </p>
              </div>

              <button
                type="submit"
                disabled={manualNumbers.length !== (isMegaSena ? 6 : 15) || !manualContest || isUpdatingResult}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black py-4 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
              >
                {isUpdatingResult ? 'Salvando...' : 'Confirmar Correção'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Impressão de Volantes */}
      {showFlyerModal && (
        <LottoFlyerGenerator
          games={filteredGames}
          onClose={() => setShowFlyerModal(false)}
        />
      )}
    </div>
  );
}
