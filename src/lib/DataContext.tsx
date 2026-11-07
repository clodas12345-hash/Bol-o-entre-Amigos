import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db, isQuotaError } from './firebase';
import { usePool } from './PoolContext';
import { usePermissions } from './PermissionsContext';
import { useToast } from '../components/NotificationManager';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [games, setGames] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_games');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [members, setMembers] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_members');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [lotofacilResults, setLotofacilResults] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_results_lotofacil');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [megasenaResults, setMegasenaResults] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_results_megasena');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [payments, setPayments] = useState<any[]>(() => {
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

  // 1. Monitoramento de JOGOS (Geral ou por Pool)
  useEffect(() => {
    if (!userId) return;
    
    setIsSyncing(true);
    // Busca até 5000 jogos para garantir histórico completo no APK
    const qGames = query(collection(db, 'games'), limit(5000));
    
    const unsubGames = onSnapshot(qGames, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGames(list);
      setGamesReady(true);
      setIsSyncing(false);
      
      // Cache local para persistência no APK (Primeiros 1000 itens)
      try {
        localStorage.setItem('bolao_cache_games', JSON.stringify(list.slice(0, 1000)));
      } catch {}
    }, (err) => {
      console.warn('[Sync] Erro ao sincronizar jogos:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });

    return () => unsubGames();
  }, [userId]);

  // 2. Monitoramento de MEMBROS e USUÁRIOS
  useEffect(() => {
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
      usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateCombined();
    });

    const unsubMembers = onSnapshot(collection(db, 'members'), (mSnap) => {
      membersData = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateCombined();
    });

    return () => {
      unsubUsers();
      unsubMembers();
    };
  }, [userId]);

  // 3. Monitoramento de RESULTADOS (Lotofácil e Mega-Sena)
  useEffect(() => {
    if (!userId) return;

    const qLoto = query(collection(db, 'lotofacil_results'), orderBy('contest', 'desc'), limit(150));
    const unsubLoto = onSnapshot(qLoto, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLotofacilResults(list);
      try {
        localStorage.setItem('bolao_cache_results_lotofacil', JSON.stringify(list));
        if (list.length > 0) {
          localStorage.setItem('bolao_cache_latest_result', JSON.stringify(list[0]));
        }
      } catch {}
    });

    const qMega = query(collection(db, 'megasena_results'), orderBy('contest', 'desc'), limit(150));
    const unsubMega = onSnapshot(qMega, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMegasenaResults(list);
      try {
        localStorage.setItem('bolao_cache_results_megasena', JSON.stringify(list));
      } catch {}
    });

    return () => {
      unsubLoto();
      unsubMega();
    };
  }, [userId]);

  // 4. Monitoramento de PAGAMENTOS
  useEffect(() => {
    if (!userId) return;

    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(1000));
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

  const value = {
    games,
    members,
    payments,
    lotofacilResults,
    megasenaResults,
    latestLotofacil,
    latestMegasena,
    isSyncing,
    gamesReady
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
