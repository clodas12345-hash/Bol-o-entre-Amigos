import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface PendingMember {
  id: string;
  displayName?: string;
  phone?: string;
  approved?: boolean;
  role?: string;
  quotas?: number;
  paymentStatus?: string;
  quotaRequest?: {
    requestedQuotas: number;
    status: string;
    requestedAt?: string;
  };
  collectionName?: 'users' | 'members';
  isLocalOnly?: boolean;
}

interface PendingRequestsContextType {
  allMembers: PendingMember[];
  pendingJoinRequests: PendingMember[];
  pendingQuotaRequests: PendingMember[];
  unpaidMembers: PendingMember[];
  totalPendingCount: number;
  loading: boolean;
  refresh: () => void;
}

const PendingRequestsContext = createContext<PendingRequestsContextType | undefined>(undefined);

export function PendingRequestsProvider({ children }: { children: ReactNode }) {
  const [usersList, setUsersList] = useState<PendingMember[]>([]);
  const [membersList, setMembersList] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuta em tempo real coleções 'users' e 'members'
  useEffect(() => {
    let unsubUsers = () => {};
    let unsubMembers = () => {};

    try {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          collectionName: 'users' as const,
          quotas: 1,
          ...doc.data()
        })) as PendingMember[];
        setUsersList(list);
        setLoading(false);
      }, (err) => {
        console.warn('Erro ao escutar users para pedidos pendentes:', err);
        setLoading(false);
      });
    } catch (e) {
      console.warn('Falha no snapshot de users:', e);
    }

    try {
      unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          collectionName: 'members' as const,
          quotas: 1,
          ...doc.data()
        })) as PendingMember[];
        setMembersList(list);
        setLoading(false);
      }, (err) => {
        console.warn('Erro ao escutar members para pedidos pendentes:', err);
        setLoading(false);
      });
    } catch (e) {
      console.warn('Falha no snapshot de members:', e);
    }

    return () => {
      unsubUsers();
      unsubMembers();
    };
  }, []);

  // Mescla com os salvos localmente
  const allMembers = useMemo(() => {
    const combined: PendingMember[] = [...usersList];
    
    for (const m of membersList) {
      const alreadyExists = combined.some(u =>
        u.id === m.id ||
        (m.displayName && u.displayName && u.displayName.toLowerCase() === m.displayName.toLowerCase())
      );
      if (!alreadyExists) {
        combined.push(m);
      }
    }

    try {
      const localSaved = localStorage.getItem('bolao_local_members');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed)) {
          for (const loc of parsed) {
            const alreadyExists = combined.some(c => c.id === loc.id || (loc.phone && c.phone === loc.phone));
            if (!alreadyExists) {
              combined.push(loc);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao ler bolao_local_members:', err);
    }

    return combined;
  }, [usersList, membersList]);

  // Solicitações de novos membros aguardando aprovação
  const pendingJoinRequests = useMemo(() => {
    return allMembers.filter(m => m.approved === false);
  }, [allMembers]);

  // Solicitações de alteração de cotas
  const pendingQuotaRequests = useMemo(() => {
    return allMembers.filter(m => m.approved !== false && m.quotaRequest && m.quotaRequest.status === 'Pendente');
  }, [allMembers]);

  // Membros ativos com pagamento pendente
  const unpaidMembers = useMemo(() => {
    return allMembers.filter(m => m.approved !== false && m.paymentStatus === 'Pendente');
  }, [allMembers]);

  const totalPendingCount = pendingJoinRequests.length + pendingQuotaRequests.length;

  return (
    <PendingRequestsContext.Provider
      value={{
        allMembers,
        pendingJoinRequests,
        pendingQuotaRequests,
        unpaidMembers,
        totalPendingCount,
        loading,
        refresh: () => {}
      }}
    >
      {children}
    </PendingRequestsContext.Provider>
  );
}

export function usePendingRequests() {
  const context = useContext(PendingRequestsContext);
  if (!context) {
    throw new Error('usePendingRequests deve ser utilizado dentro de um PendingRequestsProvider');
  }
  return context;
}
