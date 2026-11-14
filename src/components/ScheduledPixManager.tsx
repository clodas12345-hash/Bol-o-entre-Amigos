import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName, buildWhatsAppUrl } from '../lib/formatters';
import { useData } from '../lib/DataContext';

export interface ScheduledPixItem {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  amount: number;
  dayOfMonth: number; // 1 to 31
  dueDate?: string; // YYYY-MM-DD for specific one-off
  recurrence: 'monthly' | 'once';
  status: 'active' | 'completed' | 'paused';
  notes?: string;
  createdAt?: any;
}

const LOCAL_STORAGE_KEY = 'bolao_local_scheduled_pix';

const getLocalScheduledPix = (): ScheduledPixItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((i: any) => ({
      ...i,
      status: (i.status === 'active' || i.status === 'completed' || i.status === 'paused') ? i.status : 'active'
    }));
  } catch {
    return [];
  }
};

const saveLocalScheduledPix = (items: ScheduledPixItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export default function ScheduledPixManager() {
  const { members } = useData();
  const { addToast } = useToast();

  const [items, setItems] = useState<ScheduledPixItem[]>(getLocalScheduledPix);
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulário de Cadastro
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amountInput, setAmountInput] = useState('20.00');
  const [dayInput, setDayInput] = useState('10');
  const [recurrenceInput] = useState<'monthly' | 'once'>('monthly');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'scheduled_pix'), (snapshot) => {
        const list = snapshot.docs.map(d => {
          const data = d.data();
          const rawStatus = data.status;
          const status: 'active' | 'completed' | 'paused' =
            rawStatus === 'active' || rawStatus === 'completed' || rawStatus === 'paused'
              ? rawStatus
              : 'active';

          return {
            id: d.id,
            memberId: data.memberId || '',
            memberName: data.memberName || 'Participante',
            phone: data.phone || '',
            amount: Number(data.amount) || 20.00,
            dayOfMonth: Number(data.dayOfMonth) || 10,
            dueDate: data.dueDate,
            recurrence: data.recurrence || 'monthly',
            status,
            notes: data.notes,
            createdAt: data.createdAt
          };
        }) as ScheduledPixItem[];
        setItems(list);
        saveLocalScheduledPix(list);
      }, (err) => {
        console.warn('Erro ao carregar scheduled_pix do Firestore:', err);
      });
    } catch {}
    return () => unsub();
  }, []);

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    const m = members.find(u => u.id === memberId || u.uid === memberId);
    if (m) {
      const q = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
      setAmountInput((q * 20.00).toFixed(2));
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      addToast('Selecione um participante.', 'error');
      return;
    }
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      addToast('Informe um valor válido.', 'error');
      return;
    }

    const member = members.find(m => m.id === selectedMemberId || m.uid === selectedMemberId);
    const memberName = member ? (member.displayName || member.name || 'Participante') : 'Participante';
    const phone = member?.phone || '';

    const newItemData: Omit<ScheduledPixItem, 'id'> = {
      memberId: selectedMemberId,
      memberName,
      phone,
      amount: amt,
      dayOfMonth: parseInt(dayInput, 10) || 10,
      recurrence: recurrenceInput,
      status: 'active',
      notes: notesInput.trim() || undefined,
      createdAt: serverTimestamp()
    };

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'scheduled_pix'), newItemData);
      const createdItem: ScheduledPixItem = { id: docRef.id, ...newItemData, status: 'active', createdAt: new Date().toISOString() };
      const updatedList = [...items, createdItem];
      setItems(updatedList);
      saveLocalScheduledPix(updatedList);

      addToast(`Lembrete de PIX agendado cadastrado para "${memberName}"!`, 'success');
      setShowAddModal(false);
      setSelectedMemberId('');
      setNotesInput('');
    } catch (err) {
      console.warn('Erro ao salvar no Firestore, salvando localmente:', err);
      const localId = 'local_spix_' + Date.now();
      const createdItem: ScheduledPixItem = { id: localId, ...newItemData, status: 'active', createdAt: new Date().toISOString() };
      const updatedList = [...items, createdItem];
      setItems(updatedList);
      saveLocalScheduledPix(updatedList);

      addToast(`Lembrete salvo localmente para "${memberName}"!`, 'success');
      setShowAddModal(false);
      setSelectedMemberId('');
      setNotesInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scheduled_pix', id));
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      saveLocalScheduledPix(updated);
      addToast('Lembrete removido com sucesso.', 'success');
    } catch {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      saveLocalScheduledPix(updated);
      addToast('Removido localmente.', 'info');
    }
  };

  const handleToggleStatus = async (item: ScheduledPixItem) => {
    const nextStatus: 'active' | 'paused' = item.status === 'active' ? 'paused' : 'active';
    try {
      await updateDoc(doc(db, 'scheduled_pix', item.id), { status: nextStatus });
      const updated = items.map(i => i.id === item.id ? { ...i, status: nextStatus } : i);
      setItems(updated);
      saveLocalScheduledPix(updated);
      addToast(`Status alterado para ${nextStatus === 'active' ? 'Ativo' : 'Pausado'}.`, 'info');
    } catch {
      const updated = items.map(i => i.id === item.id ? { ...i, status: nextStatus } : i);
      setItems(updated);
      saveLocalScheduledPix(updated);
      addToast('Status atualizado localmente.', 'info');
    }
  };

  const handleSendReminderWhatsApp = (item: ScheduledPixItem) => {
    const name = formatFirstAndLastName(item.memberName);
    const text = `Olá, ${name}! 💰 Passando para lembrar do seu Pix agendado no valor de *R$ ${item.amount.toFixed(2)}* referente ao nosso Bolão entre Amigos (Vencimento dia ${item.dayOfMonth}). Contamos com sua parceria! 🍀✨`;
    const url = buildWhatsAppUrl(item.phone, text);
    window.open(url, '_blank');
  };

  // Classifica e calcula vencimentos próximos
  const now = new Date();
  const currentDay = now.getDate();

  const processedItems = useMemo(() => {
    return items.map(item => {
      const day = Number(item.dayOfMonth) || 10;
      let daysUntil = day - currentDay;
      if (daysUntil < 0) {
        daysUntil += 30; // aproximação do próximo mês
      }
      return {
        ...item,
        daysUntil
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [items, currentDay]);

  const upcomingCount = processedItems.filter(i => i.status === 'active' && i.daysUntil <= 5).length;
  const totalScheduledSum = processedItems.filter(i => i.status === 'active').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Topo do Módulo */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            Automação & Lembretes
          </span>
          <h3 className="text-base sm:text-lg font-black mt-1 flex items-center gap-2">
            <span>⏰</span> Gestão de Pix Agendados e Recorrentes
          </h3>
          <p className="text-xs text-teal-200 mt-0.5">
            Cadastre lembretes de PIX por participante e acompanhe os vencimentos próximos para cobrança rápida.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>＋</span> Cadastrar Pix Agendado
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl shrink-0 font-black">
            📋
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Cadastrados Ativos</span>
            <span className="text-lg font-black text-gray-900">{items.filter(i => i.status === 'active').length} lembretes</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0 font-black">
            ⚠️
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Vencem nos Próximos 5 Dias</span>
            <span className="text-lg font-black text-amber-700">{upcomingCount} vencimentos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0 font-black">
            💰
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Recorrente Mensal</span>
            <span className="text-lg font-black text-emerald-700">R$ {totalScheduledSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Tabela / Lista de Pix Agendados */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-black text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
            Lista de Vencimentos & Agendamentos ({processedItems.length})
          </h4>
          <span className="text-[11px] text-gray-500 font-bold">Ordenado por proximidade</span>
        </div>

        {processedItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs font-bold">
            Nenhum Pix agendado cadastrado. Clique no botão acima para adicionar o primeiro.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {processedItems.map((item, idx) => {
              const isDueSoon = item.status === 'active' && item.daysUntil <= 5;
              return (
                <div key={item.id} className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      item.status !== 'active'
                        ? 'bg-gray-100 text-gray-400'
                        : isDueSoon
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Dia {item.dayOfMonth}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900 text-xs sm:text-sm truncate">
                          {formatFirstAndLastName(item.memberName)}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {item.status === 'active' ? 'Ativo (Recorrente)' : 'Pausado'}
                        </span>
                        {isDueSoon && (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                            ⚡ Vence em {item.daysUntil === 0 ? 'Hoje' : `${item.daysUntil} dia(s)`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {item.phone && <span className="text-gray-400 font-mono font-normal ml-2">({item.phone})</span>}
                      </p>
                      {item.notes && <p className="text-[11px] text-gray-500 italic mt-0.5">Obs: "{item.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleSendReminderWhatsApp(item)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Enviar lembrete via WhatsApp"
                    >
                      <span>💬</span> Cobrar WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      title={item.status === 'active' ? 'Pausar lembrete' : 'Ativar lembrete'}
                    >
                      {item.status === 'active' ? '⏸️ Pausar' : '▶️ Ativar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl text-xs font-bold transition cursor-pointer border border-red-200"
                      title="Excluir lembrete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Pix Agendado */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⏰</span>
                <div>
                  <h4 className="font-black text-gray-900 text-sm sm:text-base">Cadastrar Pix Agendado</h4>
                  <p className="text-[11px] text-gray-500">Defina o dia do mês e valor do lembrete</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Participante *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-emerald-600 bg-white"
                  required
                >
                  <option value="">Selecione o participante...</option>
                  {members.map(m => {
                    const q = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
                    return (
                      <option key={m.id} value={m.id}>
                        {formatFirstAndLastName(m.displayName || m.name || m.email)} ({q} cota{q > 1 ? 's' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-gray-800 focus:outline-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dia do Vencimento (1-31) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayInput}
                    onChange={(e) => setDayInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-gray-800 focus:outline-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações ou Banco (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Agendamento automático Nubank"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Lembrete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
