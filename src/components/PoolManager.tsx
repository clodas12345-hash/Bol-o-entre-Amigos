import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
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

  // Auto Notifications Config State
  const [notifyOnNewContest, setNotifyOnNewContest] = useState(true);
  const [newContestTemplate, setNewContestTemplate] = useState('🍀 Novo Concurso Iniciado! Confira as novas apostas do Concurso #{contest} já cadastradas no Bolão Amigos.');
  const [notifyOnResultPublished, setNotifyOnResultPublished] = useState(true);
  const [resultPublishedTemplate, setResultPublishedTemplate] = useState('🎉 Resultado Publicado! Confira os números sorteados e acertos do Concurso #{contest} do Bolão Amigos.');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTestingNotif, setIsTestingNotif] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'notifications'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.notifyOnNewContest !== undefined) setNotifyOnNewContest(data.notifyOnNewContest);
          if (data.newContestTemplate !== undefined) setNewContestTemplate(data.newContestTemplate);
          if (data.notifyOnResultPublished !== undefined) setNotifyOnResultPublished(data.notifyOnResultPublished);
          if (data.resultPublishedTemplate !== undefined) setResultPublishedTemplate(data.resultPublishedTemplate);
        }
      } catch (err) {
        console.warn('Error fetching notification config, using defaults:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'settings', 'notifications'), {
        notifyOnNewContest,
        newContestTemplate,
        notifyOnResultPublished,
        resultPublishedTemplate,
        updatedAt: serverTimestamp()
      }, { merge: true });
      addToast('Configurações de notificações salvas com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar configurações de notificações.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestAutoNotif = async (type: 'new' | 'result') => {
    setIsTestingNotif(true);
    try {
      const contestTest = 3250;
      const title = type === 'new' ? '🍀 Novo Concurso' : '🎉 Resultado Oficial';
      const rawMsg = type === 'new' ? newContestTemplate : resultPublishedTemplate;
      const message = rawMsg.replace('{contest}', String(contestTest));

      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title,
        message,
        type: type === 'new' ? 'info' : 'prize',
        read: false,
        createdAt: serverTimestamp()
      });
      addToast(`Disparado teste de notificação de ${type === 'new' ? 'novo concurso' : 'resultado'} para o Concurso #${contestTest}!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao testar disparo.', 'error');
    } finally {
      setIsTestingNotif(false);
    }
  };

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
      <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-3xl shadow-sm space-y-4 mt-6">
        <h4 className="font-black text-indigo-900 text-sm flex items-center gap-2">
          <span>📢</span> Disparo de Alerta Geral Manual
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

      {/* PAINEL DE CONFIGURAÇÃO DE NOTIFICAÇÕES AUTOMÁTICAS */}
      <div className="bg-white border-2 border-indigo-100 p-4 sm:p-6 rounded-3xl shadow-sm space-y-6 mt-6">
        <div className="border-b border-indigo-50 pb-4">
          <h4 className="font-black text-indigo-950 text-base flex items-center gap-2">
            <span>⚙️</span> Painel de Notificações Automáticas (Push)
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Configure regras para notificar membros ativos automaticamente sobre o andamento dos concursos.
          </p>
        </div>

        <div className="space-y-6">
          {/* Regra 1: Novo Concurso */}
          <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  checked={notifyOnNewContest}
                  onChange={e => setNotifyOnNewContest(e.target.checked)}
                />
                <span className="font-bold text-gray-800 text-sm">Notificar ao Iniciar Novo Concurso</span>
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                notifyOnNewContest ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
              }`}>
                {notifyOnNewContest ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            {notifyOnNewContest && (
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase">Template da Mensagem (Use &#123;contest&#125; para o número do concurso)</span>
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none min-h-[60px]"
                  value={newContestTemplate}
                  onChange={e => setNewContestTemplate(e.target.value)}
                  placeholder="Ex: 🍀 Novo Concurso #{contest} aberto!"
                />
              </div>
            )}
          </div>

          {/* Regra 2: Resultado Publicado */}
          <div className="bg-emerald-50/20 p-4 rounded-2xl border border-emerald-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  checked={notifyOnResultPublished}
                  onChange={e => setNotifyOnResultPublished(e.target.checked)}
                />
                <span className="font-bold text-gray-800 text-sm">Notificar ao Publicar Resultado</span>
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                notifyOnResultPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
              }`}>
                {notifyOnResultPublished ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            {notifyOnResultPublished && (
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase">Template da Mensagem (Use &#123;contest&#125; para o número do concurso)</span>
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none min-h-[60px]"
                  value={resultPublishedTemplate}
                  onChange={e => setResultPublishedTemplate(e.target.value)}
                  placeholder="Ex: 🎉 Resultado do Concurso #{contest} publicado!"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSaveConfig}
            disabled={isSavingConfig}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition shadow-lg disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
          >
            {isSavingConfig ? 'SALVANDO...' : '💾 Salvar Configurações'}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleTestAutoNotif('new')}
              disabled={isTestingNotif}
              title="Dispara uma notificação simulada de novo concurso para todos os membros ativos"
              className="px-4 py-3 bg-gray-100 hover:bg-indigo-50 text-indigo-700 border border-gray-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Testar Novo Concurso 🧪
            </button>
            <button
              onClick={() => handleTestAutoNotif('result')}
              disabled={isTestingNotif}
              title="Dispara uma notificação simulada de resultado publicado para todos os membros ativos"
              className="px-4 py-3 bg-gray-100 hover:bg-emerald-50 text-emerald-700 border border-gray-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Testar Resultado 🧪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
