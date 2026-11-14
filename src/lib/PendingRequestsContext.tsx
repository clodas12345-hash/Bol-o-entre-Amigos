import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isNativeApk } from './firebase';
import { normalizeBrazilianPhoneDigits } from './formatters';

export interface PendingMember {
  id: string;
  uid?: string;
  email?: string;
  displayName?: string;
  phone?: string;
  approved?: boolean;
  rejected?: boolean;
  status?: string;
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
  const [localVersion, setLocalVersion] = useState(0);

  const refresh = useCallback(() => {
    setLocalVersion(v => v + 1);
  }, []);

  useEffect(() => {
    const handleMembersUpdated = () => setLocalVersion(v => v + 1);
    window.addEventListener('bolao-members-updated', handleMembersUpdated);
    window.addEventListener('storage', handleMembersUpdated);
    return () => {
      window.removeEventListener('bolao-members-updated', handleMembersUpdated);
      window.removeEventListener('storage', handleMembersUpdated);
    };
  }, []);

  // Escuta em tempo real coleções 'users' e 'members'
  useEffect(() => {
    if (!isNativeApk) {
      setUsersList([]);
      setMembersList([]);
      setLoading(false);
      return;
    }

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

  // Mescla com os salvos localmente e remove recusas persistidas
  const allMembers = useMemo(() => {
    const rejectedSet = new Set<string>();
    if (isNativeApk) {
      try {
        const rawRej = localStorage.getItem('bolao_rejected_join_ids');
        if (rawRej) {
          const parsedRej = JSON.parse(rawRej);
          if (Array.isArray(parsedRej)) {
            parsedRej.forEach((id: any) => {
              if (id) rejectedSet.add(String(id));
            });
          }
        }
      } catch {}
    }

    const isSameMember = (a: PendingMember, b: PendingMember) => {
      if (a.id === b.id || (b.uid && (a.id === b.uid || a.uid === b.uid))) return true;
      if (b.email && a.email && b.email.trim().toLowerCase() === a.email.trim().toLowerCase()) return true;
      const phoneA = normalizeBrazilianPhoneDigits(a.phone || '');
      const phoneB = normalizeBrazilianPhoneDigits(b.phone || '');
      if (phoneA && phoneB && phoneA === phoneB) return true;
      return false;
    };

    const combined: PendingMember[] = [...usersList];

    for (const m of membersList) {
      if (!combined.some(u => isSameMember(u, m))) {
        combined.push(m);
      }
    }

    if (isNativeApk) {
      try {
        const localSaved = localStorage.getItem('bolao_local_members');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            for (const loc of parsed) {
              if (!combined.some(c => isSameMember(c, loc))) {
                combined.push(loc);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao ler bolao_local_members:', err);
      }
    }

    return combined.filter(
      (m: any) => !rejectedSet.has(m.id) && m.rejected !== true && m.status !== 'recusado'
    );
  }, [usersList, membersList, localVersion]);

  // Solicitações de novos membros aguardando aprovação
  const pendingJoinRequests = useMemo(() => {
    return allMembers.filter(
      (m: any) =>
        m.approved === false &&
        m.rejected !== true &&
        m.active !== false &&
        m.archived !== true &&
        m.status !== 'inativo' &&
        m.status !== 'recusado'
    );
  }, [allMembers]);

  // Solicitações de alteração de cotas
  const pendingQuotaRequests = useMemo(() => {
    return allMembers.filter(
      (m: any) =>
        m.approved !== false &&
        m.rejected !== true &&
        m.active !== false &&
        m.archived !== true &&
        m.status !== 'inativo' &&
        m.status !== 'recusado' &&
        m.quotaRequest &&
        m.quotaRequest.status === 'Pendente'
    );
  }, [allMembers]);

  // Membros ativos com pagamento pendente
  const unpaidMembers = useMemo(() => {
    return allMembers.filter(
      (m: any) =>
        m.approved !== false &&
        m.rejected !== true &&
        m.active !== false &&
        m.archived !== true &&
        m.status !== 'inativo' &&
        m.status !== 'recusado' &&
        m.paymentStatus === 'Pendente'
    );
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
        refresh
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
