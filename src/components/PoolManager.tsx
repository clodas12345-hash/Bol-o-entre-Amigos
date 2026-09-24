import { useState } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePool } from '../lib/PoolContext';
import { useToast } from './NotificationManager';

export default function PoolManager() {
  const { pools } = usePool();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'monthly' | 'special' | 'daily'>('monthly');
  const [lotteryType, setLotteryType] = useState<'lotofacil' | 'megasena'>('lotofacil');

  // Broadcast Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'prize' | 'alert' | 'payment' | 'info'>('info');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'pools'), {
        name,
        description,
        type,
        lotteryType,
        active: true,
        createdAt: serverTimestamp()
      });
      addToast('Novo Bolão criado com sucesso!', 'success');
      setShowAddModal(false);
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
      addToast('Erro ao criar bolão.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePoolActive = async (pool: any) => {
    try {
      await updateDoc(doc(db, 'pools', pool.id), {
        active: !pool.active
      });
      addToast(`Bolão ${!pool.active ? 'ativado' : 'desativado'}!`, 'success');
    } catch (err) {
      addToast('Erro ao atualizar status.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
          <span>🏷️</span> Gerenciar Bolões Temáticos
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md cursor-pointer"
        >
          + Novo Bolão
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pools.map(pool => (
          <div key={pool.id} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-800">{pool.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{pool.description || 'Sem descrição'}</p>
                <div className="flex gap-1.5 mt-1.5">
                   <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                    pool.lotteryType === 'megasena' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {pool.lotteryType === 'megasena' ? 'Mega-Sena' : 'Lotofácil'}
                  </span>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                pool.type === 'special' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {pool.type}
              </span>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pool.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span className="text-[10px] font-bold text-gray-600 uppercase">
                  {pool.active ? 'Ativo e Aberto' : 'Encerrado'}
                </span>
              </div>
              <button
                onClick={() => togglePoolActive(pool)}
                className={`text-[10px] font-black px-3 py-1 rounded-lg transition border cursor-pointer ${
                  pool.active 
                    ? 'text-red-600 border-red-100 hover:bg-red-50' 
                    : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {pool.active ? 'ENCERRAR' : 'REATIVAR'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-black text-lg">Criar Novo Bolão</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white transition cursor-pointer text-2xl">✕</button>
            </div>
            <form onSubmit={handleCreatePool} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase">Nome do Bolão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lotofácil da Independência 2026"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-gray-800 focus:border-indigo-500 focus:outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase">Descrição</label>
                <textarea
                  placeholder="Detalhes sobre este bolão..."
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 font-medium text-gray-800 focus:border-indigo-500 focus:outline-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase">Modalidade da Loteria</label>
                <select
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-gray-800 focus:border-indigo-500 focus:outline-none"
                  value={lotteryType}
                  onChange={e => setLotteryType(e.target.value as any)}
                >
                  <option value="lotofacil">Lotofácil (1-25)</option>
                  <option value="megasena">Mega-Sena (1-60)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 uppercase">Tipo de Bolão</label>
                <select
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-gray-800 focus:border-indigo-500 focus:outline-none"
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                >
                  <option value="monthly">Mensal (Padrão)</option>
                  <option value="special">Especial (Grandes Prêmios)</option>
                  <option value="daily">Diário (Extra)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Criando...' : 'Confirmar Criação'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Enviar Notificação Geral */}
      <div className="bg-white border-2 border-indigo-50 p-4 sm:p-6 rounded-3xl shadow-sm space-y-4 mt-6">
        <h4 className="font-black text-indigo-900 text-sm flex items-center gap-2">
          <span>📢</span> Enviar Notificação para Todos
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Título do Alerta"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-500 focus:outline-none"
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
            />
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-500 focus:outline-none"
              value={notifType}
              onChange={e => setNotifType(e.target.value as any)}
            >
              <option value="info">ℹ️ Informativo</option>
              <option value="prize">💰 Prêmio Disponível</option>
              <option value="alert">🚨 Urgente / Encerramento</option>
              <option value="payment">💳 Cobrança / Pagamento</option>
            </select>
          </div>
          <textarea
            placeholder="Mensagem detalhada..."
            className="w-full h-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:border-indigo-500 focus:outline-none min-h-[80px]"
            value={notifMessage}
            onChange={e => setNotifMessage(e.target.value)}
          />
        </div>
        <button
          onClick={async () => {
            if (!notifTitle || !notifMessage) return;
            setIsSendingNotif(true);
            try {
              await addDoc(collection(db, 'notifications'), {
                userId: 'all',
                title: notifTitle,
                message: notifMessage,
                type: notifType,
                read: false,
                createdAt: serverTimestamp()
              });
              addToast('Notificação enviada para todos os membros!', 'success');
              setNotifTitle('');
              setNotifMessage('');
            } catch (err) {
              addToast('Erro ao enviar notificação.', 'error');
            } finally {
              setIsSendingNotif(false);
            }
          }}
          disabled={isSendingNotif || !notifTitle || !notifMessage}
          className="w-full bg-indigo-900 hover:bg-black text-white font-black py-3 rounded-xl transition shadow-lg disabled:opacity-50 cursor-pointer text-xs uppercase tracking-widest"
        >
          {isSendingNotif ? 'ENVIANDO...' : 'DISPARAR NOTIFICAÇÃO 🚀'}
        </button>
      </div>
    </div>
  );
}
