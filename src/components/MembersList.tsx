import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName, getWhatsAppCobrarUrl, formatPhoneDisplay, normalizeBrazilianPhoneDigits, formatCPF } from '../lib/formatters';
import { usePool } from '../lib/PoolContext';

export default function MembersList() {
  const { setIsQuotaExceeded } = usePool();
  const [members, setMembers] = useState<any[]>([]);
  const [confirmation, setConfirmation] = useState<{ action: () => void, message: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos do formulário de novo membro
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newQuotas, setNewQuotas] = useState<number>(1);
  const [newNotes, setNewNotes] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'Pago' | 'Pendente'>('Pendente');

  // Estado para modal completo de edição
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editQuotas, setEditQuotas] = useState<number>(1);
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

      // Merge evitando duplicados por email ou nome
      const combined: any[] = [...usersList];
      for (const m of membersList) {
        const alreadyExists = combined.some(u =>
          u.id === m.id ||
          (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase()) ||
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
    setEditName(member.displayName || member.email || '');
    setEditPhone(member.phone || '');
    setEditEmail(member.email || '');
    setEditCpf(member.cpf || '');
    setEditQuotas(Number(member.quotas) > 0 ? Number(member.quotas) : 1);
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
      const quotasVal = Math.max(1, Number(editQuotas) || 1);

      await updateDoc(doc(db, colName, editingMember.id), {
        displayName: editName.trim(),
        phone: normalizedPhone,
        email: editEmail.trim() || null,
        cpf: editCpf.trim() || null,
        quotas: quotasVal,
        notes: editNotes.trim() || null,
      });

      addToast(`Cadastro de "${editName.trim()}" atualizado (${quotasVal} cota(s))!`, 'success');
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
      addToast(`${formatFirstAndLastName(member.displayName || member.email)} agora possui ${nextVal} cota(s).`, 'info');
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
    const name = formatFirstAndLastName(member.displayName || member.email);
    const quotas = Number(member.quotas) || 1;
    const url = getWhatsAppCobrarUrl(member.phone, name, quotas, 20.00, '11953292570');
    window.open(url, '_blank');
  };

  const toggleApproval = async (member: any) => {
    const colName = member.collectionName || 'users';
    await updateDoc(doc(db, colName, member.id), { approved: !member.approved });
    addToast(`Aprovação atualizada!`, 'info');
    fetchMembers();
  };

  const toggleRole = async (member: any) => {
    const newRole = member.role === 'counselor' ? 'participant' : 'counselor';
    const colName = member.collectionName || 'users';
    await updateDoc(doc(db, colName, member.id), { role: newRole });
    addToast(`Função atualizada para ${newRole}!`, 'info');
    fetchMembers();
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
      const quotasVal = Math.max(1, Number(newQuotas) || 1);

      await addDoc(collection(db, 'users'), {
        displayName: newDisplayName.trim(),
        phone: normalizedPhone,
        email: newEmail.trim() || null,
        cpf: newCpf.trim() || null,
        quotas: quotasVal,
        notes: newNotes.trim() || null,
        paymentStatus: newPaymentStatus,
        createdAt: serverTimestamp(),
        approved: true,
        role: 'participant'
      });

      setNewDisplayName('');
      setNewPhone('');
      setNewEmail('');
      setNewCpf('');
      setNewQuotas(1);
      setNewNotes('');
      setNewPaymentStatus('Pendente');
      setShowAddForm(false);

      addToast(`Participante cadastrado com sucesso com ${quotasVal} cota(s)!`, 'success');
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

  // Cálculos de resumo
  const totalMembers = members.length;
  const totalQuotas = members.reduce((sum, m) => sum + (Number(m.quotas) || 1), 0);
  const paidMembers = members.filter(m => m.paymentStatus === 'Pago');
  const paidQuotas = paidMembers.reduce((sum, m) => sum + (Number(m.quotas) || 1), 0);

  return (
    <div className="bg-white p-4">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 my-4 overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">✏️ Editar Cadastro Completo</h3>
                <p className="text-xs text-blue-100">Atualize dados pessoais e quantidade de cotas</p>
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
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs font-semibold focus:outline-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="11 99999-8888"
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={editCpf}
                    onChange={e => setEditCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-blue-600"
                  />
                </div>

                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Ex: Cota compartilhada com irmão, paga via Pix..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-blue-600"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-xs disabled:opacity-50"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header com Resumo e Ações */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-lg text-gray-800">Membros & Cotas</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-0.5">
            <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
              {totalQuotas} cotas
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              {paidQuotas} pagas (R$ {(paidQuotas * 20).toFixed(2).replace('.', ',')})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-sm cursor-pointer"
          >
            {showAddForm ? '✕ Fechar Cadastro' : '+ Cadastrar Membro'}
          </button>
          <button 
            onClick={async () => {
              try {
                await fetch('/api/send-reminders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ members })
                });
                addToast('E-mails de lembrete enviados com sucesso!', 'success');
              } catch {
                addToast('Erro ao disparar e-mails.', 'error');
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm cursor-pointer"
          >
            Enviar Lembretes
          </button>
        </div>
      </div>

      {/* Formulário Completo de Cadastro de Membro */}
      {showAddForm && (
        <form onSubmit={handleAddMember} className="bg-gradient-to-br from-gray-50 to-blue-50/40 p-4 rounded-xl border border-blue-200 mb-4 transition-all space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-sm text-blue-950">📋 Cadastro Completo de Novo Participante</h3>
            <span className="text-[11px] text-blue-700 font-medium">Chave PIX: <strong>11953292570</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                placeholder="Ex: João Silva Santos"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Telefone</label>
              <div className="flex">
                <span className="inline-flex items-center px-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs font-semibold text-gray-700">
                  🇧🇷 +55
                </span>
                <input
                  type="tel"
                  placeholder="DDD + Telefone (ex: 11 99999-8888)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="border border-gray-300 bg-white p-2 rounded-r-lg text-xs w-full focus:outline-blue-500"
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">CPF (Opcional)</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={newCpf}
                onChange={(e) => setNewCpf(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail (Opcional)</label>
              <input
                type="email"
                placeholder="participante@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status de Pagamento Inicial</label>
              <select
                value={newPaymentStatus}
                onChange={(e: any) => setNewPaymentStatus(e.target.value)}
                className="border border-gray-300 bg-white p-2 rounded-lg text-xs w-full focus:outline-blue-500 font-semibold"
              >
                <option value="Pendente">⚠️ Pendente</option>
                <option value="Pago">✓ Pago (Em Dia)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
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
              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Cadastrando...' : `Cadastrar Participante (${newQuotas} cota${newQuotas > 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Membros com Cotas */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs">
              <th className="border border-gray-200 p-2.5 text-left">Participante</th>
              <th className="border border-gray-200 p-2.5 text-center">Cotas Cadastradas</th>
              <th className="border border-gray-200 p-2.5 text-center">Valor Mensal</th>
              <th className="border border-gray-200 p-2.5 text-center">Pagamento</th>
              <th className="border border-gray-200 p-2.5 text-center">Aprovação</th>
              <th className="border border-gray-200 p-2.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500 text-xs">
                  Nenhum membro cadastrado ainda.
                </td>
              </tr>
            ) : (
              members.map(m => {
                const quotas = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
                const totalDue = quotas * 20.00;

                return (
                  <tr key={m.id} className="hover:bg-gray-50/80 transition">
                    {/* Dados do Participante */}
                    <td className="border border-gray-200 p-2.5 font-medium text-gray-800 align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">
                          {formatFirstAndLastName(m.displayName || m.email)}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          {m.phone && (
                            <span className="text-emerald-700 font-medium">
                              📱 {formatPhoneDisplay(m.phone)}
                            </span>
                          )}
                          {m.cpf && (
                            <span className="text-gray-400">
                              CPF: {formatCPF(m.cpf)}
                            </span>
                          )}
                          {m.email && (
                            <span className="text-gray-400 truncate max-w-[140px]">
                              {m.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantidade de Cotas com Botões Rápidos */}
                    <td className="border border-gray-200 p-2 text-center align-middle">
                      <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleQuickChangeQuotas(m, -1)}
                          disabled={quotas <= 1}
                          className="w-5 h-5 rounded bg-white hover:bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-300 disabled:opacity-30 cursor-pointer"
                          title="Diminuir 1 cota"
                        >
                          -
                        </button>
                        <span className="px-2 font-black text-xs text-amber-950">
                          {quotas} {quotas === 1 ? 'cota' : 'cotas'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickChangeQuotas(m, 1)}
                          className="w-5 h-5 rounded bg-white hover:bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-300 cursor-pointer"
                          title="Aumentar 1 cota"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Valor da Cota */}
                    <td className="border border-gray-200 p-2.5 text-center align-middle font-bold text-gray-800">
                      R$ {totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status de Pagamento */}
                    <td 
                      className="border border-gray-200 p-2 text-center cursor-pointer align-middle"
                      onClick={() => setConfirmation({ 
                        message: `Deseja alternar o status de pagamento de "${formatFirstAndLastName(m.displayName || m.email)}" para ${m.paymentStatus === 'Pago' ? 'Pendente' : 'Pago'}?`, 
                        action: () => togglePaymentStatus(m) 
                      })}
                      title="Clique para alternar status de pagamento"
                    >
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black shadow-2xs ${
                        m.paymentStatus === 'Pago' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-red-500 text-white animate-pulse'
                      }`}>
                        {m.paymentStatus === 'Pago' ? '✓ Pago' : '⚠️ Pendente'}
                      </span>
                    </td>

                    {/* Aprovação */}
                    <td 
                      className="border border-gray-200 p-2 text-center cursor-pointer align-middle"
                      onClick={() => setConfirmation({ 
                        message: `Alterar aprovação de "${formatFirstAndLastName(m.displayName || m.email)}"?`, 
                        action: () => toggleApproval(m) 
                      })}
                      title="Clique para alternar aprovação"
                    >
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        m.approved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {m.approved ? 'Aprovado' : 'Pendente'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="border border-gray-200 p-2 text-center align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => sendWhatsApp(m)} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Cobrar via WhatsApp com PIX 11953292570"
                        >
                          💬 Cobrar
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Editar cadastro completo"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => setConfirmation({ 
                            message: `Tem certeza que deseja excluir o membro "${formatFirstAndLastName(m.displayName || m.email)}"?`, 
                            action: () => deleteMember(m) 
                          })} 
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Excluir participante"
                        >
                          ✕
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
