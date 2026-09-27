import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs, deleteDoc, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePool } from '../lib/PoolContext';
import { useToast } from './NotificationManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Check, 
  X, 
  Clock, 
  Users, 
  Trash2, 
  ShieldCheck, 
  PlayCircle, 
  StopCircle, 
  Settings2, 
  Plus, 
  Info,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function BetReleaseManager() {
  const { activePool, pools } = usePool();
  const { addToast } = useToast();
  const [releases, setReleases] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [numbersCount, setNumbersCount] = useState(15);
  const [betsPerMember, setBetsPerMember] = useState(1);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (activePool?.id) {
      setSelectedPoolId(activePool.id);
    }
  }, [activePool?.id]);

  useEffect(() => {
    // Listen to releases
    const q = query(collection(db, 'bet_releases'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReleases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('BetReleaseManager releases listener error:', err);
    });

    // Listen to submissions
    const subQ = query(collection(db, 'bet_submissions'), orderBy('submittedAt', 'desc'));
    const unsubSub = onSnapshot(subQ, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('BetReleaseManager submissions listener error:', err);
    });

    // Fetch members to know who is missing
    const fetchMembers = async () => {
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('approved', '==', true)));
        setMembers(uSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      } catch (err) {
        console.warn('Error fetching members in BetReleaseManager:', err);
      }
    };
    fetchMembers();

    return () => {
      unsub();
      unsubSub();
    };
  }, []);

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolId) {
      addToast('Selecione um bolão.', 'error');
      return;
    }
    if (!title.trim()) {
      addToast('O título é obrigatório.', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'bet_releases'), {
        poolId: selectedPoolId,
        title: title.trim(),
        instructions: instructions.trim(),
        numbersCount,
        betsPerMember,
        deadline,
        status: 'active',
        createdAt: serverTimestamp()
      });
      addToast('Rodada de apostas liberada com sucesso!', 'success');
      setShowCreateModal(false);
      setTitle('');
      setInstructions('');
      setDeadline('');
    } catch (err) {
      console.error('Error creating release:', err);
      addToast('Erro ao criar liberação.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (releaseId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'bet_releases', releaseId), {
        status: currentStatus === 'active' ? 'closed' : 'active'
      });
      addToast(`Rodada ${currentStatus === 'active' ? 'encerrada' : 'ativada'} com sucesso!`, 'success');
    } catch (err) {
      addToast('Erro ao atualizar status.', 'error');
    }
  };

  const deleteRelease = async (releaseId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta liberação? Isso não apagará os jogos já validados.')) return;
    try {
      await deleteDoc(doc(db, 'bet_releases', releaseId));
      addToast('Liberação excluída.', 'success');
    } catch (err) {
      addToast('Erro ao excluir.', 'error');
    }
  };

  const validateSubmission = async (sub: any) => {
    if (!window.confirm(`Validar as ${sub.bets.length} apostas de ${sub.memberName}? Elas serão enviadas para a lista oficial de jogos.`)) return;
    
    setLoading(true);
    try {
      const release = releases.find(r => r.id === sub.releaseId);
      if (!release) throw new Error('Liberação não encontrada.');

      // 1. Create games in 'games' collection
      const gamePromises = sub.bets.map((nums: number[]) => {
        const sorted = [...nums].sort((a, b) => a - b);
        const numbersKey = sorted.join('-');
        
        return addDoc(collection(db, 'games'), {
          poolId: release.poolId,
          numbers: sorted,
          numbersKey,
          memberId: sub.memberId,
          memberName: sub.memberName,
          contest: `Aposta Membro: ${release.title}`,
          date: Timestamp.now(),
          createdAt: serverTimestamp(),
          isValidated: true,
          submissionId: sub.id
        });
      });

      await Promise.all(gamePromises);

      // 2. Update submission status
      await updateDoc(doc(db, 'bet_submissions', sub.id), {
        status: 'validated',
        validatedAt: serverTimestamp()
      });

      addToast(`Apostas de ${sub.memberName} validadas com sucesso!`, 'success');
    } catch (err) {
      console.error('Error validating submission:', err);
      addToast('Erro ao validar apostas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <h2 className="font-black text-sm uppercase tracking-wider text-gray-800">Liberação de Apostas</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Nova Rodada
        </button>
      </div>

      <div className="p-4 space-y-6">
        {releases.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">Nenhuma rodada de apostas criada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {releases.map(release => {
              const releaseSubmissions = submissions.filter(s => s.releaseId === release.id);
              const validatedCount = releaseSubmissions.filter(s => s.status === 'validated').length;
              const pendingCount = releaseSubmissions.filter(s => s.status === 'pending').length;
              const submittedMemberIds = new Set(releaseSubmissions.map(s => s.memberId));
              const missing = members.filter(m => !submittedMemberIds.has(m.id));

              return (
                <div key={release.id} className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/50">
                  {/* Release Header */}
                  <div className="p-3 bg-white border-b flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${release.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {release.status === 'active' ? <PlayCircle className="w-5 h-5" /> : <StopCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-sm">{release.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                            {pools.find(p => p.id === release.poolId)?.name || 'Bolão'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {release.numbersCount} números • {release.betsPerMember} volantes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(release.id, release.status)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition shadow-xs ${
                          release.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {release.status === 'active' ? 'Encerrar' : 'Reabrir'}
                      </button>
                      <button
                        onClick={() => deleteRelease(release.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Submission Tracking Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b bg-white">
                    {/* Validated */}
                    <div className="p-3">
                      <span className="text-[10px] font-black text-emerald-700 uppercase mb-2 block">✅ Validados ({validatedCount})</span>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {releaseSubmissions.filter(s => s.status === 'validated').map(s => (
                          <div key={s.id} className="flex items-center justify-between bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100">
                            <span className="text-[10px] font-bold text-emerald-900 truncate">{s.memberName}</span>
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending Approval */}
                    <div className="p-3 bg-amber-50/10">
                      <span className="text-[10px] font-black text-amber-700 uppercase mb-2 block">⏳ Pendentes ({pendingCount})</span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {releaseSubmissions.filter(s => s.status === 'pending').map(s => (
                          <div key={s.id} className="bg-white p-2 rounded-xl border border-amber-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-gray-800 truncate">{s.memberName}</span>
                              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-black">{s.bets.length}V</span>
                            </div>
                            <button
                              onClick={() => validateSubmission(s)}
                              disabled={loading}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-1.5 rounded-lg transition shadow-xs disabled:opacity-50"
                            >
                              DAR OK E LANÇAR
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Missing Submission */}
                    <div className="p-3 bg-red-50/10">
                      <span className="text-[10px] font-black text-red-700 uppercase mb-2 block">❌ Faltam ({missing.length})</span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {missing.map(m => (
                          <span key={m.id} className="text-[10px] bg-white border border-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">
                            {m.displayName || m.email}
                          </span>
                        ))}
                        {missing.length === 0 && <span className="text-[10px] text-emerald-600 font-bold">Tudo OK!</span>}
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  {release.instructions && (
                    <div className="p-3 bg-white text-[10px] text-gray-500 border-t flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                      <p><strong>Instruções:</strong> {release.instructions}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-gray-900">Nova Rodada de Apostas</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700 p-2">✕</button>
            </div>
            
            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1.5 ml-1">Título da Rodada *</label>
                  <input
                    type="text"
                    placeholder="Ex: Rodada 3800 / Especial Junina"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1.5 ml-1">Bolão Alvo *</label>
                  <select
                    value={selectedPoolId}
                    onChange={e => setSelectedPoolId(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 focus:outline-none transition-all"
                    required
                  >
                    <option value="">Selecione um Bolão...</option>
                    {pools.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.lotteryType})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-1.5 ml-1">Números/Volante</label>
                    <input
                      type="number"
                      value={numbersCount}
                      onChange={e => setNumbersCount(Number(e.target.value))}
                      min={6}
                      max={20}
                      className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-1.5 ml-1">Volantes/Membro</label>
                    <input
                      type="number"
                      value={betsPerMember}
                      onChange={e => setBetsPerMember(Number(e.target.value))}
                      min={1}
                      max={10}
                      className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1.5 ml-1">Instruções aos Membros</label>
                  <textarea
                    placeholder="Instruções opcionais (ex: prazo, dicas)..."
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 focus:outline-none h-24 resize-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processando...' : <><PlayCircle className="w-5 h-5" /> Liberar Apostas Agora</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
