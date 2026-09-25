import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, auth, isQuotaError } from '../lib/firebase';
import PageHeader from './PageHeader';
import { useToast } from './NotificationManager';
import DrawAlertsConfig from './DrawAlertsConfig';
import { usePool } from '../lib/PoolContext';

export default function CalendarAgenda() {
  const { setIsQuotaExceeded } = usePool();
  const [events, setEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();
  const isAdmin = auth.currentUser?.email === 'clodas12345@gmail.com';

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.warn('Events snapshot error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });
    return unsub;
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      addToast('Informe o título e a data do evento.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        title: title.trim(),
        date,
        time,
        description: description.trim(),
        createdAt: serverTimestamp()
      });
      addToast('Evento agendado com sucesso!', 'success');
      setTitle('');
      setDate('');
      setDescription('');
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao agendar evento:', err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        addToast('Limite de cota diária atingido.', 'error');
      } else {
        addToast('Erro ao agendar evento.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Deseja excluir este agendamento?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      addToast('Evento excluído.', 'info');
    } catch (err) {
      console.error(err);
      addToast('Erro ao excluir evento.', 'error');
    }
  };

  // Dias oficiais de sorteio da Lotofácil (Segunda a Sábado às 20h00)
  const lotofacilDays = [
    { day: 'Segunda-feira', time: '20:00', desc: 'Sorteio Oficial Caixa' },
    { day: 'Terça-feira', time: '20:00', desc: 'Sorteio Oficial Caixa' },
    { day: 'Quarta-feira', time: '20:00', desc: 'Sorteio Oficial Caixa' },
    { day: 'Quinta-feira', time: '20:00', desc: 'Sorteio Oficial Caixa' },
    { day: 'Sexta-feira', time: '20:00', desc: 'Sorteio Oficial Caixa' },
    { day: 'Sábado', time: '20:00', desc: 'Sorteio Oficial Caixa' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader
        title="Agenda e Calendário do Bolão"
        subtitle="Dias de sorteios oficiais da Lotofácil, prazos de pagamento e reuniões do grupo"
        icon="📅"
      />

      {/* Alertas Push e Sincronização de Calendário */}
      <DrawAlertsConfig />

      {/* Modal Novo Evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm">Agendar Novo Evento / Lembrete</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Título do Evento *</label>
                <input
                  type="text"
                  placeholder="Ex: Prazo limite para envio do PIX mensal"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs focus:outline-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Data *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs focus:outline-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Horário</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição / Detalhes</label>
                <textarea
                  rows={3}
                  placeholder="Informações adicionais para os participantes..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs focus:outline-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sorteios Oficiais Recorrentes da Lotofácil */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
            <span>⏰</span> Dias Recorrentes de Sorteio da Lotofácil
          </h3>
          <span className="text-[11px] bg-purple-100 text-purple-800 font-semibold px-2.5 py-0.5 rounded-full">
            Caixa Econômica Federal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {lotofacilDays.map((d, i) => (
            <div key={i} className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-900 text-xs block">{d.day}</span>
                <span className="text-[11px] text-purple-700">{d.desc}</span>
              </div>
              <div className="bg-white px-2.5 py-1 rounded-lg border border-purple-200 text-purple-900 font-black text-xs shadow-2xs">
                {d.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos Agendados pelo Administrador */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-3.5 bg-gray-50 border-b flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Eventos e Lembretes do Grupo</h3>
            <p className="text-xs text-gray-500">Prazos de apostas, reuniões e assembleias</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
            >
              <span>+</span> Novo Evento
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {events.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              Nenhum evento agendado no momento.
            </div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/70 transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{ev.title}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded">
                      {ev.date} às {ev.time || '20:00'}
                    </span>
                  </div>
                  {ev.description && (
                    <p className="text-xs text-gray-600">{ev.description}</p>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold p-1.5 transition cursor-pointer"
                    title="Excluir evento"
                  >
                    🗑️ Excluir
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
