import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName, getWhatsAppCobrarUrl, formatPhoneDisplay, normalizeBrazilianPhoneDigits } from '../lib/formatters';
import { usePool } from '../lib/PoolContext';
import { useResponsiveLayout } from '../lib/formatters';

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
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'members'))
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

      // Merge evitando duplicados
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

      setMembers(combined);
      try {
        localStorage.setItem('bolao_cache_members', JSON.stringify(combined));
      } catch (cacheErr) {
        console.warn('Failed to cache members list in localStorage:', cacheErr);
      }
    } catch (err) {
      console.warn('Error fetching members, loading from local cache:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      try {
        const cached = localStorage.getItem('bolao_cache_members');
        if (cached) {
          setMembers(JSON.parse(cached));
        }
      } catch (cacheErr) {
        console.error('Failed to parse cached members in fetchMembers:', cacheErr);
      }
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
    try {
      const colName = editingMember.collectionName || 'users';
      const normalizedPhone = editPhone.trim() ? normalizeBrazilianPhoneDigits(editPhone) : '';
      
      if (normalizedPhone) {
        const isDuplicate = members.some(m => m.id !== editingMember.id && normalizeBrazilianPhoneDigits(m.phone || '') === normalizedPhone);
        if (isDuplicate) {
          addToast('Este número de celular já está cadastrado para outro participante! 1 número por acesso.', 'error');
          setIsSavingEdit(false);
          return;
        }
      }

      const quotasVal = Math.max(1, Number(editQuotas) || 1);

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
        addToast('Limite de cota atingido no banco.', 'error');
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

    try {
      const colName = member.collectionName || 'users';
      await updateDoc(doc(db, colName, member.id), { quotas: nextVal });
      addToast(`${formatFirstAndLastName(member.displayName || 'Participante')} agora possui ${nextVal} cota(s).`, 'info');
      fetchMembers();
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        addToast('Limite de cota atingido.', 'error');
      } else {
        addToast('Erro ao atualizar cotas.', 'error');
      }
    }
  };

  const togglePaymentStatus = async (member: any) => {
    const newStatus = member.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';
    const colName = member.collectionName || 'users';
    await updateDoc(doc(db, colName, member.id), { paymentStatus: newStatus });
    addToast(`Status de pagamento alterado para "${newStatus}"`, 'info');
    fetchMembers();
  };

  const sendWhatsApp = (member: any) => {
    const name = formatFirstAndLastName(member.displayName || 'Participante');
    const quotas = Number(member.quotas) || 1;
    const url = getWhatsAppCobrarUrl(member.phone, name, quotas, 20.00, '11953292570');
    window.open(url, '_blank');
  };

  const toggleApproval = async (member: any) => {
    const colName = member.collectionName || 'users';
    const nextApproved = !member.approved;
    await updateDoc(doc(db, colName, member.id), { approved: nextApproved });
    addToast(nextApproved ? 'Membro aprovado com sucesso!' : 'Aprovação removida.', 'info');
    fetchMembers();
  };

  const handleApproveQuotaRequest = async (member: any) => {
    try {
      const colName = member.collectionName || 'users';
      const newQuotasAmount = member.quotaRequest.requestedQuotas;
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
    try {
      const colName = member.collectionName || 'users';
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
    const colName = member.collectionName || 'users';
    await deleteDoc(doc(db, colName, member.id));
    addToast('Membro removido com sucesso.', 'info');
    fetchMembers();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) {
      addToast('O nome do participante é obrigatório.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedPhone = newPhone.trim() ? normalizeBrazilianPhoneDigits(newPhone) : '';
      
      if (normalizedPhone) {
        const isDuplicate = members.some(m => normalizeBrazilianPhoneDigits(m.phone || '') === normalizedPhone);
        if (isDuplicate) {
          addToast('Este número de celular já está cadastrado para outro participante! 1 número por acesso.', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      const quotasVal = Math.max(1, Number(newQuotas) || 1);

      await addDoc(collection(db, 'users'), {
        displayName: newDisplayName.trim(),
        phone: normalizedPhone,
        quotas: quotasVal,
        role: newRole,
        notes: newNotes.trim() || null,
        paymentStatus: newPaymentStatus,
        createdAt: serverTimestamp(),
        approved: true
      });

      setNewDisplayName('');
      setNewPhone('');
      setNewQuotas(1);
      setNewRole('participant');
      setNewNotes('');
      setNewPaymentStatus('Pendente');
      setShowAddForm(false);

      addToast(`Participante cadastrado como ${newRole === 'counselor' ? 'Conselheiro' : 'Membro'} com ${quotasVal} cota(s)!`, 'success');
      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      if (isQuotaError(error)) {
        setIsQuotaExceeded(true);
        addToast('Limite de cota atingido no banco.', 'error');
      } else {
        addToast('Erro ao cadastrar membro.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Separação de Listas de Membros, Entrada Pendente e Quotas Pendentes
  const approvedMembers = members.filter(m => m.approved === true);
  const pendingJoinRequests = members.filter(m => m.approved === false);
  const pendingQuotaRequests = members.filter(m => m.approved === true && m.quotaRequest && m.quotaRequest.status === 'Pendente');

  const totalMembers = approvedMembers.length;
  const totalQuotas = approvedMembers.reduce((sum, m) => sum + (Number(m.quotas) || 1), 0);
  const paidMembers = approvedMembers.filter(m => m.paymentStatus === 'Pago');
  const paidQuotas = paidMembers.reduce((sum, m) => sum + (Number(m.quotas) || 1), 0);

  return (
    <div className="bg-white p-4 space-y-6 rounded-2xl border border-gray-150 shadow-xs">
      {/* Modal de Confirmação */}
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
                onClick={() => { confirmation.action(); setConfirmation(null); }} 
                className="px-3 py-1.5 rounded text-sm text-white bg-blue-600 hover:bg-blue-700 transition font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Completo de Edição de Cadastro */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 my-4 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">✏️ Editar Participante</h3>
                <p className="text-xs text-emerald-100">Altere informações cadastrais básicas e cotas</p>
              </div>
              <button onClick={handleCloseEdit} className="text-white/80 hover:text-white text-xl font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs font-semibold focus:outline-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="11 99999-8888"
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Número de Cotas *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editQuotas}
                      onChange={e => setEditQuotas(Math.max(1, Number(e.target.value)))}
                      className="w-full border border-amber-300 rounded-lg p-1.5 text-xs font-black text-amber-950 bg-white focus:outline-amber-600"
                      required
                    />
                    <span className="text-[11px] font-bold text-amber-800 whitespace-nowrap">
                      = R$ {(editQuotas * 20).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Função no Grupo *</label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-emerald-600 font-semibold"
                  >
                    <option value="participant">👥 Membro</option>
                    <option value="counselor">🛡️ Conselheiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Ex: Paga via Pix..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-xs disabled:opacity-50"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEÇÃO 1: Solicitações de Entrada Pendentes (Aguardando Aprovação) */}
      {pendingJoinRequests.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 animate-pulse-slow">
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

      {/* Formulário Completo de Cadastro de Membro (Sem CPF, Sem E-mail, Com Role) */}
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
                  placeholder="DDD + Telefone (ex: 11 99999-8888)"
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
                        className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide border cursor-pointer shadow-3xs transition-all ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {isPaid ? '✓ PAGO' : '⚠️ PENDENTE'}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-full">
                        Ativo
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar Cadastro Completo"
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
                              message: `Tem certeza que deseja excluir permanentemente o cadastro de ${member.displayName}? Todos os dados de cotas dele serão removidos.`
                            });
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
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
    </div>
  );
}
