import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName } from '../lib/formatters';
import { usePool } from '../lib/PoolContext';

interface PollOption {
  text: string;
  votes: string[]; // UIDs dos votantes
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  status: 'active' | 'closed';
  createdAt: any;
  createdBy: string;
  creatorName?: string;
}

const PRESET_POLLS = [
  {
    title: 'Apostar com 16 dezenas no próximo concurso?',
    description: 'Aposta de 16 dezenas custa R$ 56,00 e aumenta consideravelmente as chances de 14 e 15 acertos.',
    options: ['Sim, vamos de 16 dezenas!', 'Não, prefiro mais jogos simples de 15', 'Abstenho-me']
  },
  {
    title: 'O que fazer com a premiação de 13 e 12 pontos deste mês?',
    description: 'Decisão sobre o destino dos prêmios conquistados pelo bolão.',
    options: ['Reinvestir tudo em novos jogos', 'Distribuir e transferir via PIX para cada cota', 'Guardar no fundo de reserva do bolão']
  },
  {
    title: 'Qual dezena não pode faltar nas apostas da semana?',
    description: 'Votação para escolha da dezena fixa favorita do grupo.',
    options: ['Dezena 10 (Mais Quente)', 'Dezena 20 (Frequente)', 'Dezena 25 (Ponta)', 'Dezena 13 (Especial)']
  }
];

export default function VotingSystem() {
  const { setIsQuotaExceeded } = usePool();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = auth.currentUser;
  const isAdmin = currentUser?.email === 'clodas12345@gmail.com';
  const { addToast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        let formattedOptions: PollOption[] = [];
        
        // Compatibilidade com formato anterior ou novo
        if (Array.isArray(data.options)) {
          formattedOptions = data.options;
        } else if (typeof data.options === 'object' && data.options !== null) {
          formattedOptions = Object.entries(data.options).map(([text, count]) => ({
            text,
            votes: Array.isArray(data.voters) ? data.voters : []
          }));
        }

        return {
          id: doc.id,
          title: data.title || 'Votação do Bolão',
          description: data.description || '',
          options: formattedOptions,
          status: data.status || 'active',
          createdAt: data.createdAt,
          createdBy: data.createdBy || '',
          creatorName: data.creatorName || 'Admin'
        } as Poll;
      });
      setPolls(list);
    }, err => {
      console.warn('Polls snapshot error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });
    return unsub;
  }, []);

  const handleAddOptionField = () => {
    if (newOptions.length >= 6) {
      addToast('Máximo de 6 opções por votação.', 'error');
      return;
    }
    setNewOptions([...newOptions, '']);
  };

  const handleRemoveOptionField = (idx: number) => {
    if (newOptions.length <= 2) {
      addToast('A votação precisa ter ao menos 2 opções.', 'error');
      return;
    }
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  const handleApplyPreset = (preset: typeof PRESET_POLLS[0]) => {
    setNewTitle(preset.title);
    setNewDescription(preset.description);
    setNewOptions(preset.options);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newOptions.map(o => o.trim()).filter(Boolean);
    if (!newTitle.trim()) {
      addToast('Digite o título da votação.', 'error');
      return;
    }
    if (validOptions.length < 2) {
      addToast('Informe ao menos 2 opções de voto.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const optionsArray: PollOption[] = validOptions.map(text => ({
        text,
        votes: []
      }));

      await addDoc(collection(db, 'polls'), {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        options: optionsArray,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || '',
        creatorName: formatFirstAndLastName(currentUser?.displayName || currentUser?.email || 'Membro')
      });

      addToast('Enquete criada com sucesso!', 'success');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewOptions(['', '']);
    } catch (err) {
      console.error('Erro ao criar enquete:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao criar enquete.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!currentUser) {
      addToast('Você precisa estar logado para votar.', 'error');
      return;
    }

    const poll = polls.find(p => p.id === pollId);
    if (!poll || poll.status === 'closed') {
      addToast('Esta votação já está encerrada.', 'error');
      return;
    }

    try {
      // Remove voto anterior do usuário em qualquer opção e adiciona na nova
      const updatedOptions = poll.options.map((opt, idx) => {
        const cleanVotes = (opt.votes || []).filter(uid => uid !== currentUser.uid);
        if (idx === optionIndex) {
          cleanVotes.push(currentUser.uid);
        }
        return { ...opt, votes: cleanVotes };
      });

      await updateDoc(doc(db, 'polls', pollId), {
        options: updatedOptions
      });

      addToast('Seu voto foi registrado!', 'success');
    } catch (err) {
      console.error('Erro ao votar:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao registrar voto.', 'error');
    }
  };

  const handleToggleStatus = async (poll: Poll) => {
    try {
      const newStatus = poll.status === 'active' ? 'closed' : 'active';
      await updateDoc(doc(db, 'polls', poll.id), { status: newStatus });
      addToast(`Votação ${newStatus === 'active' ? 'reaberta' : 'encerrada'} com sucesso!`, 'info');
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao atualizar status da enquete.', 'error');
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta votação?')) return;
    try {
      await deleteDoc(doc(db, 'polls', pollId));
      addToast('Votação excluída com sucesso.', 'info');
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao excluir votação.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-white space-y-4">
      {/* Cabeçalho da Seção de Votação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
            <span>🗳️</span> Enquetes & Decisões Coletivas
          </h3>
          <p className="text-xs text-gray-500">
            Vote democraticamente nas estratégias, fixação de dezenas e destino de prêmios
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span> Nova Votação
        </button>
      </div>

      {/* Modal de Criação de Enquete */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 my-4 overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base">🗳️ Criar Nova Enquete para o Grupo</h3>
                <p className="text-xs text-amber-100">Colete a opinião de todos os cotistas do bolão</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="p-4 sm:p-5 space-y-4">
              {/* Sugestões Rápidas */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block mb-1.5">
                  ⚡ Modelos Prontos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_POLLS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-1 rounded-lg font-semibold transition text-left"
                    >
                      {preset.title.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Título / Pergunta da Enquete *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Jogamos 16 dezenas no concurso de sábado?"
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-amber-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descrição ou Contexto (Opcional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Explique os detalhes para ajudar na decisão dos membros..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Opções de Resposta *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="text-xs text-amber-700 hover:text-amber-800 font-bold"
                  >
                    + Adicionar Opção
                  </button>
                </div>

                <div className="space-y-2">
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-gray-400 font-bold text-xs">{idx + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const copy = [...newOptions];
                          copy[idx] = e.target.value;
                          setNewOptions(copy);
                        }}
                        placeholder={`Opção ${idx + 1}`}
                        className="flex-1 border border-gray-300 rounded-lg p-2 text-xs focus:outline-amber-500"
                        required
                      />
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Criando...' : 'Publicar Votação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Enquetes */}
      {polls.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <span className="text-3xl block mb-2">🗳️</span>
          <p className="text-xs sm:text-sm font-bold text-gray-700">Nenhuma votação em andamento</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">Crie uma nova enquete para debater estratégias com o grupo</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
          >
            + Criar Primeira Votação
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = (poll.options || []).reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
            const userVotedOptionIndex = (poll.options || []).findIndex(opt =>
              currentUser ? (opt.votes || []).includes(currentUser.uid) : false
            );
            const isClosed = poll.status === 'closed';

            return (
              <div
                key={poll.id}
                className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs ${
                  isClosed
                    ? 'bg-gray-50/80 border-gray-200 opacity-90'
                    : 'bg-white border-amber-200 hover:border-amber-300'
                }`}
              >
                {/* Cabeçalho da Enquete */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isClosed
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isClosed ? '🔒 Encerrada' : '🟢 Em Votação'}
                      </span>
                      {userVotedOptionIndex !== -1 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          ✓ Seu Voto Registrado
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-sm sm:text-base text-gray-900 leading-snug">
                      {poll.title}
                    </h4>

                    {poll.description && (
                      <p className="text-xs text-gray-600 mt-1">{poll.description}</p>
                    )}
                  </div>

                  {/* Ações do Administrador */}
                  {(isAdmin || currentUser?.uid === poll.createdBy) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(poll)}
                        className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded-md transition"
                        title={isClosed ? 'Reabrir votação' : 'Encerrar votação'}
                      >
                        {isClosed ? 'Reabrir' : 'Encerrar'}
                      </button>
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="text-red-500 hover:text-red-700 text-xs p-1 font-bold"
                        title="Excluir enquete"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Opções de Voto e Barra de Progresso */}
                <div className="space-y-2 mt-3">
                  {(poll.options || []).map((option, idx) => {
                    const votesCount = option.votes?.length || 0;
                    const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                    const isMyChoice = userVotedOptionIndex === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleVote(poll.id, idx)}
                        disabled={isClosed}
                        className={`w-full relative overflow-hidden text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isMyChoice
                            ? 'border-amber-500 ring-2 ring-amber-300 bg-amber-50/50 font-bold'
                            : 'border-gray-200 hover:border-amber-300 bg-white'
                        } ${isClosed ? 'cursor-default' : ''}`}
                      >
                        {/* Barra de Progresso Visual de Fundo */}
                        <div
                          className={`absolute top-0 bottom-0 left-0 transition-all duration-500 opacity-20 ${
                            isMyChoice ? 'bg-amber-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative flex items-center justify-between gap-3 text-xs sm:text-sm z-10">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isMyChoice
                                  ? 'border-amber-600 bg-amber-600 text-white font-bold'
                                  : 'border-gray-400'
                              }`}
                            >
                              {isMyChoice ? '✓' : ''}
                            </span>
                            <span className="text-gray-800 font-semibold">{option.text}</span>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <span className="font-extrabold text-gray-900">{percentage}%</span>
                            <span className="text-[11px] text-gray-500 ml-1.5">
                              ({votesCount} {votesCount === 1 ? 'voto' : 'votos'})
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Rodapé da Enquete */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
                  <span>Total de votos: <strong className="text-gray-700">{totalVotes}</strong></span>
                  <span>Criado por: {poll.creatorName || 'Administrador'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
