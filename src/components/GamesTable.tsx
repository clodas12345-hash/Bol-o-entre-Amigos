import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, deleteDoc, doc, getDocs, addDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { useResponsiveLayout, formatAnyDateBR } from '../lib/formatters';
import { calculateGamePrize, MEGASENA_STATS, LOTOFACIL_STATS, getCorrectGameCost } from '../lib/prizes';
import PrizeSplitModal from './PrizeSplitModal';
import ContestHistoryChecker from './ContestHistoryChecker';
import StatsThermometer from './StatsThermometer';
import LottoFlyerGenerator from './LottoFlyerGenerator';
import VolantesHistoryComparator from './VolantesHistoryComparator';
import GameHistory, { parseDateSafely } from './GameHistory';
import { triggerResultNotification } from '../lib/autoNotificationService';
import { notifyWinningPrize, sendAppNotification, requestNotificationPermission, syncMissingGamesTwoHourReminders } from '../lib/notifications';
import { usePermissions } from '../lib/PermissionsContext';
import { fetchLotteryResultDirectly } from '../lib/apiHelper';
import { isDrawDay, getNextDrawDate, isNationalHoliday, formatDateBR } from '../lib/drawCalendar';

interface GamesTableProps {
  onOpenNewGame?: () => void;
}

export default function GamesTable({ onOpenNewGame }: GamesTableProps) {
  const { addToast } = useToast();
  const { activePool, isQuotaExceeded, setIsQuotaExceeded } = usePool();
  const { isMobile } = useResponsiveLayout(640);
  const { can, isAdmin, isCounselor } = usePermissions();
  const isAdminOrCounselor = isAdmin || isCounselor;

  const canCreateGames = can('games_create');
  const canDeleteGames = can('games_delete');
  const canEditOfficialResult = can('games_official_result_edit');

  const [gamesReady, setGamesReady] = useState(false);
  const [renewalPopupDismissed, setRenewalPopupDismissed] = useState(false);
  const baselineBetsRef = useRef<{ initialized: boolean; activeCount: number; maxTs: number }>({
    initialized: false,
    activeCount: 0,
    maxTs: 0
  });

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
        // Remove strict filtering to ensure we show the best available info on load
        if (cNum > 0) {
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
            return cNum > 0 && !r?.isSimulated;
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
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [manualContest, setManualContest] = useState('');
  const [manualNumbers, setManualNumbers] = useState<number[]>([]);
  const [jumpContestInput, setJumpContestInput] = useState('');

  const [nextDrawInfo, setNextDrawInfo] = useState<{
    text: string;
    isToday: boolean;
    timeLeft: string;
    statusBadge: string;
  }>({
    text: 'Hoje às 20h00',
    isToday: true,
    timeLeft: '20h00',
    statusBadge: 'Hoje'
  });

  const [currentDayStr, setCurrentDayStr] = useState(() => formatDateBR(new Date()));

  // Calcula o próximo sorteio e mantém o jogo/sorteio do dia ativo até o último minuto do dia (23:59:59)
  useEffect(() => {
    const calculateNextDraw = () => {
      const now = new Date();
      const todayKey = formatDateBR(now);
      setCurrentDayStr(prev => (prev !== todayKey ? todayKey : prev));

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const lotteryType = (activePool?.lotteryType === 'megasena' ? 'megasena' : 'lotofacil') as 'lotofacil' | 'megasena';

      let targetDate = new Date(now);
      targetDate.setHours(20, 0, 0, 0);

      const todayDrawCheck = isDrawDay(now, lotteryType);
      const isBeforeDrawTime = currentHour < 20;
      const isDuringDraw = currentHour === 20 && currentMinute <= 45;

      let isToday = false;
      let statusBadge = 'Próximo';

      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      if (todayDrawCheck.isDraw) {
        // Mantém como sorteio de hoje até o último minuto do dia (23h59m59s), só mudando na virada do dia (00h00)
        isToday = true;
        if (isBeforeDrawTime) {
          statusBadge = 'Hoje às 20h00';
        } else if (isDuringDraw) {
          statusBadge = 'Sorteio em Apuração!';
          setNextDrawInfo({
            text: 'Sorteio em apuração pela Caixa!',
            isToday: true,
            timeLeft: 'Em andamento',
            statusBadge
          });
          return;
        } else {
          statusBadge = `Sorteio de Hoje (${formatDateBR(now)})`;
          setNextDrawInfo({
            text: `Sorteio de Hoje (${formatDateBR(now)})`,
            isToday: true,
            timeLeft: 'Até 23h59',
            statusBadge
          });
          return;
        }
      } else {
        const nextDraw = getNextDrawDate(now, lotteryType);
        targetDate = new Date(nextDraw.date);
        targetDate.setHours(20, 0, 0, 0);
        statusBadge = `${dayNames[targetDate.getDay()]} (${formatDateBR(targetDate)})`;
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setNextDrawInfo({
        text: isToday ? 'Hoje às 20h00' : `${statusBadge} às 20h00`,
        isToday,
        timeLeft: totalHours > 0 ? `Faltam ${totalHours}h ${totalMinutes}m` : `Faltam ${totalMinutes}m`,
        statusBadge
      });
    };

    calculateNextDraw();
    const interval = setInterval(calculateNextDraw, 15000);
    return () => clearInterval(interval);
  }, [activePool?.lotteryType]);

  const handleRequestPushPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPushEnabled(true);
        addToast('🔔 Notificações push ativadas com sucesso!', 'success');
        await sendAppNotification('🍀 Bolão Lotofácil: Notificações Ativadas!', {
          body: 'Você receberá avisos automáticos nos dias de sorteio.'
        });
      } else {
        addToast('Permissão de notificações não concedida pelo dispositivo.', 'info');
      }
    } catch {
      addToast('Não foi possível solicitar permissão de notificações.', 'error');
    }
  };

  const handleAddToGoogleCalendar = () => {
    const baseDate = new Date();
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    const title = encodeURIComponent('🍀 Sorteio Oficial Lotofácil - Bolão');
    const details = encodeURIComponent('Horário do sorteio da Lotofácil (20h00). Abra o app do Bolão para conferir!');
    const location = encodeURIComponent('Bolão dos Amigos');
    const dates = `${year}${month}${day}T230000Z/${year}${month}${day}T233000Z`;
    const recur = encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&recur=${recur}`;
    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    addToast('Abrindo Google Agenda com evento recorrente...', 'info');
  };

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
        date: formatDateBR(new Date()),
        numbers: [...manualNumbers].sort((a, b) => a - b),
        accumulated: false,
        createdAt: new Date(),
        isManual: true
      };

      await addDoc(collection(db, resultsCollection), formattedData);
      setLatestResult(formattedData);
      addToast(`Resultado do Concurso ${manualContest} corrigido manualmente com sucesso!`, 'success');

      // Trigger automatic result published notification if applicable
      if (formattedData.contest > 0) {
        triggerResultNotification(formattedData.contest);
      }

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

  // Aba selecionada: 'today' (apenas jogos de hoje), 'future' (apostas futuras) ou 'history' (jogos de dias passados)
  const [gamesTab, setGamesTab] = useState<'today' | 'future' | 'history'>('today');

  // Controle de grupos de concursos expandidos/retraídos e limites de renderização rápida (sempre retraído por padrão)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedLimits, setExpandedLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    setExpandedGroups({});
  }, [gamesTab]);

  const isGroupExpanded = (groupKey: string, _isToday?: boolean, _isFirstGroup?: boolean): boolean => {
    return Boolean(expandedGroups[groupKey]);
  };

  const toggleGroup = (groupKey: string, isToday: boolean, isFirstGroup?: boolean) => {
    const current = isGroupExpanded(groupKey, isToday, isFirstGroup);
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !current }));
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
      const data = await fetchLotteryResultDirectly(isMegaSena ? 'megasena' : 'lotofacil', targetNum);
      if (data && Array.isArray(data.numbers) && data.numbers.length === (isMegaSena ? 6 : 15)) {
        setLatestResult(data);
        addToast(`Concurso #${data.contest} carregado com sucesso!`, 'success');
        if (data.contest > 0) {
          triggerResultNotification(data.contest);
        }
      } else {
        addToast(`Aviso: Concurso #${targetNum} ainda não foi apurado ou não está disponível.`, 'info');
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
    addToast('🔄 Buscando resultado oficial mais recente da Caixa...', 'info');
    try {
      const data = await fetchLotteryResultDirectly(isMegaSena ? 'megasena' : 'lotofacil', 'latest');
      if (data && Array.isArray(data.numbers) && data.numbers.length === (isMegaSena ? 6 : 15)) {
        setLatestResult(data);
        addToast(`🎉 Concurso #${data.contest} atualizado com sucesso!`, 'success');
        if (data.contest > 0) {
          triggerResultNotification(data.contest);
        }
      } else {
        addToast('Não foi possível obter o resultado oficial mais recente no momento. Tente novamente em instantes.', 'error');
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
      let list = allDocs.filter((g: any) => {
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

      if (list.length === 0 && allDocs.length > 0) {
        list = allDocs;
      }

      list.sort((a: any, b: any) => {
        const dateA = a.date && typeof a.date.toDate === 'function' ? a.date.toDate().getTime() : 0;
        const dateB = b.date && typeof b.date.toDate === 'function' ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      });
      setGames(list);
      setGamesReady(true);
      setTimeout(() => {
        try {
          localStorage.setItem('bolao_cache_games', JSON.stringify(list));
        } catch (cacheErr) {
          console.warn('Failed to save games to localStorage cache:', cacheErr);
        }
      }, 0);
    }, err => {
      console.warn('Games snapshot error, loading cache:', err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
      }
      const cached = localStorage.getItem('bolao_cache_games');
      if (cached) {
        setGames(JSON.parse(cached));
      }
      setGamesReady(true);
    });

    // Escuta todo o histórico de resultados salvos no Firestore em tempo real
    const qAllResults = query(collection(db, resultsCollection), orderBy('createdAt', 'desc'), limit(150));
    const unsubResults = onSnapshot(qAllResults, snapshot => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Deduplica por concurso e ordena do maior para o menor
        const uniqueMap = new Map<number, any>();
        list.forEach((item: any) => {
          const cNum = Number(item.contest);
          if (cNum && !item.isSimulated && !uniqueMap.has(cNum)) {
            uniqueMap.set(cNum, item);
          }
        });
        const sorted = Array.from(uniqueMap.values()).sort((a, b) => Number(b.contest) - Number(a.contest));
        setSavedResultsList(sorted);
        setTimeout(() => {
          try {
            localStorage.setItem('bolao_cache_results', JSON.stringify(sorted));
          } catch (cacheErr) {
            console.warn('Failed to save results to localStorage cache:', cacheErr);
          }
        }, 0);

        // Atualiza para o concurso mais recente
        const defaultLatest = sorted.length > 0 ? sorted[0] : null;

        if (defaultLatest) {
          setLatestResult((prev: any) => {
            const nextLatest = prev && sorted.some((r: any) => Number(r.contest) === Number(prev.contest)) ? prev : defaultLatest;
            if (nextLatest) {
              setTimeout(() => {
                try {
                  localStorage.setItem('bolao_cache_latest_result', JSON.stringify(nextLatest));
                } catch (cacheErr) {
                  console.warn('Failed to save latestResult to cache:', cacheErr);
                }
              }, 0);
            }
            return nextLatest;
          });
        }
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
            setSavedResultsList(list.filter((r: any) => Number(r.contest) > 0 && !r.isSimulated));
          }
        } catch {}
      }
      const cachedLatest = localStorage.getItem('bolao_cache_latest_result');
      if (cachedLatest) {
        try {
          const parsed = JSON.parse(cachedLatest);
          const cNum = Number(parsed?.contest);
          if (cNum > 0 && !parsed?.isSimulated) {
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
    // Atualização otimista imediata da interface (0ms de latência percebida)
    setGames(prev => prev.filter(g => g.id !== gameId));
    setDeletingId(null);
    try {
      await deleteDoc(doc(db, 'games', gameId));
      addToast('Aposta removida com sucesso.', 'info');
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

    const idsToRemove = new Set(groupToDelete.games.map((g: any) => g.id));
    const count = groupToDelete.games.length;
    const title = groupToDelete.contestTitle;

    // Atualização otimista na tela em 0ms
    setGames(prev => prev.filter(g => !idsToRemove.has(g.id)));
    setGroupToDelete(null);
    setIsDeletingGroup(true);

    try {
      // Usa lote de gravação (writeBatch) do Firestore: muito mais rápido do que dezenas de requisições isoladas
      const batch = writeBatch(db);
      groupToDelete.games.forEach((g: any) => {
        if (g.id) {
          batch.delete(doc(db, 'games', g.id));
        }
      });
      await batch.commit();

      addToast(`Todas as ${count} apostas do ${title} foram excluídas com sucesso.`, 'success');
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
    const dateStr = formatDateBR(gDate);

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

  // Lista de bilhetes que estão duplicados no banco de dados para permitir exclusão em lote
  const duplicateGamesList = useMemo(() => {
    const seen = new Set<string>();
    const dupes: any[] = [];
    games.forEach(g => {
      const cNum = extractContestNumber(g.contest);
      const dateInfo = getGameDateInfo(g);
      const numbersKey = Array.isArray(g.numbers)
        ? g.numbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b).join('-')
        : '';
      const sig = `${g.poolId || ''}::${cNum || dateInfo.dateStr}::${numbersKey}`;
      if (seen.has(sig)) {
        dupes.push(g);
      } else {
        seen.add(sig);
      }
    });
    return dupes;
  }, [games]);

  // Auto-deduplicação silenciosa no Firestore caso algum bilhete repetido já exista no banco
  const autoCleanDuplicatesRef = useRef(false);
  useEffect(() => {
    if (duplicateGamesList.length > 0 && !autoCleanDuplicatesRef.current) {
      autoCleanDuplicatesRef.current = true;
      const batch = writeBatch(db);
      duplicateGamesList.forEach(g => {
        if (g.id) {
          batch.delete(doc(db, 'games', g.id));
        }
      });
      batch.commit().catch(err => {
        console.warn('Auto deduplication error:', err);
      }).finally(() => {
        autoCleanDuplicatesRef.current = false;
      });
    }
  }, [duplicateGamesList]);

  const gamesWithPrizes = useMemo(() => {
    return uniqueGames.map(game => {
      const gameNumbers: number[] = Array.isArray(game.numbers)
        ? game.numbers.map((n: any) => Number(n))
        : [];
      const dateInfo = getGameDateInfo(game);
      const contestNumber = extractContestNumber(game.contest);

      // Busca se existe o resultado sorteado específico deste concurso no banco
      let foundResultForContest: any = null;
      if (contestNumber) {
        foundResultForContest = savedResultsList.find(r => Number(r.contest) === contestNumber);
      }

      const latestContestNum = latestResult?.contest ? Number(latestResult.contest) : 0;

      // Uma aposta é FUTURA exclusivamente quando NÃO corre no dia de hoje (data estritamente futura)
      const isPendingFuture = Boolean(dateInfo.isFuture && !dateInfo.isToday);

      let targetResult = foundResultForContest || (contestNumber === latestContestNum ? latestResult : null);

      const resDrawn = (targetResult && Array.isArray(targetResult.numbers))
        ? targetResult.numbers.map((n: any) => Number(n))
        : [];

      const prizeInfo = isPendingFuture
        ? {
            hits: 0,
            prizeAmount: 0,
            isWinner: false,
            hitsText: 'Aguardando Sorteio',
            statusText: 'Aposta Futura',
            badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200 font-bold'
          }
        : dateInfo.isToday && resDrawn.length === 0
        ? {
            hits: 0,
            prizeAmount: 0,
            isWinner: false,
            hitsText: 'Corre Hoje',
            statusText: 'Aposta do Dia',
            badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
          }
        : resDrawn.length === 0
        ? {
            hits: 0,
            prizeAmount: 0,
            isWinner: false,
            hitsText: contestNumber ? `Concurso #${contestNumber} Não Apurado` : 'Aguardando Sorteio',
            statusText: dateInfo.isToday ? 'Aposta do Dia' : 'Pendente',
            badgeColor: dateInfo.isToday
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }
        : calculateGamePrize(gameNumbers, resDrawn, game.customPrize, targetResult);

      return {
        ...game,
        gameNumbers,
        prizeInfo,
        contestNumber,
        isPendingFuture,
        contestResultNumbers: resDrawn,
        ...dateInfo
      };
    });
  }, [uniqueGames, savedResultsList, latestResult, currentDayStr]);

  // 1. Jogos exclusivamente de hoje (permanecem até 23:59:59, só mudando na virada do dia às 00:00:00)
  const todayGames = useMemo(() => {
    return gamesWithPrizes.filter(g => g.isToday);
  }, [gamesWithPrizes]);

  // 2. Apostas Futuras (agendadas para dias posteriores a hoje)
  const futureGames = useMemo(() => {
    return gamesWithPrizes.filter(g => g.isFuture && !g.isToday);
  }, [gamesWithPrizes]);

  // 3. Histórico de jogos passados (dias anteriores a hoje)
  const historyGames = useMemo(() => {
    return gamesWithPrizes.filter(g => g.isPast && !g.isToday);
  }, [gamesWithPrizes]);

  // Garante que o concurso mais recente oficial da Caixa fique sempre fixado e exibido na tela
  useEffect(() => {
    if (savedResultsList.length > 0) {
      const validResults = savedResultsList.filter((r: any) => !r.isSimulated && Number(r.contest) > 0);
      const latestOfficial = validResults.length > 0 ? validResults[0] : savedResultsList[0];
      if (latestOfficial && (!latestResult || Number(latestOfficial.contest) > Number(latestResult.contest))) {
        setLatestResult(latestOfficial);
      }
    }
  }, [savedResultsList, isMegaSena]);

  // Consulta automática do sorteio mais recente oficial na Caixa ao inicializar e em segundo plano
  useEffect(() => {
    const autoSyncResult = async () => {
      try {
        const data = await fetchLotteryResultDirectly(isMegaSena ? 'megasena' : 'lotofacil', 'latest');
        if (data && Array.isArray(data.numbers) && data.numbers.length === (isMegaSena ? 6 : 15)) {
          setLatestResult((prev: any) => {
            if (!prev || Number(data.contest) >= Number(prev.contest)) {
              return data;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Silently fetched latest contest error:', err);
      }
    };

    autoSyncResult();

    // Polling automático a cada 60 segundos
    const interval = setInterval(() => {
      autoSyncResult();
    }, 60000);

    return () => clearInterval(interval);
  }, [isMegaSena]);

  // Lista de jogos da aba selecionada ('today' | 'future' | 'history')
  const currentTabGames = useMemo(() => {
    if (gamesTab === 'today') return todayGames;
    if (gamesTab === 'future') return futureGames;
    return historyGames;
  }, [gamesTab, todayGames, futureGames, historyGames]);

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
      group.totalCost += getCorrectGameCost(game, isMegaSena);
      group.totalPrize += Number(game.prizeInfo.prizeAmount) || 0;
      if (game.prizeInfo.isWinner) {
        group.winningGamesCount++;
      }
      if (game.isToday) group.isToday = true;
      if (game.isTomorrow) group.isTomorrow = true;
    });

    const list = Array.from(map.values());

    // Ordenação dos grupos RIGOROSA POR DIAS
    // Ordenação dos grupos RIGOROSA POR DIAS
    if (gamesTab === 'today' || gamesTab === 'future') {
      // Ordena cronologicamente do dia mais próximo para os dias seguintes
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

  const expandAllGroups = () => {
    const next: Record<string, boolean> = {};
    groupedGames.forEach(g => { next[g.key] = true; });
    setExpandedGroups(next);
  };

  const collapseAllNonToday = () => {
    setExpandedGroups({});
  };

  const areAllExpanded = groupedGames.length > 0 && groupedGames.every((g, idx) => isGroupExpanded(g.key, !!g.isToday, idx === 0));

  const handleToggleExpandAll = () => {
    if (areAllExpanded) {
      collapseAllNonToday();
    } else {
      expandAllGroups();
    }
  };

  const totalBolaoPrize = gamesTab === 'future'
    ? 0
    : filteredGames.reduce((sum, g) => sum + (g.isPendingFuture ? 0 : (Number(g.prizeInfo?.prizeAmount) || 0)), 0);

  const winningGamesCount = gamesTab === 'future'
    ? 0
    : filteredGames.filter(g => !g.isPendingFuture && g.prizeInfo?.isWinner).length;

  // Estatísticas de faixas de acertos do bolão no concurso atual
  const bolaoTierStats = useMemo(() => {
    if (gamesTab === 'future' || !drawnNumbers || drawnNumbers.length === 0) return null;
    const tiers: Record<number, { count: number; prizeUnit: number; total: number }> = {
      15: { count: 0, prizeUnit: latestResult?.prize15Amount || 1500000, total: 0 },
      14: { count: 0, prizeUnit: latestResult?.prize14Amount || 1500, total: 0 },
      13: { count: 0, prizeUnit: latestResult?.prize13Amount || 35.00, total: 0 },
      12: { count: 0, prizeUnit: latestResult?.prize12Amount || 14.00, total: 0 },
      11: { count: 0, prizeUnit: latestResult?.prize11Amount || 7.00, total: 0 },
    };

    filteredGames.forEach(g => {
      if (!g.isPendingFuture && g.prizeInfo && !g.isFuture) {
        const hits = g.prizeInfo.hits;
        if (tiers[hits]) {
          tiers[hits].count++;
          tiers[hits].total += g.prizeInfo.prizeAmount;
        }
      }
    });

    return tiers;
  }, [filteredGames, drawnNumbers, latestResult, gamesTab]);

  const totalPaidQuotasCount = members
    .filter(m => m.paymentStatus === 'Pago')
    .reduce((sum, m) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);
  const prizePerCota = totalPaidQuotasCount > 0 ? totalBolaoPrize / totalPaidQuotasCount : 0;

  // Disparo automático de notificação nativa/web sempre que houver aposta premiada
  useEffect(() => {
    if (!latestResult?.contest || winningGamesCount === 0 || totalBolaoPrize <= 0) return;
    
    const contestNum = Number(latestResult.contest);
    if (!contestNum) return;

    const storageKey = `bolao_prize_notified_${activePool?.id || 'main'}_${contestNum}_${Math.round(totalBolaoPrize)}`;
    if (localStorage.getItem(storageKey)) return;

    // Identifica o maior número de acertos entre as apostas premiadas
    let highestHits = 0;
    filteredGames.forEach(g => {
      if (g.prizeInfo?.isWinner && (g.prizeInfo.hits || 0) > highestHits) {
        highestHits = g.prizeInfo.hits;
      }
    });

    const formattedPrize = `R$ ${totalBolaoPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const hitsText = highestHits > 0 ? ` (Maior acerto: ${highestHits} pontos)` : '';

    // 1. Notificação Nativa (Capacitor APK) e Web Push
    notifyWinningPrize(contestNum, winningGamesCount, totalBolaoPrize, highestHits);

    // 2. Notificação Visual na Tela (Toast)
    addToast(`🏆 PARABÉNS! ${winningGamesCount} aposta(s) premiada(s) no Concurso #${contestNum}! Prêmio Total: ${formattedPrize}!`, 'success');

    // 3. Gravação no Sininho de Notificações para todos os participantes
    try {
      addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title: `🏆 Bolão Premiado no Concurso #${contestNum}!`,
        message: `🎉 Tivemos ${winningGamesCount} aposta(s) premiada(s) somando ${formattedPrize}${hitsText}. Abra o aplicativo para conferir a premiação e o rateio!`,
        type: 'prize',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (notifErr) {
      console.warn('Erro ao gravar notificação de prêmio no Firestore:', notifErr);
    }

    localStorage.setItem(storageKey, new Date().toISOString());
  }, [latestResult?.contest, winningGamesCount, totalBolaoPrize, filteredGames, activePool?.id]);

  // Informações sobre a última aposta cadastrada (para alertar 1 dia antes de correr a última aposta)
  const lastBetInfo = useMemo(() => {
    if (gamesWithPrizes.length === 0) {
      return {
        hasAnyBets: false,
        maxDayTimestamp: 0,
        lastDateStr: '',
        lastContestNum: null as number | null,
        diffDaysToLastBet: -999,
        activeOrFutureCount: 0
      };
    }

    let maxTs = 0;
    let lastDateStr = '';
    let lastContestNum: number | null = null;
    let activeOrFutureCount = 0;

    gamesWithPrizes.forEach(g => {
      if (g.isToday || g.isFuture) activeOrFutureCount++;
      const ts = g.dayTimestamp || 0;
      if (ts > maxTs || (ts === maxTs && (g.contestNumber || 0) > (lastContestNum || 0))) {
        maxTs = ts;
        lastDateStr = g.dateStr;
        lastContestNum = g.contestNumber;
      }
    });

    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const diffDaysToLastBet = maxTs > 0
      ? Math.round((maxTs - todayMid.getTime()) / (1000 * 60 * 60 * 24))
      : -999;

    return {
      hasAnyBets: true,
      maxDayTimestamp: maxTs,
      lastDateStr,
      lastContestNum,
      diffDaysToLastBet,
      activeOrFutureCount
    };
  }, [gamesWithPrizes]);

  // Encerra automaticamente o pop-up assim que novas apostas forem subidas na sessão
  useEffect(() => {
    if (!gamesReady) return;
    if (!baselineBetsRef.current.initialized) {
      baselineBetsRef.current = {
        initialized: true,
        activeCount: lastBetInfo.activeOrFutureCount,
        maxTs: lastBetInfo.maxDayTimestamp
      };
      return;
    }

    // Se o admin/conselheiro acabou de subir novas apostas (aumentou a quantidade ativa ou a data final), fecha o pop-up na hora!
    if (
      lastBetInfo.activeOrFutureCount > baselineBetsRef.current.activeCount ||
      lastBetInfo.maxDayTimestamp > baselineBetsRef.current.maxTs ||
      lastBetInfo.diffDaysToLastBet > 1
    ) {
      setRenewalPopupDismissed(true);
      baselineBetsRef.current = {
        initialized: true,
        activeCount: lastBetInfo.activeOrFutureCount,
        maxTs: lastBetInfo.maxDayTimestamp
      };
    }
  }, [gamesReady, lastBetInfo]);

  // Sempre que o usuário reabrir o aplicativo (voltar do segundo plano), reexibe o pop-up se ainda faltar fazer os jogos
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && lastBetInfo.diffDaysToLastBet <= 1) {
        setRenewalPopupDismissed(false);
        baselineBetsRef.current = {
          initialized: true,
          activeCount: lastBetInfo.activeOrFutureCount,
          maxTs: lastBetInfo.maxDayTimestamp
        };
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [lastBetInfo]);

  // Exibe pop-up 1 dia antes de correr a última aposta (ou no dia da última aposta / sem apostas), exclusivo para Admin e Conselheiros
  const showLastBetReminderPopup =
    isAdminOrCounselor &&
    gamesReady &&
    !renewalPopupDismissed &&
    lastBetInfo.diffDaysToLastBet <= 1;

  // Sincroniza notificações nativas a cada 2h nos dias sem jogo feito e dispara lembrete a cada 2h com app aberto
  useEffect(() => {
    if (!gamesReady) return;

    const lotteryType = (isMegaSena ? 'megasena' : 'lotofacil') as 'lotofacil' | 'megasena';
    const coveredDates = Array.from(new Set(gamesWithPrizes.map(g => g.dateStr)));

    // 1. Agenda/cancela alarmes nativos do Android a cada 2h nos dias sem jogos
    syncMissingGamesTwoHourReminders(coveredDates, isAdminOrCounselor, lotteryType);

    if (!isAdminOrCounselor) return;

    const STORAGE_KEY_2H = `bolao_last_2h_missing_games_${activePool?.id || 'main'}`;

    // Se já tem jogo feito hoje, limpa o controle de 2h de hoje
    if (todayGames.length > 0) {
      localStorage.removeItem(STORAGE_KEY_2H);
      return;
    }

    // 2. Se hoje é dia de sorteio e NÃO tem jogo feito, dispara notificação a cada 2h
    const checkAndNotifyEveryTwoHours = () => {
      const now = new Date();
      const todayCheck = isDrawDay(now, lotteryType);
      if (!todayCheck.isDraw) return;

      const lastNotifiedRaw = localStorage.getItem(STORAGE_KEY_2H);
      const lastNotifiedMs = lastNotifiedRaw ? Number(lastNotifiedRaw) : 0;
      const twoHoursMs = 2 * 60 * 60 * 1000;

      if (!lastNotifiedMs || Date.now() - lastNotifiedMs >= twoHoursMs) {
        const todayBR = formatDateBR(now);
        sendAppNotification(`⚠️ Lembrete (2h): Realizar os Jogos do Bolão!`, {
          body: `Hoje (${todayBR}) ainda não há jogos feitos no sistema. Lembre-se de realizar e subir as apostas do bolão!`
        });
        localStorage.setItem(STORAGE_KEY_2H, String(Date.now()));
      }
    };

    checkAndNotifyEveryTwoHours();
    const interval2h = setInterval(checkAndNotifyEveryTwoHours, 60000);
    return () => clearInterval(interval2h);
  }, [gamesReady, gamesWithPrizes, todayGames.length, isAdminOrCounselor, isMegaSena, activePool?.id]);

  return (
    <div className="space-y-4">
      {/* Pop-up Exclusivo Admin e Conselheiros: 1 dia antes de correr a última aposta (ou sem jogos ativos) */}
      {showLastBetReminderPopup && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-amber-500">
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2.5 py-1 rounded-full border border-white/20">
                  🔒 Visível apenas para Admin e Conselheiros
                </span>
                <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-md">
                  Alerta de Renovação
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black flex items-center gap-2 leading-tight">
                <span>⏰</span>
                <span>
                  {lastBetInfo.diffDaysToLastBet === 1
                    ? 'Falta 1 Dia para Correr a Última Aposta!'
                    : lastBetInfo.diffDaysToLastBet === 0
                    ? 'Hoje Corre a Última Aposta Cadastrada!'
                    : 'Atenção: Realizar os Novos Jogos do Bolão!'}
                </span>
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs sm:text-sm text-amber-950 space-y-1.5">
                {lastBetInfo.diffDaysToLastBet === 1 ? (
                  <p className="font-bold">
                    A última aposta registrada no sistema corre <strong>amanhã ({lastBetInfo.lastDateStr})</strong>
                    {lastBetInfo.lastContestNum ? ` no Concurso #${lastBetInfo.lastContestNum}` : ''}.
                  </p>
                ) : lastBetInfo.diffDaysToLastBet === 0 ? (
                  <p className="font-bold">
                    A última aposta registrada no sistema corre <strong>hoje ({lastBetInfo.lastDateStr})</strong>
                    {lastBetInfo.lastContestNum ? ` no Concurso #${lastBetInfo.lastContestNum}` : ''} e ainda não há apostas futuras cadastradas.
                  </p>
                ) : (
                  <p className="font-bold">
                    Não há apostas ativas ou futuras cadastradas no momento
                    {lastBetInfo.lastDateStr ? ` (última aposta foi em ${lastBetInfo.lastDateStr})` : ''}.
                  </p>
                )}
                <p className="text-amber-800 text-xs leading-relaxed">
                  Lembre-se de realizar os novos jogos e subir os volantes no aplicativo. Assim que as novas apostas forem subidas, este aviso será encerrado automaticamente.
                </p>
              </div>

              {todayGames.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-900">
                  <span className="text-lg">🔔</span>
                  <span>
                    <strong>Sem jogo feito hoje:</strong> O aplicativo enviará notificações automáticas a cada <strong>2 horas</strong> lembrando de realizar os jogos até que as apostas sejam cadastradas.
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {onOpenNewGame && canCreateGames && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNewGame();
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>➕</span>
                    <span>Subir Apostas Agora</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setRenewalPopupDismissed(true)}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm rounded-xl border border-gray-300 transition cursor-pointer"
                >
                  Lembrar Depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
          onOpenVolantesComparator={isAdmin ? () => setShowVolantesComparator(true) : undefined}
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

      {/* 1. ORDEM PRIMÁRIA: PAINEL UNIFICADO - Sorteios, Próximo Concurso e Resultado Oficial Caixa */}
      <div className={`bg-gradient-to-r ${isMegaSena ? 'from-emerald-950 via-teal-900 to-emerald-900' : 'from-purple-950 via-indigo-950 to-purple-900'} text-white p-3.5 sm:p-5 rounded-2xl shadow-lg border border-purple-400/20 space-y-3`}>
        
        {/* Cabeçalho Unificado: Concurso Atual + Próximo Sorteio com Contagem Regressiva */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] uppercase tracking-wider font-extrabold ${isMegaSena ? 'bg-emerald-400 text-emerald-950' : 'bg-amber-400 text-gray-950'} px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap`}>
                Resultado Oficial Caixa
              </span>
              {latestResult?.isManual && (
                <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  ✏️ Manual
                </span>
              )}
            </div>
            <h3 className="font-black text-sm sm:text-xl mt-1.5 flex flex-wrap items-center gap-1.5 text-white">
              <span>🎰</span>
              <span>{isMegaSena ? 'Mega-Sena' : 'Lotofácil'} Concurso #{latestResult?.contest || '---'}</span>
              {latestResult?.date && (
                <span className="text-xs font-normal text-purple-200 font-sans whitespace-nowrap">
                  ({formatAnyDateBR(latestResult.date)})
                </span>
              )}
              {((isMegaSena && latestResult?.prize6Amount) || (!isMegaSena && latestResult?.prize15Amount)) && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1 font-bold whitespace-nowrap tabular-nums">
                  💰 R$ {Number(isMegaSena ? latestResult.prize6Amount : latestResult.prize15Amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </h3>
          </div>

          {/* Cartão Compacto Integrado do Próximo Sorteio */}
          <div className="bg-black/35 backdrop-blur-xs border border-white/15 px-3 py-2 rounded-xl flex items-center gap-2.5 shadow-inner w-full sm:w-auto">
            <span className="text-lg sm:text-xl animate-pulse shrink-0">🗓️</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider whitespace-nowrap">
                  Próximo Concurso #{latestResult?.contest ? Number(latestResult.contest) + 1 : '---'}
                </span>
                {latestResult?.nextEstimatedPrize && (
                  <span className="bg-amber-400 text-gray-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap tabular-nums">
                    R$ {Number(latestResult.nextEstimatedPrize).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs text-purple-100 font-bold block mt-0.5">
                {nextDrawInfo.isToday ? `Hoje às 20h00 • ${nextDrawInfo.timeLeft}` : `${nextDrawInfo.statusBadge} às 20h00`}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Ações: Apenas Faixas de Premiação */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrizeTable(!showPrizeTable)}
              className={`text-xs font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                showPrizeTable 
                  ? 'bg-amber-400 text-gray-950 border-amber-300 ring-2 ring-amber-300' 
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/15'
              }`}
              title="Ver faixas de premiação da Caixa e acertos do bolão"
            >
              <span>🏆</span> {showPrizeTable ? 'Ocultar Faixas' : 'Faixas de Premiação'}
            </button>

            {latestResult?.isManual && (
              <button
                type="button"
                onClick={() => setShowManualResultModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer border border-white/15"
                title="Corrigir resultado manualmente"
              >
                <span>⚙️</span> Corrigir
              </button>
            )}
          </div>
        </div>

        {/* Barra de Navegação Rápida entre Concursos */}
        <div className="bg-black/30 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => handleNavigateContest('prev')}
              disabled={isUpdatingResult || !latestResult?.contest}
              className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 active:scale-95 text-white font-black px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow-sm border border-white/15"
              title="Voltar para o concurso anterior"
            >
              <span className="text-base">◀</span>
              <span>Anterior</span>
            </button>

            <div className="px-3 py-1.5 bg-purple-950/90 rounded-xl border border-purple-400/40 text-center">
              <span className="text-[10px] text-purple-300 block uppercase font-bold tracking-wider">Concurso</span>
              <span className="text-sm font-black text-amber-300">
                #{latestResult?.contest || '---'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateContest('next')}
              disabled={isUpdatingResult || !latestResult?.contest}
              className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 active:scale-95 text-white font-black px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow-sm border border-white/15"
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

        {/* Dezenas Sorteadas */}
        {drawnNumbers.length > 0 ? (
          <div>
            <div className={`${isMegaSena ? 'grid grid-cols-6 sm:flex sm:flex-wrap' : 'grid grid-cols-5 sm:flex sm:flex-wrap'} gap-1.5 sm:gap-2 justify-items-center sm:justify-start`}>
              {drawnNumbers.sort((a, b) => a - b).map(num => (
                <div
                  key={num}
                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-white text-purple-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-md border-2 border-purple-300 tabular-nums"
                >
                  {String(num).padStart(2, '0')}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/10">
              <p className="text-[11px] text-purple-200 flex items-center gap-1.5 leading-snug">
                <span className="shrink-0">✅</span>
                <span>Dezenas sorteadas do Concurso #{latestResult?.contest} conferindo as apostas do bolão.</span>
              </p>

              {latestResult?.contest && (
                <div className="text-[11px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2.5 py-1 rounded-lg font-bold flex flex-wrap items-center justify-between sm:justify-start gap-x-1.5 gap-y-0.5">
                  <span className="whitespace-nowrap">📅 Próximo: <strong>#{Number(latestResult.contest) + 1}</strong></span>
                  {latestResult?.nextEstimatedPrize ? (
                    <span className="text-amber-300 font-extrabold whitespace-nowrap tabular-nums">
                      • R$ {Number(latestResult.nextEstimatedPrize).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* 2. ORDEM SECUNDÁRIA: Tabela / Lista de Apostas do Bolão com Abas (Hoje vs Futuras vs Histórico) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        {/* Abas: Jogos de Hoje vs Apostas Futuras vs Histórico Arquivado */}
        <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-100/80 p-1 gap-1 text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={() => setGamesTab('today')}
            className={`py-2 px-1.5 sm:px-3 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer font-bold whitespace-nowrap ${
              gamesTab === 'today'
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <span>🎯</span>
            <span className="truncate">Hoje ({todayGames.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setGamesTab('future')}
            className={`py-2 px-1.5 sm:px-3 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer font-bold whitespace-nowrap ${
              gamesTab === 'future'
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <span>⏳</span>
            <span className="truncate">Futuras ({futureGames.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setGamesTab('history')}
            className={`py-2 px-1.5 sm:px-3 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer font-bold whitespace-nowrap ${
              gamesTab === 'history'
                ? 'bg-purple-900 text-white shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <span>📜</span>
            <span className="truncate">Histórico ({historyGames.length})</span>
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
                  {gamesTab === 'today' ? `Jogos de Hoje (${filteredGames.length})` : `Apostas Futuras (${filteredGames.length})`}
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
                {onOpenNewGame && canCreateGames && (
                  <button
                    onClick={onOpenNewGame}
                    className="text-xs font-black text-white bg-purple-700 hover:bg-purple-800 border border-purple-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-95"
                    title="Adicionar uma nova aposta de forma manual ou lendo foto do bilhete"
                  >
                    <span>➕</span> Adicionar Aposta
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="text-xs font-bold text-gray-700 hover:text-gray-950 bg-white hover:bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-95"
                  title={areAllExpanded ? "Recolher concursos e focar apenas no sorteio do dia" : "Expandir todos os concursos para ver as apostas completas"}
                >
                  <span>{areAllExpanded ? '🔒 Recolher' : '🔓 Expandir Todos'}</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowVolantesComparator(true)}
                    className="text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95"
                    title="Auditar, varrer e conferir todos os volantes contra os concursos oficiais da Caixa"
                  >
                    <span>🎯</span> Auditor de Apostas
                  </button>
                )}
                <button
                  type="button"
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
            {gamesTab === 'today' ? (
              <div>
                <span className="text-3xl block mb-2">🎯</span>
                <p className="text-gray-800 text-sm font-bold mb-3">
                  Nenhuma aposta cadastrada para o sorteio de hoje {selectedMonthFilter !== 'all' ? `no mês ${selectedMonthFilter}` : ''}.
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {futureGames.length > 0 && (
                    <button
                      onClick={() => setGamesTab('future')}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span>⏳</span> Ver Apostas Futuras ({futureGames.length})
                    </button>
                  )}
                  {onOpenNewGame && canCreateGames && (
                    <button
                      onClick={onOpenNewGame}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span>➕</span> Cadastrar Jogo de Hoje
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
            ) : gamesTab === 'future' ? (
              <div>
                <span className="text-3xl block mb-2">⏳</span>
                <p className="text-gray-800 text-sm font-bold mb-3">
                  Nenhuma aposta futura agendada no momento {selectedMonthFilter !== 'all' ? `no mês ${selectedMonthFilter}` : ''}.
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {onOpenNewGame && (
                    <button
                      onClick={onOpenNewGame}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span>➕</span> Cadastrar Aposta Futura
                    </button>
                  )}
                  {todayGames.length > 0 && (
                    <button
                      onClick={() => setGamesTab('today')}
                      className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-xl border border-purple-300 transition cursor-pointer active:scale-95"
                    >
                      Ver Jogos de Hoje ({todayGames.length})
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
              const isDayGroup = group.isToday || (gamesTab === 'today' && !group.isFuture);
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
                  {/* Cabeçalho do Grupo do Concurso - Layout Estruturado e Responsivo */}
                  <div 
                    onClick={() => toggleGroup(group.key, !!group.isToday, isFirstGroup)}
                    className={`p-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 border-b cursor-pointer select-none transition ${
                      isDayGroup 
                        ? 'bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-950 text-white border-emerald-700/50 hover:brightness-105' 
                        : group.isFuture 
                          ? 'bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 text-white border-blue-700/50 hover:brightness-105' 
                          : 'bg-slate-100 text-gray-800 border-gray-200 hover:bg-slate-200/70'
                    }`}
                    title={isExpanded ? "Clique para recolher este concurso" : "Clique para expandir as apostas deste concurso"}
                  >
                    {/* Linha 1: Status + Título do Concurso + Data */}
                    <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDayGroup ? (
                          <span className="bg-emerald-500 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block"></span>
                            Aposta do Dia
                          </span>
                        ) : group.isTomorrow ? (
                          <span className="bg-amber-400 text-gray-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs whitespace-nowrap">
                            <span>⏳</span> Próximo Sorteio
                          </span>
                        ) : group.isFuture ? (
                          <span className="bg-blue-500 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs whitespace-nowrap">
                            <span>📅</span> Aposta Futura
                          </span>
                        ) : (
                          <span className="bg-gray-300 text-gray-800 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap">
                            <span>📁</span> Histórico
                          </span>
                        )}

                        <span className={`font-black text-base sm:text-lg tracking-tight whitespace-nowrap ${isDayGroup || group.isFuture ? 'text-amber-300' : 'text-purple-950'}`}>
                          {group.contestTitle}
                        </span>
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 whitespace-nowrap tabular-nums ${
                        isDayGroup || group.isFuture
                          ? 'bg-black/25 text-white border border-white/10'
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}>
                        <span>📅</span>
                        <span>{formatAnyDateBR(group.dateStr)}</span>
                      </span>
                    </div>

                    {/* Linha 2: Métricas (Qtd Apostas, Custo, Prêmio) + Botões de Ação */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap ${
                          isDayGroup || group.isFuture 
                            ? 'bg-white/15 text-white border border-white/15' 
                            : 'bg-white text-gray-700 border border-gray-200'
                        }`}>
                          🎟️ {group.games.length} {group.games.length === 1 ? 'aposta' : 'apostas'}
                        </span>

                        {group.totalCost > 0 && (
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap tabular-nums ${
                            isDayGroup || group.isFuture 
                              ? 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/30' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            💰 R$ {group.totalCost.toFixed(2).replace('.', ',')}
                          </span>
                        )}

                        {group.totalPrize > 0 && (
                          <span className="bg-amber-400 text-gray-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 whitespace-nowrap tabular-nums">
                            <span>🎉</span> R$ {group.totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto" onClick={e => e.stopPropagation()}>
                        {!isDayGroup && !group.isFuture && group.contestNumber && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateContest(group.contestNumber!);
                            }}
                            disabled={isUpdatingResult}
                            className={`text-xs font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-40 shadow-xs whitespace-nowrap ${
                              isGroupOfCurrentResult
                                ? 'bg-amber-400 text-gray-950 ring-2 ring-amber-300'
                                : 'bg-purple-900 hover:bg-purple-800 text-white'
                            }`}
                            title={`Conferir resultados do Concurso #${group.contestNumber}`}
                          >
                            <span>{isGroupOfCurrentResult ? '✓ Conferindo' : '🎯 Conferir'}</span>
                          </button>
                        )}

                        {isAdminOrCounselor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const text = encodeURIComponent(
                                `🍀 *BALANÇO DO BOLÃO - ${group.contestTitle}* 🍀\n\n` +
                                `📅 Data: ${formatAnyDateBR(group.dateStr)}\n` +
                                `🎟️ Total de Apostas: ${group.games.length}\n` +
                                `💰 Custo Total: R$ ${group.totalCost.toFixed(2)}\n` +
                                `🏆 Prêmios Ganhos: R$ ${group.totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                                `⭐ Apostas Premiadas: ${group.winningGamesCount}\n\n` +
                                `📊 Confira o balanço completo no aplicativo do Bolão!`
                              );
                              window.open(`https://wa.me/?text=${text}`, '_blank');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="Enviar balanço deste concurso no WhatsApp"
                          >
                            <span>📲</span> WhatsApp
                          </button>
                        )}

                        {canDeleteGames && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupToDelete(group);
                            }}
                            className={`text-xs font-black px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs border whitespace-nowrap ${
                              isDayGroup || group.isFuture
                                ? 'bg-red-600/90 hover:bg-red-500 text-white border-red-400/50'
                                : 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300'
                            }`}
                            title="Excluir todas as apostas cadastradas para este concurso"
                          >
                            <span>🗑️</span> Excluir
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(group.key, !!group.isToday, isFirstGroup);
                          }}
                          className={`text-xs font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap ${
                            isDayGroup || group.isFuture
                              ? 'bg-white text-slate-900 hover:bg-slate-100'
                              : 'bg-purple-900 hover:bg-purple-800 text-white'
                          }`}
                          title={isExpanded ? "Recolher apostas deste concurso" : "Expandir para ver as dezenas"}
                        >
                          <span>{isExpanded ? '▲ Recolher' : `▼ Ver Apostas (${group.games.length})`}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visualização Expandida ou Retraída das Apostas */}
                  {isExpanded ? (() => {
                    const displayLimit = expandedLimits[group.key] || 15;
                    const visibleGames = group.games.slice(0, displayLimit);
                    const hasMore = group.games.length > displayLimit;

                    return (
                      <div className="divide-y divide-gray-100 animate-fadeIn">
                        {visibleGames.map((game: any, gameIndex: number) => {
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
                                {canDeleteGames && (
                                  <button
                                    onClick={() => setDeletingId(game.id)}
                                    className="text-xs text-red-500 hover:text-red-700 p-1 font-bold cursor-pointer"
                                    title="Excluir aposta"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Dezenas do Jogo com Destaque de Acertos */}
                            <div className="mt-2.5">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {game.gameNumbers.sort((a: number, b: number) => a - b).map((num: number) => {
                                  const contestDrawn = Array.isArray(game.contestResultNumbers) ? game.contestResultNumbers : [];
                                  const isHit = !game.isPendingFuture && contestDrawn.includes(num);
                                  return (
                                    <span
                                      key={num}
                                      title={contestDrawn.length === 0 ? `Número ${num} (Aguardando Sorteio)` : (isHit ? `Número ${num} sorteado!` : `Número ${num}`)}
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
                              
                              {!game.isPendingFuture && Array.isArray(game.contestResultNumbers) && game.contestResultNumbers.length > 0 && (
                                <button
                                  onClick={() => setShowVolantesComparator(true)}
                                  className="mt-2.5 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer"
                                >
                                  <span>🔍</span> Detalhar Acertos do Concurso #{game.contestNumber || latestResult?.contest}
                                </button>
                              )}
                            </div>

                            {/* Detalhamento Completo da Premiação e Números */}
                            {!game.isPendingFuture && Array.isArray(game.contestResultNumbers) && game.contestResultNumbers.length > 0 && (
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

                        {hasMore && (
                          <div className="p-3 text-center bg-purple-50/60 border-t border-purple-100">
                            <button
                              type="button"
                              onClick={() => setExpandedLimits(prev => ({ ...prev, [group.key]: group.games.length }))}
                              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <span>⚡</span> Exibir todas as {group.games.length} apostas (mais {group.games.length - displayLimit} restantes)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div 
                      onClick={() => toggleGroup(group.key, !!group.isToday, isFirstGroup)}
                      className="px-4 py-3 bg-slate-50 hover:bg-purple-50/60 cursor-pointer flex items-center justify-between gap-2 text-xs text-slate-700 transition"
                      title="Clique para expandir as dezenas deste concurso"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs shrink-0">🎟️</span>
                        <span>
                          <strong>{group.games.length}</strong> {group.games.length === 1 ? 'aposta pronta para conferência' : 'apostas prontas para conferência'}
                        </span>
                      </div>
                      <span className="font-black text-purple-700 bg-purple-100/80 hover:bg-purple-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 transition">
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

      {/* Modal de Alertas e Notificações dos Sorteios */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="font-black text-base sm:text-lg">Alertas de Sorteio</h3>
                  <p className="text-[11px] text-purple-200">Notificações e Lembretes na Agenda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAlertsModal(false)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-black transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-purple-950 text-sm">Notificações Push no Celular</h4>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    Receba avisos automáticos às 19h30, 20h00 e quando o resultado for publicado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestPushPermission}
                  className={`px-3 py-2 rounded-xl font-black transition cursor-pointer shadow-xs whitespace-nowrap ${
                    pushEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-purple-700 hover:bg-purple-800 text-white'
                  }`}
                >
                  {pushEnabled ? '✓ Ativado' : '🔔 Ativar'}
                </button>
              </div>

              <div className="space-y-2">
                <h5 className="font-black text-gray-700 uppercase tracking-wider text-[11px]">Lembretes de Calendário</h5>
                <button
                  type="button"
                  onClick={handleAddToGoogleCalendar}
                  className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">📅</span>
                    <span>Adicionar ao Google Agenda</span>
                  </span>
                  <span className="text-purple-700 font-black">Adicionar →</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAlertsModal(false)}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
