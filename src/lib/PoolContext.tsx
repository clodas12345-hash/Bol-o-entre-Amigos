import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isQuotaError } from './firebase';

export interface Pool {
  id: string;
  name: string;
  description?: string;
  type: 'monthly' | 'special' | 'daily';
  lotteryType?: 'lotofacil' | 'megasena';
  active: boolean;
  createdAt: any;
}

interface PoolContextType {
  pools: Pool[];
  activePool: Pool;
  setActivePoolId: (id: string) => void;
  loading: boolean;
  ensureDefaultPool: () => Promise<string>;
  isQuotaExceeded: boolean;
  setIsQuotaExceeded: (val: boolean) => void;
}

const DEFAULT_POOL: Pool = {
  id: 'default_lotofacil_pool',
  name: 'Bolão Principal - Lotofácil',
  description: 'Bolão oficial da Lotofácil',
  type: 'monthly',
  lotteryType: 'lotofacil',
  active: true,
  createdAt: new Date()
};

const PoolContext = createContext<PoolContextType | undefined>(undefined);

export function PoolProvider({ children }: { children: React.ReactNode }) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [activePoolId, setActivePoolId] = useState<string | null>(localStorage.getItem('activePoolId'));
  const [loading, setLoading] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Helper para criar ou garantir bolão inicial caso não haja nenhum no banco
  const ensureDefaultPool = async (): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'pools'), {
        name: 'Bolão Principal - Lotofácil',
        description: 'Bolão oficial da Lotofácil',
        type: 'monthly',
        lotteryType: 'lotofacil',
        active: true,
        createdAt: serverTimestamp()
      });
      setActivePoolId(docRef.id);
      localStorage.setItem('activePoolId', docRef.id);
      return docRef.id;
    } catch (e) {
      console.warn('Erro ao criar bolão padrão no Firestore:', e);
      if (isQuotaError(e)) setIsQuotaExceeded(true);
      return DEFAULT_POOL.id;
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'pools'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const poolsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pool));
      setPools(poolsList);
      
      if (poolsList.length > 0) {
        // Se o pool ativo salvo não existir na lista, escolhe o primeiro ativo
        const found = poolsList.find(p => p.id === activePoolId);
        if (!found) {
          const firstActive = poolsList.find(p => p.active) || poolsList[0];
          setActivePoolId(firstActive.id);
          localStorage.setItem('activePoolId', firstActive.id);
        }
      } else {
        // Se a coleção estiver vazia, cria o primeiro bolão automaticamente no Firestore
        await ensureDefaultPool();
      }
      setLoading(false);
    }, (error) => {
      console.warn('Erro ao escutar coleção de pools:', error);
      if (isQuotaError(error)) setIsQuotaExceeded(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetActivePoolId = (id: string) => {
    setActivePoolId(id);
    localStorage.setItem('activePoolId', id);
  };

  // Garante que activePool SEMPRE seja um objeto válido e nunca null
  const activePool: Pool =
    pools.find(p => p.id === activePoolId) ||
    pools.find(p => p.active) ||
    pools[0] ||
    DEFAULT_POOL;

  return (
    <PoolContext.Provider value={{ pools, activePool, setActivePoolId: handleSetActivePoolId, loading, ensureDefaultPool, isQuotaExceeded, setIsQuotaExceeded }}>
      {children}
    </PoolContext.Provider>
  );
}

export function usePool() {
  const context = useContext(PoolContext);
  if (context === undefined) {
    throw new Error('usePool must be used within a PoolProvider');
  }
  return context;
}
