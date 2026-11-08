import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db, isQuotaError, isNativeApk } from './firebase';
import { usePool } from './PoolContext';
import { usePermissions } from './PermissionsContext';
import { useToast } from '../components/NotificationManager';

export interface CollectionCapacity {
  key: string;
  name: string;
  count: number;
  maxLimit: number;
  percentage: number;
}

export interface CapacityStatus {
  isNearLimit: boolean;
  maxLimit: number;
  collections: CollectionCapacity[];
  warningMessage: string | null;
}

interface DataContextType {
  games: any[];
  members: any[];
  payments: any[];
  lotofacilResults: any[];
  megasenaResults: any[];
  latestLotofacil: any | null;
  latestMegasena: any | null;
  isSyncing: boolean;
  gamesReady: boolean;
  capacityStatus: CapacityStatus;
}

const MAX_STORAGE_LIMIT = 10000;

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [games, setGames] = useState<any[]>(() => {
    if (!isNativeApk) {
      // Regra estrita: Preview nunca acessa banco nem dados locais.
      try {
        localStorage.removeItem('bolao_cache_games');
        localStorage.removeItem('bolao_cache_members');
        localStorage.removeItem('bolao_cache_results_lotofacil');
        localStorage.removeItem('bolao_cache_results_megasena');
        localStorage.removeItem('bolao_cache_payments');
        localStorage.removeItem('bolao_cache_latest_result');
      } catch {}
      return [];
    }
    try {
      const cached = localStorage.getItem('bolao_cache_games');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [members, setMembers] = useState<any[]>(() => {
    if (!isNativeApk) return [];
    try {
      const cached = localStorage.getItem('bolao_cache_members');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [lotofacilResults, setLotofacilResults] = useState<any[]>(() => {
    if (!isNativeApk) return [];
    try {
      const cached = localStorage.getItem('bolao_cache_results_lotofacil');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [megasenaResults, setMegasenaResults] = useState<any[]>(() => {
    if (!isNativeApk) return [];
    try {
      const cached = localStorage.getItem('bolao_cache_results_megasena');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [payments, setPayments] = useState<any[]>(() => {
    if (!isNativeApk) return [];
    try {
      const cached = localStorage.getItem('bolao_cache_payments');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [gamesReady, setGamesReady] = useState(false);
  
  const { activePool, setIsQuotaExceeded } = usePool();
  const { isAdmin } = usePermissions();
  const { addToast } = useToast();

  // 1. Monitoramento de JOGOS (Geral ou por Pool) - LIMITE 10.000
  useEffect(() => {
    if (!isNativeApk) {
      setGames([]);
      setGamesReady(true);
      setIsSyncing(false);
      return;
    }
    if (!userId) return;
    
    setIsSyncing(true);
    const qGames = query(collection(db, 'games'), limit(MAX_STORAGE_LIMIT));
    
    const unsubGames = onSnapshot(qGames, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGames(list);
      setGamesReady(true);
      setIsSyncing(false);
      
      // Cache local para persistência no APK (Até 2500 itens)
      try {
        localStorage.setItem('bolao_cache_games', JSON.stringify(list.slice(0, 2500)));
      } catch {}
    }, (err) => {
      console.warn('[Sync] Erro ao sincronizar jogos:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });

    return () => unsubGames();
  }, [userId]);

  // 2. Monitoramento de MEMBROS e USUÁRIOS
  useEffect(() => {
    if (!isNativeApk) {
      setMembers([]);
      return;
    }
    if (!userId) return;

    let usersData: any[] = [];
    let membersData: any[] = [];

    const updateCombined = () => {
      const unificada = [...usersData];
      membersData.forEach(m => {
        if (!unificada.some(u => u.id === m.id || (m.email && u.email === m.email))) {
          unificada.push(m);
        }
      });

      unificada.sort((a, b) => {
        const nameA = (a.displayName || a.name || a.email || '').trim();
        const nameB = (b.displayName || b.name || b.email || '').trim();
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      });

      setMembers(unificada);
      try {
        localStorage.setItem('bolao_cache_members', JSON.stringify(unificada));
      } catch {}
    };

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      usersData = snap.docs.map(d => ({ id: d.id, collectionName: 'users', ...d.data() }));
      updateCombined();
    }, (err) => {
      console.warn('[Sync] Offline/Timeout users snapshot fallback:', err);
    });

    const unsubMembers = onSnapshot(collection(db, 'members'), (mSnap) => {
      membersData = mSnap.docs.map(d => ({ id: d.id, collectionName: 'members', ...d.data() }));
      updateCombined();
    }, (err) => {
      console.warn('[Sync] Offline/Timeout members snapshot fallback:', err);
    });

    return () => {
      unsubUsers();
      unsubMembers();
    };
  }, [userId]);

  // 3. Monitoramento de RESULTADOS (Lotofácil e Mega-Sena) - LIMITE 10.000
  useEffect(() => {
    if (!userId) return;

    const qLoto = query(collection(db, 'lotofacil_results'), orderBy('contest', 'desc'), limit(MAX_STORAGE_LIMIT));
    const unsubLoto = onSnapshot(qLoto, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLotofacilResults(list);
      try {
        localStorage.setItem('bolao_cache_results_lotofacil', JSON.stringify(list));
        if (list.length > 0) {
          localStorage.setItem('bolao_cache_latest_result', JSON.stringify(list[0]));
        }
      } catch {}
    }, (err) => {
      console.warn('[Sync] Offline/Timeout lotofacil_results snapshot fallback:', err);
    });

    const qMega = query(collection(db, 'megasena_results'), orderBy('contest', 'desc'), limit(MAX_STORAGE_LIMIT));
    const unsubMega = onSnapshot(qMega, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMegasenaResults(list);
      try {
        localStorage.setItem('bolao_cache_results_megasena', JSON.stringify(list));
      } catch {}
    }, (err) => {
      console.warn('[Sync] Offline/Timeout megasena_results snapshot fallback:', err);
    });

    return () => {
      unsubLoto();
      unsubMega();
    };
  }, [userId]);

  // 4. Monitoramento de PAGAMENTOS - LIMITE 10.000
  useEffect(() => {
    if (!isNativeApk) {
      setPayments([]);
      return;
    }
    if (!userId) return;

    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(MAX_STORAGE_LIMIT));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPayments(list);
      try {
        localStorage.setItem('bolao_cache_payments', JSON.stringify(list));
      } catch {}
    }, (err) => {
      console.warn('[Sync] Erro ao sincronizar pagamentos:', err);
    });

    return () => unsubPayments();
  }, [userId]);

  const latestLotofacil = useMemo(() => lotofacilResults[0] || null, [lotofacilResults]);
  const latestMegasena = useMemo(() => megasenaResults[0] || null, [megasenaResults]);

  // Cálculo do Status de Capacidade (Monitor de Limite de 10.000)
  const capacityStatus: CapacityStatus = useMemo(() => {
    const collections: CollectionCapacity[] = [
      { key: 'games', name: 'Jogos e Apostas', count: games.length, maxLimit: MAX_STORAGE_LIMIT, percentage: Math.round((games.length / MAX_STORAGE_LIMIT) * 100) },
      { key: 'lotofacil', name: 'Resultados Lotofácil', count: lotofacilResults.length, maxLimit: MAX_STORAGE_LIMIT, percentage: Math.round((lotofacilResults.length / MAX_STORAGE_LIMIT) * 100) },
      { key: 'megasena', name: 'Resultados Mega-Sena', count: megasenaResults.length, maxLimit: MAX_STORAGE_LIMIT, percentage: Math.round((megasenaResults.length / MAX_STORAGE_LIMIT) * 100) },
      { key: 'payments', name: 'Comprovantes e Pagamentos', count: payments.length, maxLimit: MAX_STORAGE_LIMIT, percentage: Math.round((payments.length / MAX_STORAGE_LIMIT) * 100) },
    ];

    const nearLimitList = collections.filter(c => c.percentage >= 80);
    const isNearLimit = nearLimitList.length > 0;

    let warningMessage: string | null = null;
    if (isNearLimit) {
      const highest = nearLimitList.sort((a, b) => b.percentage - a.percentage)[0];
      warningMessage = `⚠️ Alerta de Capacidade: A coleção de "${highest.name}" atingiu ${highest.percentage}% da capacidade (${highest.count} de 10.000). Quando estiver enchendo, solicite no chat para liberar mais limite de armazenamento!`;
    }

    return {
      isNearLimit,
      maxLimit: MAX_STORAGE_LIMIT,
      collections,
      warningMessage
    };
  }, [games.length, lotofacilResults.length, megasenaResults.length, payments.length]);

  // Alerta via Toast para Administradores quando atinge >= 80% do limite de 10k
  useEffect(() => {
    if (!isAdmin || !capacityStatus.isNearLimit || !capacityStatus.warningMessage) return;

    const lastNotified = localStorage.getItem('bolao_capacity_warning_notified');
    const todayStr = new Date().toDateString();

    if (lastNotified !== todayStr) {
      addToast(capacityStatus.warningMessage, 'warning');
      localStorage.setItem('bolao_capacity_warning_notified', todayStr);
    }
  }, [isAdmin, capacityStatus]);

  const value = {
    games,
    members,
    payments,
    lotofacilResults,
    megasenaResults,
    latestLotofacil,
    latestMegasena,
    isSyncing,
    gamesReady,
    capacityStatus
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
