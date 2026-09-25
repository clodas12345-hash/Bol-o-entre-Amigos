import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName, getWhatsAppCobrarUrl, formatPhoneDisplay, normalizeBrazilianPhoneDigits } from '../lib/formatters';
import { usePool } from '../lib/PoolContext';
import { useResponsiveLayout } from '../lib/formatters';

// Helpers de persistência local para contornar problemas de limite de cota do Firestore
const getLocalMembers = (): any[] => {
  try {
    const saved = localStorage.getItem('bolao_local_members');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalMember = (newMember: any) => {
  try {
    const current = getLocalMembers();
    if (!current.some(m => m.id === newMember.id || (newMember.phone && m.phone === newMember.phone))) {
      current.push(newMember);
      localStorage.setItem('bolao_local_members', JSON.stringify(current));
    }
  } catch (err) {
    console.error('Failed to save local member:', err);
  }
};

export default function MembersList() {
  const { setIsQuotaExceeded } = usePool();
  const { isMobile, compactTableClass } = useResponsiveLayout();
  const [members, setMembers] = useState<any[]>([]);
  const [confirmation, setConfirmation] = useState<{ action: () => void, message: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos do formulário de novo membro
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newQuotas, setNewQuotas] = useState<number>(1);
  const [newRole, setNewRole] = useState<'participant' | 'counselor'>('participant');
  const [newNotes, setNewNotes] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'Pago' | 'Pendente'>('Pendente');

  // Estado para modal completo de edição
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editQuotas, setEditQuotas] = useState<number>(1);
  const [editRole, setEditRole] = useState<'participant' | 'counselor'>('participant');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const [usersSnap, membersSnap] = await Promise.all([
        getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'members')).catch(() => ({ docs: [] }))
      ]);

      const usersList: any[] = usersSnap.docs.map(d => ({
        id: d.id,
        collectionName: 'users',
        quotas: 1,
        ...d.data()
      }));
      const membersList: any[] = membersSnap.docs.map(d => ({
        id: d.id,
        collectionName: 'members',
        quotas: 1,
        ...d.data()
      }));

      // Merge de Firestore
      const combined: any[] = [...usersList];
      for (const m of membersList) {
        const alreadyExists = combined.some(u =>
          u.id === m.id ||
          (m.displayName && u.displayName && u.displayName.toLowerCase() === m.displayName.toLowerCase())
        );
        if (!alreadyExists) {
          combined.push(m);
        }
      }

      // Adiciona membros salvos localmente
      const localSaved = getLocalMembers();
      for (const loc of localSaved) {
        const alreadyExists = combined.some(c => c.id === loc.id || (loc.phone && c.phone === loc.phone));
        if (!alreadyExists) {
          combined.push(loc);
        }
      }

      setMembers(combined);
      try {
        localStorage.setItem('bolao_cache_members', JSON.stringify(combined));
      } catch (cacheErr) {
        console.warn('Failed to cache members list in localStorage:', cacheErr);
      }
    } catch (err) {
      console.warn('Error fetching members, loading from local cache:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      
      const cached = localStorage.getItem('bolao_cache_members');
      let combined: any[] = cached ? JSON.parse(cached) : [];
      
      const localSaved = getLocalMembers();
      for (const loc of localSaved) {
        const alreadyExists = combined.some(c => c.id === loc.id || (loc.phone && c.phone === loc.phone));
        if (!alreadyExists) {
          combined.push(loc);
        }
      }
      setMembers(combined);
    }
  };

  const handleOpenEdit = (member: any) => {
    setEditingMember(member);
    setEditName(member.displayName || '');
    setEditPhone(member.phone || '');
    setEditQuotas(Number(member.quotas) > 0 ? Number(member.quotas) : 1);
    setEditRole(member.role === 'counselor' ? 'counselor' : 'participant');
    setEditNotes(member.notes || '');
  };

  const handleCloseEdit = () => {
    setEditingMember(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      addToast('O nome do participante é obrigatório.', 'error');
      return;
    }

    setIsSavingEdit(true);
    const normalizedPhone = editPhone.trim() ? normalizeBrazilianPhoneDigits(editPhone) : '';
    const quotasVal = Math.max(1, Number(editQuotas) || 1);

    if (normalizedPhone) {
      const isDuplicate = members.some(m => m.id !== editingMember.id && normalizeBrazilianPhoneDigits(m.phone || '') === normalizedPhone);
      if (isDuplicate) {
        addToast('Este número de celular já está cadastrado para outro participante!', 'error');
        setIsSavingEdit(false);
        return;
      }
    }

    if (editingMember.isLocalOnly) {
      try {
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === editingMember.id) {
            return {
              ...m,
              displayName: editName.trim(),
              phone: normalizedPhone,
              quotas: quotasVal,
              role: editRole,
              notes: editNotes.trim() || null
            };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(`Cadastro local de "${editName.trim()}" atualizado!`, 'success');
        setEditingMember(null);
        fetchMembers();
      } catch (err) {
        addToast('Erro ao atualizar cadastro local.', 'error');
      } finally {
        setIsSavingEdit(false);
      }
      return;
    }

    try {
      const colName = editingMember.collectionName || 'members';
      await updateDoc(doc(db, colName, editingMember.id), {
        displayName: editName.trim(),
        phone: normalizedPhone,
        quotas: quotasVal,
        role: editRole,
        notes: editNotes.trim() || null,
      });

      addToast(`Cadastro de "${editName.trim()}" atualizado!`, 'success');
      setEditingMember(null);
      fetchMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      if (isQuotaError(error)) {
        setIsQuotaExceeded(true);
        // Atualiza no cache local se falhar no banco por limite de cota
        const local = getLocalMembers();
        const existing = local.find(m => m.id === editingMember.id);
        if (!existing) {
          saveLocalMember({
            ...editingMember,
            displayName: editName.trim(),
            phone: normalizedPhone,
            quotas: quotasVal,
            role: editRole,
            notes: editNotes.trim() || null
          });
        } else {
          const updated = local.map(m => {
            if (m.id === editingMember.id) {
              return {
                ...m,
                displayName: editName.trim(),
                phone: normalizedPhone,
                quotas: quotasVal,
                role: editRole,
                notes: editNotes.trim() || null
              };
            }
            return m;
          });
          localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        }
        addToast('Cadastro atualizado localmente devido ao limite de cota do servidor.', 'success');
        setEditingMember(null);
        fetchMembers();
      } else {
        addToast('Erro ao atualizar dados do membro.', 'error');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleQuickChangeQuotas = async (member: any, delta: number) => {
    const current = Number(member.quotas) || 1;
    const nextVal = Math.max(1, current + delta);
    if (nextVal === current) return;

    if (member.isLocalOnly) {
      try {
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, quotas: nextVal };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(`${formatFirstAndLastName(member.displayName || 'Participante')} agora possui ${nextVal} cota(s).`, 'info');
        fetchMembers();
      } catch (err) {
        addToast('Erro ao atualizar cotas locais.', 'error');
      }
      return;
    }

    try {
      const colName = member.collectionName || 'members';
      await updateDoc(doc(db, colName, member.id), { quotas: nextVal });
      addToast(`${formatFirstAndLastName(member.displayName || 'Participante')} agora possui ${nextVal} cota(s).`, 'info');
      fetchMembers();
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        // Atualiza localmente se falhar por limite de cota
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, quotas: nextVal };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(`${formatFirstAndLastName(member.displayName || 'Participante')} atualizado localmente para ${nextVal} cota(s).`, 'info');
        fetchMembers();
      } else {
        addToast('Erro ao atualizar cotas.', 'error');
      }
    }
  };

  const togglePaymentStatus = async (member: any) => {
    const newStatus = member.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';

    if (member.isLocalOnly) {
      try {
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, paymentStatus: newStatus };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(`Status de pagamento local alterado para "${newStatus}"`, 'info');
        fetchMembers();
      } catch (err) {
        addToast('Erro ao atualizar pagamento local.', 'error');
      }
      return;
    }

    try {
      const colName = member.collectionName || 'members';
      await updateDoc(doc(db, colName, member.id), { paymentStatus: newStatus });
      addToast(`Status de pagamento alterado para "${newStatus}"`, 'info');
      fetchMembers();
    } catch (err) {
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        // Salva alteração localmente
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, paymentStatus: newStatus };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(`Status alterado localmente para "${newStatus}" devido ao limite de cota do servidor.`, 'info');
        fetchMembers();
      }
    }
  };

  const sendWhatsApp = (member: any) => {
    const name = formatFirstAndLastName(member.displayName || 'Participante');
    const quotas = Number(member.quotas) || 1;
    const url = getWhatsAppCobrarUrl(member.phone, name, quotas, 20.00, '11953292570');
    window.open(url, '_blank');
  };

  const toggleApproval = async (member: any) => {
    if (member.isLocalOnly) {
      try {
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, approved: !m.approved };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(member.approved ? 'Aprovação removida do membro local.' : 'Membro local aprovado com sucesso!', 'info');
        fetchMembers();
      } catch (err) {
        addToast('Erro ao aprovar membro local.', 'error');
      }
      return;
    }

    try {
      const colName = member.collectionName || 'members';
      const nextApproved = !member.approved;
      await updateDoc(doc(db, colName, member.id), { approved: nextApproved });
      addToast(nextApproved ? 'Membro aprovado com sucesso!' : 'Aprovação removida.', 'info');
      fetchMembers();
    } catch (err) {
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, approved: !m.approved };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast('Status de aprovação alterado localmente devido ao limite de cota do servidor.', 'info');
        fetchMembers();
      }
    }
  };

  const handleApproveQuotaRequest = async (member: any) => {
    const newQuotasAmount = member.quotaRequest.requestedQuotas;

    if (member.isLocalOnly) {
      try {
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, quotas: newQuotasAmount, quotaRequest: null };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(`Alteração de cotas de "${member.displayName}" aprovada localmente!`, 'success');
        fetchMembers();
      } catch (err) {
        addToast('Erro ao aprovar alteração de cotas local.', 'error');
      }
      return;
    }

    try {
      const colName = member.collectionName || 'members';
      await updateDoc(doc(db, colName, member.id), {
        quotas: newQuotasAmount,
        quotaRequest: null
      });
      addToast(`Alteração de cotas de "${member.displayName}" para ${newQuotasAmount} cotas aprovada!`, 'success');
      fetchMembers();
    } catch (err) {
      addToast('Erro ao aprovar solicitação de cotas.', 'error');
    }
  };

  const handleRejectQuotaRequest = async (member: any) => {
    if (member.isLocalOnly) {
      try {
        const local = getLocalMembers();
        const updated = local.map(m => {
          if (m.id === member.id) {
            return { ...m, quotaRequest: null };
          }
          return m;
        });
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast(`Solicitação de alteração de cotas recusada localmente.`, 'info');
        fetchMembers();
      } catch (err) {
        addToast('Erro ao recusar alteração local.', 'error');
      }
      return;
    }

    try {
      const colName = member.collectionName || 'members';
      await updateDoc(doc(db, colName, member.id), {
        quotaRequest: null
      });
      addToast(`Solicitação de alteração de cotas de "${member.displayName}" recusada.`, 'info');
      fetchMembers();
    } catch (err) {
      addToast('Erro ao recusar solicitação de cotas.', 'error');
    }
  };

  const deleteMember = async (member: any) => {
    if (member.isLocalOnly) {
      try {
        const local = getLocalMembers();
        const updated = local.filter(m => m.id !== member.id);
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast('Membro local removido com sucesso.', 'info');
        fetchMembers();
      } catch (err) {
        addToast('Erro ao remover membro local.', 'error');
      }
      return;
    }

    try {
      const colName = member.collectionName || 'members';
      await deleteDoc(doc(db, colName, member.id));
      addToast('Membro removido com sucesso.', 'info');
      fetchMembers();
    } catch (err) {
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        // Remove do cache local também
        const local = getLocalMembers();
        const updated = local.filter(m => m.id !== member.id);
        localStorage.setItem('bolao_local_members', JSON.stringify(updated));
        addToast('Membro removido localmente devido ao limite de cota do servidor.', 'info');
        fetchMembers();
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) {
      addToast('O nome do participante é obrigatório.', 'error');
      return;
    }

    setIsSubmitting(true);
    const normalizedPhone = newPhone.trim() ? normalizeBrazilianPhoneDigits(newPhone) : '';
    const quotasVal = Math.max(1, Number(newQuotas) || 1);

    const localMemberData = {
      id: 'local_' + Date.now(),
      displayName: newDisplayName.trim(),
      phone: normalizedPhone,
      quotas: quotasVal,
      role: newRole,
      notes: newNotes.trim() || null,
      paymentStatus: newPaymentStatus,
      createdAt: new Date().toISOString(),
      approved: true,
      collectionName: 'members',
      isLocalOnly: true
    };

    if (normalizedPhone) {
      const isDuplicate = members.some(m => normalizeBrazilianPhoneDigits(m.phone || '') === normalizedPhone);
      if (isDuplicate) {
        addToast('Este número de celular já está cadastrado para outro participante!', 'error');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'members'), {
        displayName: newDisplayName.trim(),
        phone: normalizedPhone,
        quotas: quotasVal,
        role: newRole,
        notes: newNotes.trim() || null,
        paymentStatus: newPaymentStatus,
        createdAt: serverTimestamp(),
        approved: true
      });

      addToast(`Participante cadastrado como ${newRole === 'counselor' ? 'Conselheiro' : 'Membro'} com ${quotasVal} cota(s)!`, 'success');
    } catch (error) {
      console.warn('Error adding member to Firebase, fallback to local storage:', error);
      if (isQuotaError(error)) {
        setIsQuotaExceeded(true);
      }
      saveLocalMember(localMemberData);
      addToast(`Salvo localmente no dispositivo (Modo Offline ativo devido ao limite de cota do servidor)!`, 'success');
    } finally {
      setNewDisplayName('');
      setNewPhone('');
      setNewQuotas(1);
      setNewRole('participant');
      setNewNotes('');
      setNewPaymentStatus('Pendente');
      setShowAddForm(false);
      setIsSubmitting(false);
      fetchMembers();
    }
  };

  const approvedMembers = members.filter(m => m.approved === true);
  const pendingJoinRequests = members.filter(m => m.approved === false);
  const pendingQuotaRequests = members.filter(m => m.approved === true && m.quotaRequest && m.quotaRequest.status === 'Pendente');

  const totalMembers = approvedMembers.length;
  const totalQuotas = approvedMembers.reduce((sum, m) => sum + (Number(m.quotas) || 1), 0);
  const paidMembers = approvedMembers.filter(m => m.paymentStatus === 'Pago');
  const paidQuotas = paidMembers.reduce((sum, m) => sum + (Number(m.quotas) || 1), 0);

  return (
    <div className="bg-white p-4 space-y-6 rounded-2xl border border-gray-150 shadow-xs">
      {confirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 text-base mb-2">Confirmação</h3>
            <p className="text-gray-600 text-sm mb-4">{confirmation.message}</p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setConfirmation(null)} 
                className="px-3 py-1.5 rounded text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  confirmation.action();
                  setConfirmation(null);
                }} 
                className="px-4 py-1.5 rounded text-sm text-white bg-red-600 hover:bg-red-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 1: Solicitações de Entrada Pendentes (Aguardando Aprovação) */}
      {pendingJoinRequests.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-red-100 pb-2">
            <span className="text-xl">📢</span>
            <div>
              <h3 className="font-black text-red-950 text-sm">Novas Solicitações de Entrada</h3>
              <p className="text-[10px] text-red-700">Novos participantes que tentaram logar pelo celular e aguardam aprovação</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingJoinRequests.map((req) => (
              <div key={req.id} className="bg-white p-3 rounded-xl border border-red-100 flex items-center justify-between gap-2 shadow-2xs">
                <div>
                  <h4 className="font-black text-gray-900 text-xs">{req.displayName || 'Sem Nome'}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">{formatPhoneDisplay(req.phone || '')}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleApproval(req)}
                    className="px-2.5 py-1.5 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    ✓ Aprovar
                  </button>
                  <button
                    onClick={() => {
                      setConfirmation({
                        action: () => deleteMember(req),
                        message: `Tem certeza que deseja recusar e excluir a solicitação de ${req.displayName}?`
                      });
                    }}
                    className="px-2.5 py-1.5 text-[10px] font-black text-gray-700 bg-gray-100 hover:bg-red-100 hover:text-red-700 rounded-lg transition cursor-pointer"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: Solicitações de Alteração de Cotas */}
      {pendingQuotaRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2">
            <span className="text-xl">🎟️</span>
            <div>
              <h3 className="font-black text-amber-950 text-sm">Solicitações de Alteração de Cotas</h3>
              <p className="text-[10px] text-amber-800">Participantes solicitando aumento ou diminuição de suas cotas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingQuotaRequests.map((m) => (
              <div key={m.id} className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between gap-2 shadow-2xs">
                <div>
                  <h4 className="font-black text-gray-900 text-xs">{m.displayName}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-500 line-through">{m.quotas} cota(s)</span>
                    <span className="text-xs">➔</span>
                    <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {m.quotaRequest.requestedQuotas} cota(s) solicitado
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleApproveQuotaRequest(m)}
                    className="px-2.5 py-1.5 text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    ✓ Aprovar
                  </button>
                  <button
                    onClick={() => handleRejectQuotaRequest(m)}
                    className="px-2.5 py-1.5 text-[10px] font-black text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header com Resumo e Ações */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h2 className="font-bold text-lg text-gray-800">👥 Lista de Contatos do Bolão</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
            <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {totalMembers} participantes ativos
            </span>
            <span className="bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {totalQuotas} cotas ativas
            </span>
            <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {paidQuotas} pagas (R$ {(paidQuotas * 20).toFixed(2).replace('.', ',')})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-sm cursor-pointer"
          >
            {showAddForm ? '✕ Cancelar' : '+ Cadastrar Novo Contato'}
          </button>
        </div>
      </div>

      {/* Formulário Completo de Cadastro de Membro */}
      {showAddForm && (
        <form onSubmit={handleAddMember} className="bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 rounded-xl border border-emerald-200 mb-4 transition-all space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center border-b pb-2 border-emerald-100">
            <h3 className="font-bold text-sm text-emerald-950">📋 Cadastro de Novo Contato no Bolão</h3>
            <span className="text-[10px] text-emerald-700 font-medium">Chave PIX: <strong>11953292570</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                placeholder="Ex: João Silva Santos"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-emerald-600 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Telefone *</label>
              <div className="flex">
                <span className="inline-flex items-center px-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs font-semibold text-gray-700">
                  🇧🇷 +55
                </span>
                <input
                  type="tel"
                  placeholder="ex: 11 99999-8888"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="border border-gray-300 bg-white p-2 rounded-r-lg text-xs w-full focus:outline-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-300">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-amber-950">Quantidade de Cotas *</label>
                <span className="text-[10px] font-black text-amber-800">
                  R$ {(newQuotas * 20).toFixed(2).replace('.', ',')} / mês
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="50"
                value={newQuotas}
                onChange={(e) => setNewQuotas(Math.max(1, Number(e.target.value)))}
                className="border border-amber-300 bg-white p-1.5 rounded-lg text-xs font-black text-amber-950 w-full focus:outline-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Função no Grupo *</label>
              <select
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-emerald-600 font-semibold"
              >
                <option value="participant">👥 Membro</option>
                <option value="counselor">🛡️ Conselheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status de Pagamento Inicial</label>
              <select
                value={newPaymentStatus}
                onChange={(e: any) => setNewPaymentStatus(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-emerald-600 font-semibold"
              >
                <option value="Pendente">⚠️ Pendente</option>
                <option value="Pago">✓ Pago (Em Dia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Observações (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Paga todo dia 10..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-emerald-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Cadastrando...' : `Cadastrar Participante (${newQuotas} cota${newQuotas > 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Membros com Cotas */}
      <div className="overflow-x-auto rounded-xl border border-gray-150">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700 text-[11px] uppercase tracking-wider border-b">
              <th className="p-3 text-left">Participante</th>
              <th className="p-3 text-center">Função</th>
              <th className="p-3 text-center">Cotas</th>
              <th className="p-3 text-center">Valor Mensal</th>
              <th className="p-3 text-center">Pagamento</th>
              <th className="p-3 text-center font-bold">Status</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {approvedMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400 italic font-medium">
                  Nenhum contato cadastrado no momento.
                </td>
              </tr>
            ) : (
              approvedMembers.map((member) => {
                const quotas = Number(member.quotas) > 0 ? Number(member.quotas) : 1;
                const isPaid = member.paymentStatus === 'Pago';
                const monthlyValue = quotas * 20.00;

                return (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3">
                      <div className="font-bold text-gray-900">
                        {member.displayName || 'Sem Nome'}
                        {member.isLocalOnly && (
                          <span className="ml-1.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase">
                            Dispositivo
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">
                        {formatPhoneDisplay(member.phone || '')}
                      </div>
                      {member.notes && (
                        <div className="text-[9px] text-gray-400 italic mt-0.5 max-w-xs truncate">
                          💡 {member.notes}
                        </div>
                      )}
                    </td>
                    
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        member.role === 'counselor' 
                          ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {member.role === 'counselor' ? '🛡️ Conselheiro' : '👥 Membro'}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleQuickChangeQuotas(member, -1)}
                          className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded flex items-center justify-center text-xs font-bold border cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-black text-gray-800 min-w-4 text-center">
                          {quotas}
                        </span>
                        <button
                          onClick={() => handleQuickChangeQuotas(member, 1)}
                          className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded flex items-center justify-center text-xs font-bold border cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="p-3 text-center font-bold text-gray-800">
                      R$ {monthlyValue.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => togglePaymentStatus(member)}
                        className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        }`}
                      >
                        {member.paymentStatus || 'Pendente'}
                      </button>
                    </td>

                    <td className="p-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        member.approved 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {member.approved ? 'Ativo' : 'Pendente'}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Editar Cadastro"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => sendWhatsApp(member)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Cobrar via WhatsApp"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => {
                            setConfirmation({
                              action: () => deleteMember(member),
                              message: `Excluir definitivamente o participante ${member.displayName}?`
                            });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-gray-900 text-sm">✏️ Editar Cadastro de Contato</h3>
              <button onClick={handleCloseEdit} className="text-gray-400 hover:text-gray-700 font-bold text-lg p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs font-semibold focus:outline-emerald-600 bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  placeholder="ex: 11 99999-8888"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-emerald-600 bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cotas Cadastradas</label>
                  <input
                    type="number"
                    min="1"
                    value={editQuotas}
                    onChange={(e) => setEditQuotas(Math.max(1, Number(e.target.value)))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-black focus:outline-emerald-600 bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Função no Grupo</label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-semibold focus:outline-emerald-600 bg-gray-50"
                  >
                    <option value="participant">👥 Membro</option>
                    <option value="counselor">🛡️ Conselheiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-emerald-600 bg-gray-50"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
