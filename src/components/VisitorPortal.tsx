import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePool } from '../lib/PoolContext';
import { useToast } from './NotificationManager';
import { getNextDrawDate, getDayNameBR } from '../lib/drawCalendar';
import { getApiUrl } from '../lib/apiHelper';
import { DEFAULT_PIX_CONFIG } from '../lib/pix';
import { calculateGamePrize } from '../lib/prizes';
import logoImg from '../assets/images/bolao_logo_app.png';

export default function VisitorPortal() {
  const { activePool } = usePool();
  const { addToast } = useToast();

  const isMegaSena = activePool?.lotteryType === 'megasena';
  const lotteryName = isMegaSena ? 'Mega-Sena' : 'Lotofácil';
  const nextDraw = getNextDrawDate(new Date(), isMegaSena ? 'megasena' : 'lotofacil');

  // Abas do Portal de Visitantes: Convite, Jogos Atuais e Histórico
  const [activeVisitorTab, setActiveVisitorTab] = useState<'overview' | 'games' | 'history'>('overview');

  // Resultados oficiais e jogos cadastrados
  const [officialResults, setOfficialResults] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedContestFilter, setSelectedContestFilter] = useState<string>('all');
  const [copiedPix, setCopiedPix] = useState(false);

  // Estados do formulário de solicitação de entrada
  const [joinName, setJoinName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinQuotas, setJoinQuotas] = useState(1);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Estados do envio de comprovante PIX
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptName, setReceiptName] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    const fetchVisitorData = async () => {
      try {
        const col = isMegaSena ? 'megasena_results' : 'lotofacil_results';
        const [resSnap, gamesSnap] = await Promise.all([
          getDocs(query(collection(db, col), orderBy('createdAt', 'desc'), limit(60))).catch(() => ({ docs: [] } as any)),
          getDocs(query(collection(db, 'games'), orderBy('createdAt', 'desc'), limit(250))).catch(() => ({ docs: [] } as any))
        ]);

        const resList = resSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        resList.sort((a: any, b: any) => Number(b.contest || b.concurso || 0) - Number(a.contest || a.concurso || 0));
        setOfficialResults(resList);

        const gamesList = gamesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        setGames(gamesList);
      } catch (e) {
        console.warn('Erro ao carregar jogos e resultados para visitantes:', e);
      }
    };
    fetchVisitorData();
  }, [isMegaSena]);

  const latestOfficialResult = officialResults[0] || null;

  // Map de resultados por número de concurso para conferência no histórico
  const resultsMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const r of officialResults) {
      const cNum = String(r.contest || r.concurso || '').replace(/\D/g, '');
      if (cNum && Array.isArray(r.numbers)) {
        map[cNum] = r.numbers.map((n: any) => Number(n));
      }
    }
    return map;
  }, [officialResults]);

  const extractContestNumber = (contestStr: any): string => {
    if (!contestStr) return '';
    const match = String(contestStr).match(/#?(\d{4})/);
    if (match) return match[1];
    return String(contestStr).replace(/\D/g, '');
  };

  // Lista única de concursos presentes nos jogos
  const availableContests = useMemo(() => {
    const set = new Set<string>();
    games.forEach(g => {
      const c = extractContestNumber(g.contest);
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [games]);

  const filteredGames = useMemo(() => {
    if (selectedContestFilter === 'all') return games;
    return games.filter(g => extractContestNumber(g.contest) === selectedContestFilter);
  }, [games, selectedContestFilter]);

  const pixKey = (activePool as any)?.pixKey || DEFAULT_PIX_CONFIG.pixKey || '11953292570';
  const pixName = DEFAULT_PIX_CONFIG.receiverName || 'Clodas';
  const quotaValue = isMegaSena ? 'R$ 10,00' : 'R$ 5,00';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
    addToast('Chave PIX copiada para a área de transferência!', 'success');
  };

  const handleRequestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim() || !joinPhone.trim()) {
      addToast('Por favor, informe seu nome e telefone/WhatsApp.', 'error');
      return;
    }

    setJoinLoading(true);
    try {
      await addDoc(collection(db, 'members'), {
        displayName: joinName.trim(),
        name: joinName.trim(),
        phone: joinPhone.trim(),
        quotas: Number(joinQuotas) || 1,
        paymentStatus: 'Pendente',
        approved: false,
        source: 'visitor_portal',
        createdAt: serverTimestamp(),
        role: 'member'
      });

      try {
        const qAdmin = query(collection(db, 'users'));
        const userSnap = await getDocs(qAdmin);
        for (const uDoc of userSnap.docs) {
          const uData = uDoc.data();
          if (uData.role === 'admin') {
            await addDoc(collection(db, 'notifications'), {
              userId: uData.uid || uDoc.id,
              title: '👤 Nova Solicitação de Entrada (Visitante)',
              message: `${joinName.trim()} (${joinPhone.trim()}) solicitou entrada com ${joinQuotas} cota(s) pelo Portal de Visitantes!`,
              type: 'member_request',
              read: false,
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (notifErr) {
        console.warn('Erro ao gerar notificação de solicitação:', notifErr);
      }

      setJoinSuccess(true);
      addToast('Solicitação de entrada enviada com sucesso ao administrador!', 'success');
      setJoinName('');
      setJoinPhone('');
    } catch (err) {
      console.error('Erro ao enviar solicitação de entrada:', err);
      addToast('Erro ao enviar solicitação. Tente novamente mais tarde.', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptName.trim() || !receiptPhone.trim() || !receiptFile) {
      addToast('Preencha seu nome, WhatsApp e anexe a foto do comprovante.', 'error');
      return;
    }

    setReceiptLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(receiptFile);
    reader.onloadend = async () => {
      try {
        const apiUrl = getApiUrl('/api/public/upload-receipt');
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: receiptName.trim(),
            phone: receiptPhone.trim(),
            imageBase64: reader.result,
            mimeType: receiptFile.type
          })
        });

        const data = await res.json();
        if (data.success) {
          addToast('Comprovante enviado com sucesso! O administrador fará a conferência.', 'success');
          setReceiptName('');
          setReceiptPhone('');
          setReceiptFile(null);
          setShowReceiptModal(false);
        } else {
          addToast(data.message || 'Erro ao enviar comprovante.', 'error');
        }
      } catch (err) {
        console.error('Erro no upload de comprovante de visitante:', err);
        addToast('Erro de conexão ao enviar comprovante.', 'error');
      } finally {
        setReceiptLoading(false);
      }
    };
  };

  return (
    <div className="h-dvh overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Topo / Header Restrito Fixo */}
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-md shrink-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="Logotipo" className="w-9 h-9 rounded-xl object-cover border border-emerald-500/40 shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base text-white tracking-wide">Bolão Amigos</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Modo Visitante
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Jogos, Históricos e Convite Público</p>
            </div>
          </div>

          <Link
            to="/"
            className="text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-xl transition border border-white/15 shrink-0 flex items-center gap-1.5"
            title="Acessar com login de participante"
          >
            <span>🔐</span>
            <span className="hidden sm:inline">Já sou Participante</span>
            <span className="sm:hidden">Entrar</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal do Visitante (Rolável) */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain w-full">
        <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Navegação de Abas para Visitantes: Convite, Jogos Registrados e Histórico */}
        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveVisitorTab('overview')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeVisitorTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🍀</span>
            <span>Início & Convite</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveVisitorTab('games')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeVisitorTab === 'games'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🎰</span>
            <span>Jogos Registrados ({games.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveVisitorTab('history')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeVisitorTab === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📜</span>
            <span>Histórico de Sorteios ({officialResults.length})</span>
          </button>
        </div>

        {/* ABA 1: INÍCIO & CONVITE */}
        {activeVisitorTab === 'overview' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Banner Informativo de Boas-Vindas */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 sm:p-7 shadow-2xl border border-emerald-400/20">
              <div className="relative z-10 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200 bg-emerald-950/40 px-3 py-1 rounded-full inline-block border border-emerald-400/30">
                  🍀 Convite Oficial
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Bem-vindo ao Bolão dos Amigos ({lotteryName})
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
                  Nosso bolão é focado em estratégias matemáticas e total transparência. Como visitante, você pode conferir gratuitamente todos os nossos <strong>jogos registrados</strong> e o <strong>histórico de sorteios</strong> nas abas acima!
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveVisitorTab('games')}
                    className="bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs px-4 py-2 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🎰</span> Ver Jogos do Bolão ({games.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVisitorTab('history')}
                    className="bg-emerald-950/60 hover:bg-emerald-950 text-white border border-emerald-400/30 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📜</span> Ver Histórico de Concursos
                  </button>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Card do Próximo Concurso */}
            <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Modalidade</span>
                <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                  <span>🎯</span> {lotteryName}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Próximo Sorteio Oficial</span>
                <p className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>📅</span> {nextDraw.dateFormatted} ({getDayNameBR(nextDraw.date)})
                </p>
                <span className="text-[10px] text-slate-400">Horário: 20:00h (Horário de Brasília)</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Valor da Cota</span>
                <p className="text-base font-black text-amber-300 flex items-center gap-1">
                  <span>💰</span> {quotaValue} <span className="text-[11px] text-slate-400 font-normal">por cota</span>
                </p>
              </div>
            </div>

            {/* Último Resultado Oficial Conferido */}
            {latestOfficialResult && (
              <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>🏆</span> Último Resultado Oficial (Concurso #{latestOfficialResult.contest || latestOfficialResult.concurso})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    Caixa Oficial
                  </span>
                </div>
                {Array.isArray(latestOfficialResult.numbers) && latestOfficialResult.numbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {latestOfficialResult.numbers.map((n: any, idx: number) => (
                      <span
                        key={idx}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs sm:text-sm flex items-center justify-center border border-emerald-500/30 shadow-xs"
                      >
                        {String(n).padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chave PIX Oficial com Copiar e Colar */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 rounded-2xl p-4 sm:p-5 border border-indigo-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <span>⚡</span> Pagamento de Cotas via PIX
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Faça a transferência e envie o comprovante para garantir sua vaga.</p>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800/50">
                  {quotaValue} / cota
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Chave PIX Oficial (Telefone)</span>
                  <span className="font-mono font-black text-sm text-amber-300 tracking-wider truncate block">{pixKey}</span>
                  <span className="text-[10px] text-slate-400">Titular: {pixName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{copiedPix ? '✓' : '📋'}</span>
                    <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>📤</span>
                    <span>Enviar Comprovante</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Duas Ações Principais: Solicitar Entrada ou Enviar Comprovante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card: Solicitar Entrada */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3.5 shadow-lg flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                    📝
                  </div>
                  <h2 className="font-black text-sm text-white">Solicitar Entrada no Grupo</h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Preencha seus dados para que o Administrador Clodas libere seu acesso completo de membro.
                  </p>
                </div>

                {joinSuccess ? (
                  <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3.5 text-center space-y-1.5 animate-in fade-in">
                    <span className="text-xl block">🎉</span>
                    <p className="text-xs font-black text-emerald-300">Solicitação Enviada com Sucesso!</p>
                    <p className="text-[10px] text-slate-300">O administrador fará a aprovação em instantes. Você receberá o aviso pelo WhatsApp.</p>
                    <button
                      type="button"
                      onClick={() => setJoinSuccess(false)}
                      className="mt-2 text-[10px] text-indigo-400 underline font-bold cursor-pointer"
                    >
                      Enviar outra solicitação
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRequestJoin} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Seu Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: João da Silva"
                        value={joinName}
                        onChange={e => setJoinName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Seu WhatsApp com DDD</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (11) 98765-4321"
                        value={joinPhone}
                        onChange={e => setJoinPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Quantidade de Cotas</label>
                      <select
                        value={joinQuotas}
                        onChange={e => setJoinQuotas(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value={1}>1 cota ({quotaValue})</option>
                        <option value={2}>2 cotas ({isMegaSena ? 'R$ 20,00' : 'R$ 10,00'})</option>
                        <option value={3}>3 cotas ({isMegaSena ? 'R$ 30,00' : 'R$ 15,00'})</option>
                        <option value={4}>4 cotas ({isMegaSena ? 'R$ 40,00' : 'R$ 20,00'})</option>
                        <option value={5}>5 cotas ({isMegaSena ? 'R$ 50,00' : 'R$ 25,00'})</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={joinLoading}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      {joinLoading ? 'Enviando Pedido...' : 'Solicitar Entrada no Bolão'}
                    </button>
                  </form>
                )}
              </div>

              {/* Card: Enviar Comprovante de Pagamento */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3.5 shadow-lg flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                    🧾
                  </div>
                  <h2 className="font-black text-sm text-white">Já realizou o PIX?</h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Envie o comprovante de pagamento diretamente para a administração homologar sua cota com rapidez.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>✓</span> Homologação registrada no sistema
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>✓</span> Comprovante vinculado ao seu cadastro
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>✓</span> Notificação direta ao administrador
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>📤</span>
                  <span>Anexar Comprovante PIX</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: JOGOS REGISTRADOS (MODO LEITURA PARA VISITANTES) */}
        {activeVisitorTab === 'games' && (
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>🎰</span> Bilhetes e Jogos Registrados do Bolão
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualização pública dos volantes registrados e conferência automática com os sorteios da Caixa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-400">Concurso:</label>
                <select
                  value={selectedContestFilter}
                  onChange={e => setSelectedContestFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todos os Concursos ({games.length} jogos)</option>
                  {availableContests.map(c => (
                    <option key={c} value={c}>Concurso #{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredGames.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                Nenhum jogo encontrado para o filtro selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
                {filteredGames.map((g, idx) => {
                  const cNum = extractContestNumber(g.contest);
                  const drawn = (cNum && resultsMap[cNum]) || (Array.isArray(latestOfficialResult?.numbers) ? latestOfficialResult.numbers.map(Number) : []);
                  const gameNums: number[] = Array.isArray(g.numbers) ? g.numbers.map(Number).sort((a: number, b: number) => a - b) : [];
                  const hasOfficialForContest = Boolean(cNum && resultsMap[cNum]);
                  const prizeInfo = hasOfficialForContest ? calculateGamePrize(gameNums, resultsMap[cNum], g.customPrize) : null;

                  return (
                    <div key={g.id || idx} className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-black text-indigo-300 truncate">
                          {g.contest || `Jogo #${idx + 1}`}
                        </span>
                        {prizeInfo ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            prizeInfo.hits >= 11
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {prizeInfo.hits} acertos {prizeInfo.prizeAmount > 0 ? `(R$ ${prizeInfo.prizeAmount.toFixed(2).replace('.', ',')})` : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                            Aguardando Sorteio
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {gameNums.map(num => {
                          const isHit = hasOfficialForContest && drawn.includes(num);
                          return (
                            <span
                              key={num}
                              className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center border ${
                                isHit
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                                  : 'bg-slate-900 text-slate-200 border-slate-800'
                              }`}
                            >
                              {String(num).padStart(2, '0')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 3: HISTÓRICO DE SORTEIOS E RESULTADOS OFICIAIS */}
        {activeVisitorTab === 'history' && (
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>📜</span> Histórico de Resultados e Desempenho por Concurso
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Histórico oficial dos concursos sincronizados com a Caixa Econômica Federal e pontuação dos nossos bilhetes.
              </p>
            </div>

            {officialResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                Nenhum resultado histórico carregado no momento.
              </div>
            ) : (
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {officialResults.map((res, idx) => {
                  const cNum = String(res.contest || res.concurso || '');
                  const drawn: number[] = Array.isArray(res.numbers) ? res.numbers.map(Number) : [];
                  const contestGames = games.filter(g => extractContestNumber(g.contest) === cNum);

                  let totalPrizeContest = 0;
                  let bestHits = 0;
                  contestGames.forEach(cg => {
                    const gNums = Array.isArray(cg.numbers) ? cg.numbers.map(Number) : [];
                    const p = calculateGamePrize(gNums, drawn, cg.customPrize);
                    totalPrizeContest += p.prizeAmount;
                    if (p.hits > bestHits) bestHits = p.hits;
                  });

                  return (
                    <div key={res.id || idx} className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-600 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                            Concurso #{cNum}
                          </span>
                          {res.date && (
                            <span className="text-xs text-slate-400 font-semibold">
                              📅 {res.date}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                            🎟️ {contestGames.length} bilhete(s) no concurso
                          </span>
                          {bestHits > 0 && (
                            <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700/40">
                              Máx: {bestHits} pts {totalPrizeContest > 0 ? `• Prêmio: R$ ${totalPrizeContest.toFixed(2).replace('.', ',')}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {drawn.map((n, i) => (
                          <span
                            key={i}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/30"
                          >
                            {String(n).padStart(2, '0')}
                          </span>
                        ))}
                      </div>

                      {contestGames.length > 0 && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContestFilter(cNum);
                              setActiveVisitorTab('games');
                            }}
                            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                          >
                            Ver os {contestGames.length} bilhete(s) deste concurso →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Aviso de Privacidade e Segurança */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10 text-center space-y-2">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span>🔒</span> <strong>Privacidade de Membros:</strong> Visitantes podem conferir livremente todos os jogos e históricos de sorteios. A lista de contatos, telefones e o chat do grupo são restritos aos participantes logados.
          </p>
          <div className="pt-1">
            <Link
              to="/"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
            >
              Já possui cadastro aprovado? Toque aqui para entrar com sua conta.
            </Link>
          </div>
        </div>
        </div>
      </main>

      {/* Modal de Envio de Comprovante para Visitante */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base cursor-pointer"
            >
              ✕
            </button>
            <div className="space-y-1 text-center">
              <span className="text-2xl">📤</span>
              <h3 className="font-black text-sm text-white">Enviar Comprovante PIX</h3>
              <p className="text-[10px] text-slate-400">Anexe a imagem ou PDF do seu pagamento.</p>
            </div>

            <form onSubmit={handleSubmitReceipt} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Seu Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Nome de quem pagou"
                  value={receiptName}
                  onChange={e => setReceiptName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Seu WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="(DDD) Telefone"
                  value={receiptPhone}
                  onChange={e => setReceiptPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Foto do Comprovante</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-emerald-600 file:text-white"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={receiptLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {receiptLoading ? 'Enviando...' : 'Enviar Agora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Restrito Fixo */}
      <footer
        style={{ paddingBottom: 'calc(0.65rem + var(--safe-bottom, 0px))', paddingTop: '0.65rem' }}
        className="border-t border-white/10 bg-slate-950 shrink-0 z-40 text-center text-[10px] text-slate-400 w-full"
      >
        Bolão Amigos • Gestão Segura & Transparente • Todos os direitos reservados
      </footer>
    </div>
  );
}
