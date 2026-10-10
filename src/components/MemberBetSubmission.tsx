import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, getDocs, doc, getDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { Check, Send, AlertCircle, Info, ChevronRight, PartyPopper, ShieldCheck } from 'lucide-react';

interface MemberBetSubmissionProps {
  user: any;
  userData: any;
}

export default function MemberBetSubmission({ user, userData }: MemberBetSubmissionProps) {
  const { addToast } = useToast();
  const [activeRelease, setActiveRelease] = useState<any>(null);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [bets, setBets] = useState<number[][]>([]);
  const [currentBetIndex, setCurrentBetIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [lastSubmissionStatus, setLastSubmissionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (userSubmission?.status === 'validated' && lastSubmissionStatus === 'pending') {
      setShowValidationPopup(true);
    }
    setLastSubmissionStatus(userSubmission?.status || null);
  }, [userSubmission?.status, lastSubmissionStatus]);

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to active releases
    const qR = query(
      collection(db, 'bet_releases'), 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubR = onSnapshot(qR, (snap) => {
      if (!snap.empty) {
        const release = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setActiveRelease(release);
        
        // Initialize bets array based on betsPerMember
        const perMember = (release as any).betsPerMember || 1;
        setBets(Array(perMember).fill([]).map(() => []));
      } else {
        setActiveRelease(null);
      }
    }, (err) => {
      console.warn('MemberBetSubmission release listener error:', err);
    });

    // Listen to user's submissions
    const qS = query(
      collection(db, 'bet_submissions'),
      where('memberId', '==', user.uid)
    );
    
    const unsubS = onSnapshot(qS, (snap) => {
      if (!snap.empty) {
        // Find the submission for the current active release
        const allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const currentSub = allSubs.find((s: any) => s.releaseId === activeRelease?.id);
        if (currentSub) {
          setUserSubmission(currentSub);
        } else {
          setUserSubmission(null);
        }
      } else {
        setUserSubmission(null);
      }
    }, (err) => {
      console.warn('MemberBetSubmission submission listener error:', err);
    });

    return () => {
      unsubR();
      unsubS();
    };
  }, [user?.uid, activeRelease?.id]);

  const toggleNumber = (num: number) => {
    if (!activeRelease) return;
    
    const currentBet = [...bets[currentBetIndex]];
    if (currentBet.includes(num)) {
      bets[currentBetIndex] = currentBet.filter(n => n !== num);
    } else {
      if (currentBet.length >= activeRelease.numbersCount) {
        addToast(`Você já selecionou os ${activeRelease.numbersCount} números.`, 'info');
        return;
      }
      bets[currentBetIndex] = [...currentBet, num].sort((a, b) => a - b);
    }
    setBets([...bets]);
  };

  const handleSubmit = async () => {
    if (!user?.uid || !activeRelease) return;

    const allFilled = bets.every(b => b.length === activeRelease.numbersCount);
    if (!allFilled) {
      addToast(`Por favor, preencha todos os ${activeRelease.betsPerMember} volantes com ${activeRelease.numbersCount} números cada.`, 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'bet_submissions'), {
        releaseId: activeRelease.id,
        memberId: user.uid,
        memberName: userData?.displayName || user.displayName || 'Membro',
        bets: bets,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      addToast('Suas apostas foram enviadas para conferência! 🎉', 'success');
    } catch (err) {
      console.error('Error submitting bets:', err);
      addToast('Erro ao enviar apostas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!activeRelease) return null;

  if (userSubmission) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-300">
        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shadow-inner">
          <Check className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-emerald-900 font-black text-base flex items-center gap-2">
            Apostas Enviadas: {activeRelease.title}
          </h3>
          <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
            Seus {userSubmission.bets.length} volantes já foram registrados e estão em processamento.
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
             <div className="flex items-center gap-2">
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                 userSubmission.status === 'pending' 
                   ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                   : 'bg-emerald-600 text-white shadow-emerald-200'
               }`}>
                 {userSubmission.status === 'pending' ? '⏳ Aguardando Validação' : '✅ Aposta Validada'}
               </span>
               {userSubmission.status === 'validated' && (
                 <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                   <ShieldCheck className="w-4 h-4" /> Jogos lançados no bolão
                 </span>
               )}
             </div>

             {userSubmission.status === 'pending' && (
               <button
                 type="button"
                 onClick={async () => {
                   if (!window.confirm('Deseja realmente excluir este pedido de aposta para refazer os volantes?')) return;
                   try {
                     await deleteDoc(doc(db, 'bet_submissions', userSubmission.id));
                     setUserSubmission(null);
                     addToast('Pedido de aposta excluído. Você já pode refazer seus volantes.', 'info');
                   } catch (err) {
                     console.error('Error deleting submission:', err);
                     addToast('Erro ao excluir pedido de aposta.', 'error');
                   }
                 }}
                 className="bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition cursor-pointer"
               >
                 🗑️ Excluir Pedido
               </button>
             )}
          </div>
        </div>

        {showValidationPopup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-5 shadow-2xl border border-white/20">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <PartyPopper className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">🎉 Aposta Validada!</h3>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed font-medium">
                  Excelente! Suas apostas para <span className="text-blue-600 font-bold">"{activeRelease.title}"</span> foram validadas pelo administrador e já estão participando do bolão oficial.
                </p>
              </div>
              <button
                onClick={() => setShowValidationPopup(false)}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
              >
                OBRIGADO! 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentBet = bets[currentBetIndex] || [];

  return (
    <div className="bg-white rounded-3xl shadow-xl border-4 border-blue-500 overflow-hidden animate-in slide-in-from-top-4 duration-500">
      <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 p-1.5 rounded-lg"><Send className="w-4 h-4" /></span>
              <h2 className="text-lg font-black uppercase tracking-tight">
                {activeRelease.title}
              </h2>
            </div>
            <p className="text-[11px] text-blue-100 font-medium">Liberação para preenchimento de volantes oficiais.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl text-center shadow-inner">
            <span className="block text-xl font-black leading-none">{activeRelease.numbersCount}</span>
            <span className="text-[9px] uppercase font-black text-blue-50 tracking-tighter">Dezenas</span>
          </div>
        </div>
        
        {activeRelease.instructions && (
          <div className="mt-4 p-3 bg-blue-900/30 rounded-2xl border border-white/10 text-[10px] flex items-start gap-2 italic leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{activeRelease.instructions}</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        {activeRelease.betsPerMember > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {bets.map((b, i) => (
              <button
                key={i}
                onClick={() => setCurrentBetIndex(i)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border-2 ${
                  currentBetIndex === i 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                    : b.length === activeRelease.numbersCount 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-blue-200'
                }`}
              >
                Volante {i + 1}
                {b.length === activeRelease.numbersCount && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" /> Selecione as Dezenas ({currentBet.length}/{activeRelease.numbersCount})
            </span>
            {currentBet.length > 0 && (
              <button 
                onClick={() => {
                  bets[currentBetIndex] = [];
                  setBets([...bets]);
                }}
                className="text-[10px] font-black text-red-500 hover:underline"
              >
                LIMPAR
              </button>
            )}
          </div>

          <div className={`grid ${activeRelease.numbersCount > 15 ? 'grid-cols-10' : 'grid-cols-5'} gap-2 p-3 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner`}>
            {Array.from({ length: activeRelease.numbersCount > 15 ? 60 : 25 }, (_, i) => i + 1).map((num) => {
              const isSelected = currentBet.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  className={`aspect-square rounded-xl font-black text-sm transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg scale-110 ring-4 ring-blue-100'
                      : 'bg-white text-gray-800 hover:bg-blue-50 border border-gray-150'
                  }`}
                >
                  {String(num).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || bets.some(b => b.length < activeRelease.numbersCount)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? 'Enviando...' : <><Send className="w-5 h-5" /> Enviar Minhas Apostas</>}
        </button>
      </div>
    </div>
  );
}
