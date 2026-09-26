import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  RoleType,
  PermissionKey,
  RolePermissionsMatrix,
  DEFAULT_PERMISSIONS_MATRIX
} from './permissions';

interface PermissionsContextValue {
  // Papel real e papel em simulação
  realRole: RoleType;
  effectiveRole: RoleType;
  simulatedRole: RoleType | null;
  setSimulatedRole: (role: RoleType | null) => void;
  isSimulating: boolean;

  // Booleans de conveniência baseados no papel efetivo
  isAdmin: boolean;
  isCounselor: boolean;
  isParticipant: boolean;

  // Verificação de permissões
  can: (key: PermissionKey) => boolean;

  // Matriz completa
  permissions: RolePermissionsMatrix;

  // Ações de gerenciamento (apenas admin real)
  updatePermission: (role: 'counselor' | 'participant', key: PermissionKey, value: boolean) => Promise<void>;
  savePermissions: (newMatrix: RolePermissionsMatrix) => Promise<void>;
  resetToDefaults: () => Promise<void>;

  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

const STORAGE_KEY = 'bolao_permissions_matrix';
const SIMULATED_ROLE_KEY = 'bolao_simulated_role';

function detectUserRole(): RoleType {
  const currentEmail = auth.currentUser?.email;
  if (currentEmail === 'clodas12345@gmail.com') return 'admin';

  try {
    const phoneUserSaved = localStorage.getItem('bolao_phone_user');
    if (phoneUserSaved) {
      const parsed = JSON.parse(phoneUserSaved);
      const phone = parsed?.memberData?.phone || parsed?.sessionUser?.phone || '';
      const email = parsed?.memberData?.email || parsed?.sessionUser?.email || '';
      const uid = parsed?.sessionUser?.uid || '';
      const cleanP = phone.replace(/\D/g, '');

      if (
        email === 'clodas12345@gmail.com' ||
        uid.startsWith('admin_phone_') ||
        cleanP.includes('11953292570') ||
        parsed?.memberData?.role === 'admin'
      ) {
        return 'admin';
      }

      const r = parsed?.memberData?.role;
      if (r === 'counselor' || r === 'conselheiro') return 'counselor';
      return 'participant';
    }
  } catch {}

  try {
    const cachedUser = localStorage.getItem('bolao_cache_user_data');
    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      const email = parsed?.email || '';
      const phone = parsed?.phone || '';
      const cleanP = phone.replace(/\D/g, '');

      if (
        email === 'clodas12345@gmail.com' ||
        cleanP.includes('11953292570') ||
        parsed?.role === 'admin'
      ) {
        return 'admin';
      }

      const r = parsed?.role;
      if (r === 'counselor' || r === 'conselheiro') return 'counselor';
      return 'participant';
    }
  } catch {}

  return 'participant';
}

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [matrix, setMatrix] = useState<RolePermissionsMatrix>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          counselor: { ...DEFAULT_PERMISSIONS_MATRIX.counselor, ...(parsed.counselor || {}) },
          participant: { ...DEFAULT_PERMISSIONS_MATRIX.participant, ...(parsed.participant || {}) }
        };
      }
    } catch {}
    return DEFAULT_PERMISSIONS_MATRIX;
  });

  const [loading, setLoading] = useState(true);

  // Papel do usuário detectado
  const [realRole, setRealRole] = useState<RoleType>(() => detectUserRole());

  // Simulação de papel (apenas permitido se for admin real)
  const [simulatedRole, setSimulatedRoleState] = useState<RoleType | null>(() => {
    try {
      const saved = localStorage.getItem(SIMULATED_ROLE_KEY);
      if (saved === 'counselor' || saved === 'participant') return saved;
    } catch {}
    return null;
  });

  const setSimulatedRole = (role: RoleType | null) => {
    setSimulatedRoleState(role);
    if (role) {
      localStorage.setItem(SIMULATED_ROLE_KEY, role);
    } else {
      localStorage.removeItem(SIMULATED_ROLE_KEY);
    }
  };

  // Escuta permissões do Firestore em tempo real
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'permissions'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const merged: RolePermissionsMatrix = {
          counselor: { ...DEFAULT_PERMISSIONS_MATRIX.counselor, ...(data.counselor || {}) },
          participant: { ...DEFAULT_PERMISSIONS_MATRIX.participant, ...(data.participant || {}) }
        };
        setMatrix(merged);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
      }
      setLoading(false);
    }, (err) => {
      console.warn('[PermissionsContext] Offline ou fallback para cache local:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Monitora alterações na autenticação para atualizar o realRole
  useEffect(() => {
    const checkRole = () => {
      const detected = detectUserRole();
      setRealRole(detected);
    };

    checkRole();
    const interval = setInterval(checkRole, 1500);
    return () => clearInterval(interval);
  }, []);

  // Papel efetivo (considera simulação se o usuário for admin)
  const isActualAdmin = realRole === 'admin';
  const effectiveRole: RoleType = isActualAdmin && simulatedRole ? simulatedRole : realRole;
  const isSimulating = isActualAdmin && !!simulatedRole;

  const isAdmin = effectiveRole === 'admin';
  const isCounselor = effectiveRole === 'counselor';
  const isParticipant = effectiveRole === 'participant';

  // Função central de checagem de permissão
  const can = useMemo(() => {
    return (key: PermissionKey): boolean => {
      // Gestor (admin) real sem simulação tem acesso a tudo
      if (effectiveRole === 'admin') {
        return true;
      }

      if (effectiveRole === 'counselor') {
        return matrix.counselor[key] ?? DEFAULT_PERMISSIONS_MATRIX.counselor[key] ?? false;
      }

      if (effectiveRole === 'participant') {
        return matrix.participant[key] ?? DEFAULT_PERMISSIONS_MATRIX.participant[key] ?? false;
      }

      return false;
    };
  }, [effectiveRole, matrix]);

  // Ações de alteração
  const savePermissions = async (newMatrix: RolePermissionsMatrix) => {
    try {
      await setDoc(doc(db, 'settings', 'permissions'), newMatrix, { merge: true });
      setMatrix(newMatrix);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMatrix));
    } catch (err) {
      console.warn('Erro ao salvar no Firestore, salvando localmente:', err);
      setMatrix(newMatrix);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMatrix));
    }
  };

  const updatePermission = async (role: 'counselor' | 'participant', key: PermissionKey, value: boolean) => {
    const updated = {
      ...matrix,
      [role]: {
        ...matrix[role],
        [key]: value
      }
    };
    await savePermissions(updated);
  };

  const resetToDefaults = async () => {
    await savePermissions(DEFAULT_PERMISSIONS_MATRIX);
  };

  const value: PermissionsContextValue = {
    realRole,
    effectiveRole,
    simulatedRole,
    setSimulatedRole,
    isSimulating,
    isAdmin,
    isCounselor,
    isParticipant,
    can,
    permissions: matrix,
    updatePermission,
    savePermissions,
    resetToDefaults,
    loading
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
