import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, collection, getDocs, setDoc, query, where, deleteDoc } from 'firebase/firestore';

import PaymentModal from './components/PaymentModal';
import NewGameModal from './components/NewGameModal';
import UserProfile from './components/UserProfile';
import RulesAndNorms from './components/RulesAndNorms';
import ExportButton from './components/ExportButton';
import MembersList from './components/MembersList';
import GamesTable from './components/GamesTable';
import FinancialDashboard from './components/FinancialDashboard';
import DetailedFinancialReport from './components/DetailedFinancialReport';
import VisualChartsDashboard from './components/VisualChartsDashboard';
import StatsThermometer from './components/StatsThermometer';
import Chat from './components/Chat';
import WhatsAppHub from './components/WhatsAppHub';
import LotofacilDesdobramento from './components/LotofacilDesdobramento';
import CalendarAgenda from './components/CalendarAgenda';
import VictoryCardGenerator from './components/VictoryCardGenerator';
import LotofacilBacktester from './components/LotofacilBacktester';
import RolesGuide from './components/RolesGuide';
import PhoneLoginModal from './components/PhoneLoginModal';
import DrawAlertsConfig from './components/DrawAlertsConfig';
import NotificationManager, { useToast } from './components/NotificationManager';
import PoolSelector from './components/PoolSelector';
import NotificationBell from './components/NotificationBell';
import { PoolProvider, usePool } from './lib/PoolContext';
import { UploadProvider, useUpload } from './lib/UploadContext';
import { formatFirstAndLastName } from './lib/formatters';

function BackgroundUploadStatus() {
  const { queue, clearCompleted, isProcessing } = useUpload();
  const [minimized, setMinimized] = useState(false);
  
  if (queue.length === 0) return null;

  const totalItems = queue.length;
  const completedItems = queue.filter(item => item.status === 'success' || item.status === 'error' || item.status === 'duplicate').length;
  const failedItems = queue.filter(item => item.status === 'error').length;
  const isCurrentlyAnalyzing = queue.some(item => item.status === 'ocr');

  return (
    <div className={`fixed bottom-4 right-4 z-[100] transition-all duration-500 ease-in-out ${minimized ? 'w-12 h-12' : 'w-72 sm:w-80'}`}>
      {minimized ? (
        <button 
          onClick={() => setMinimized(false)}
          className="w-12 h-12 bg-indigo-900 text-white rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden group animate-bounce-slow cursor-pointer"
        >
          {isProcessing ? (
            <div className="absolute inset-0 bg-indigo-600 animate-pulse opacity-50" />
          ) : null}
          <span className="relative z-10 text-lg">
            {isCurrentlyAnalyzing ? '🔍' : '📤'}
          </span>
          {isProcessing && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
          )}
        </button>
      ) : (
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-indigo-900 text-white p-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {isProcessing ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute inset-0" />
                ) : null}
                <div className={`w-2.5 h-2.5 rounded-full relative z-10 ${isProcessing ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest block leading-none">
                  {isProcessing ? (isCurrentlyAnalyzing ? 'Analisando Bilhetes...' : 'Processando Fila') : 'Concluído'}
                </span>
                <span className="text-[9px] text-blue-200 font-bold opacity-80">
                  {completedItems} de {totalItems} processados
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMinimized(true)}
                className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="Minimizar"
              >
                <span className="text-xs">➖</span>
              </button>
              {!isProcessing && (
                <button 
                  onClick={clearCompleted} 
                  className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto p-2.5 space-y-2 bg-gray-50/30">
            {queue.map((item) => (
              <div key={item.id} className={`p-2.5 rounded-2xl border transition-all duration-300 ${
                item.status === 'success' ? 'bg-emerald-50/50 border-emerald-100' : 
                item.status === 'error' ? 'bg-red-50/50 border-red-100' :
                item.status === 'duplicate' ? 'bg-amber-50/50 border-amber-100' :
                'bg-white border-gray-100 shadow-sm'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-bold text-gray-800 truncate flex items-center gap-1.5">
                        <span className="opacity-60">📄</span> {item.name}
                      </p>
                      <span className={`text-[9px] font-black uppercase shrink-0 ${
                        item.status === 'error' ? 'text-red-600' : 
                        item.status === 'success' ? 'text-emerald-600' : 
                        item.status === 'duplicate' ? 'text-amber-600' : 
                        'text-indigo-600 animate-pulse'
                      }`}>
                        {item.status === 'ocr' ? '🔍 Analisando...' : item.message}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                          item.status === 'error' ? 'bg-red-500' : 
                          item.status === 'success' ? 'bg-emerald-500' : 
                          item.status === 'duplicate' ? 'bg-amber-500' : 
                          'bg-indigo-600'
                        }`} 
                        style={{ width: `${item.progress}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-center w-6">
                    {item.status === 'success' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black">✓</div>
                    )}
                    {item.status === 'error' && (
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black">✕</div>
                    )}
                    {item.status === 'duplicate' && (
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black">!</div>
                    )}
                    {(item.status !== 'success' && item.status !== 'error' && item.status !== 'duplicate') && (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {isProcessing && (
            <div className="px-3.5 py-2 bg-indigo-50 border-t border-indigo-100">
              <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-1.5">
                <span className="animate-bounce">💡</span> Você pode navegar normalmente enquanto a IA trabalha.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Layout({ children, user, onSignOut }: { children: React.ReactNode, user: any, onSignOut: () => void }) {
  const { isQuotaExceeded } = usePool();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoViewState, setLogoViewState] = useState<'closed' | 'description' | 'full'>('closed');

  if (!user) return <>{children}</>;

  const isHome = location.pathname === '/';

  const navLinks = [
    { to: '/', label: 'Início', icon: '🏠' },
    { to: '/chat', label: 'Chat', icon: '💬' },
    { to: '/whatsapp', label: 'WhatsApp', icon: '📢' },
    { to: '/desdobramentos', label: 'Desdobramentos', icon: '🎯' },
    { to: '/calendar', label: 'Agenda', icon: '📅' },
    { to: '/rules', label: 'Regras', icon: '📜' },
    { to: '/permissoes', label: 'Papéis', icon: '🛡️' },
    { to: '/profile', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      <NotificationManager />
        
        {/* Barra de Navegação Superior */}
        <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
            {/* Logo & Botão Voltar */}
              <div className="flex items-center gap-2">
                {!isHome && (
                  <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Voltar"
                  >
                    <span>←</span>
                  </button>
                )}
                <div 
                  onClick={() => setLogoViewState('description')}
                  className="font-black text-xs sm:text-base tracking-wide flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer"
                >
                  <img src="/bolao_logo.jpg" alt="Logotipo" className="w-6 h-6 rounded-md object-cover border border-white/20 shadow-xs" />
                  <span className="hidden xs:inline">Bolão</span>
                </div>
              </div>

            {/* Seleção de Bolão & Notificações */}
            <div className="flex items-center gap-1 sm:gap-2">
              <PoolSelector />
              <NotificationBell />
              
              {/* Botão Menu Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>{mobileMenuOpen ? '✕' : '☰'}</span>
              </button>
            </div>

            {/* Links Desktop */}
            <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    active ? 'bg-white/20 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              );
            })}

            <button
              onClick={onSignOut}
              className="ml-2 text-xs bg-red-500/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg font-semibold transition shadow-2xs cursor-pointer"
              title="Encerrar sessão"
            >
              Sair
            </button>
          </nav>
        </div>

        {/* Menu Dropdown Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-900 border-t border-blue-800 p-3 space-y-1.5 animate-in slide-in-from-top duration-150">
            {navLinks.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-xs font-bold transition ${
                    active ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignOut();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition"
            >
              🚪 Sair da Conta
            </button>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5">
        {isQuotaExceeded && (
          <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex">
              <div className="flex-shrink-0 text-xl">⚠️</div>
              <div className="ml-3">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                  Limite de Cota Atingido (Firestore/AI)
                </p>
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                  Limite de cota atingido. Algumas funções podem estar temporariamente indisponíveis.
                </p>
                <div className="mt-2.5">
                  <a
                    href="https://console.firebase.google.com/project/adept-figure-463322-r2/firestore/databases/ai-studio-a00d8821-22d9-4161-874f-6ffa6eabd8cf/data?openUpgradeDialog=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase shadow-sm"
                  >
                    Ativar Faturamento / Upgrade ➔
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
        <BackgroundUploadStatus />
      </main>

      {/* Modal de Descrição do Logo */}
      {logoViewState !== 'closed' && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-300"
          onClick={() => setLogoViewState('closed')}
        >
          <div 
            className={`bg-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 transform ${
              logoViewState === 'full' ? 'w-[90vw] h-[90vh] flex items-center justify-center bg-transparent shadow-none' : 'max-w-md w-full animate-in zoom-in-95'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (logoViewState === 'description') setLogoViewState('full');
              else setLogoViewState('closed');
            }}
          >
            {logoViewState === 'description' ? (
              <div className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <img src="/bolao_logo.jpg" alt="Logotipo" className="w-24 h-24 rounded-2xl shadow-lg border-4 border-blue-50 object-cover cursor-pointer hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-blue-900">Bolão Gestor</h3>
                <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                  <p>Gestão profissional de grupos de apostas, focada em transparência e automação.</p>
                  <p className="text-[11px] text-blue-600 font-bold animate-pulse">💡 Clique no logotipo para ampliar</p>
                </div>
                <button 
                  onClick={() => setLogoViewState('closed')}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition text-xs"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img 
                  src="/bolao_logo.jpg" 
                  alt="Logotipo Ampliado" 
                  className="max-w-full max-h-full rounded-3xl shadow-2xl border-8 border-white/10 animate-in zoom-in-75 duration-300" 
                />
                <button 
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold backdrop-blur-md transition shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogoViewState('closed');
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="text-center py-4 text-[11px] text-gray-500 border-t bg-white mt-auto">
        Bolão Gestor &copy; {new Date().getFullYear()} — Todos os direitos reservados.
      </footer>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [phoneUser, setPhoneUser] = useState<any>(() => {
    const saved = localStorage.getItem('bolao_phone_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  const { addToast } = useToast();

  const activeUser = user || (phoneUser ? phoneUser.sessionUser : null);
  const activeUserData = userData || (phoneUser ? phoneUser.memberData : null);

  const handleSignOut = () => {
    localStorage.removeItem('bolao_phone_user');
    setPhoneUser(null);
    signOut(auth);
  };

  useEffect(() => {
    // Verificação na inicialização: limpa qualquer estado de 'concursos futuros' ou simulados da memória
    // garantindo que o estado de exibição comece sempre com o concurso vigente real.
    const sanitizeContestsMemory = async () => {
      try {
        const LOTOFACIL_LIMIT = 3788;
        const MEGASENA_LIMIT = 2780;

        // 1. Limpeza do cache do último resultado na memória local
        const cachedLatest = localStorage.getItem('bolao_cache_latest_result');
        if (cachedLatest) {
          try {
            const parsed = JSON.parse(cachedLatest);
            const num = Number(parsed?.contest);
            if (!num || num >= LOTOFACIL_LIMIT || parsed?.isSimulated || parsed?.isManual) {
              console.log(`[Memory Sanitizer] Concurso futuro/simulado removido do cache: #${num}`);
              localStorage.removeItem('bolao_cache_latest_result');
            }
          } catch {
            localStorage.removeItem('bolao_cache_latest_result');
          }
        }

        // 2. Limpeza do histórico de resultados na memória local
        const cachedResults = localStorage.getItem('bolao_cache_results');
        if (cachedResults) {
          try {
            const list = JSON.parse(cachedResults);
            if (Array.isArray(list)) {
              const cleaned = list.filter((r: any) => {
                const cNum = Number(r?.contest);
                return cNum > 0 && cNum < LOTOFACIL_LIMIT && !r?.isSimulated;
              });
              localStorage.setItem('bolao_cache_results', JSON.stringify(cleaned));
            }
          } catch {
            localStorage.removeItem('bolao_cache_results');
          }
        }

        // 3. Limpeza do termômetro estatístico na memória local
        const cachedStats = localStorage.getItem('bolao_cache_stats_results');
        if (cachedStats) {
          try {
            const sList = JSON.parse(cachedStats);
            if (Array.isArray(sList)) {
              const cleanedStats = sList.filter((r: any) => {
                const cNum = Number(r?.contest);
                return cNum > 0 && cNum < LOTOFACIL_LIMIT && !r?.isSimulated;
              });
              localStorage.setItem('bolao_cache_stats_results', JSON.stringify(cleanedStats));
            }
          } catch {
            localStorage.removeItem('bolao_cache_stats_results');
          }
        }

        // 4. Limpeza no Firestore de concursos futuros ou simulados gravados indevidamente
        try {
          const qFutureLoto = query(
            collection(db, 'lotofacil_results'),
            where('contest', '>=', LOTOFACIL_LIMIT)
          );
          const snapLoto = await getDocs(qFutureLoto);
          if (!snapLoto.empty) {
            for (const d of snapLoto.docs) {
              await deleteDoc(d.ref).catch(() => {});
            }
          }

          const qFutureMega = query(
            collection(db, 'megasena_results'),
            where('contest', '>=', MEGASENA_LIMIT)
          );
          const snapMega = await getDocs(qFutureMega);
          if (!snapMega.empty) {
            for (const d of snapMega.docs) {
              await deleteDoc(d.ref).catch(() => {});
            }
          }
        } catch (dbErr) {
          console.warn('[Memory Sanitizer] Verificação no banco:', dbErr);
        }

        // 5. Garantir que o concurso vigente real seja consultado
        try {
          const res = await fetch('/api/lotofacil/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contest: 'latest' })
          });
          const data = await res.json();
          if (data.success && data.result) {
            const contestNum = Number(data.result.contest);
            if (contestNum > 0 && contestNum < LOTOFACIL_LIMIT) {
              const officialResult = {
                contest: contestNum,
                date: data.result.date || new Date().toLocaleDateString('pt-BR'),
                numbers: data.result.numbers,
                accumulated: !!data.result.accumulated,
                createdAt: new Date(),
                isManual: false
              };
              localStorage.setItem('bolao_cache_latest_result', JSON.stringify(officialResult));
            }
          }
        } catch {
          // Offline ou fallback silencioso
        }
      } catch (err) {
        console.warn('Erro ao sanitizar concursos futuros:', err);
      }
    };

    sanitizeContestsMemory();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const uData = userDocSnap.data();
            setUserData(uData);
            try {
              localStorage.setItem('bolao_cache_user_data', JSON.stringify(uData));
            } catch (cacheErr) {
              console.warn('Failed to cache user data:', cacheErr);
            }
          } else {
            const memberRef = doc(db, 'members', currentUser.uid);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
              const mData = memberSnap.data();
              setUserData(mData);
              try {
                localStorage.setItem('bolao_cache_user_data', JSON.stringify(mData));
              } catch (cacheErr) {
                console.warn('Failed to cache user member data:', cacheErr);
              }
            } else {
              const defaultData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'Participante',
                role: currentUser.email === 'clodas12345@gmail.com' ? 'admin' : 'participante',
                approved: true,
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, defaultData);
              setUserData(defaultData);
              try {
                localStorage.setItem('bolao_cache_user_data', JSON.stringify(defaultData));
              } catch (cacheErr) {
                console.warn('Failed to cache default user data:', cacheErr);
              }
            }
          }
        } catch (err) {
          console.warn('Erro ao buscar dados do usuário, carregando do cache local de segurança:', err);
          try {
            const cached = localStorage.getItem('bolao_cache_user_data');
            if (cached) {
              setUserData(JSON.parse(cached));
            } else {
              // Fallback inteligente para o Administrador principal
              const fallbackData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'Participante',
                role: currentUser.email === 'clodas12345@gmail.com' ? 'admin' : 'participante',
                approved: true,
                createdAt: new Date().toISOString()
              };
              setUserData(fallbackData);
            }
          } catch (cacheErr) {
            console.error('Erro ao ler cache de dados de usuário:', cacheErr);
          }
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      addToast('Login realizado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao fazer login com Google:', err);
      addToast('Erro ao autenticar com Google. Tente entrar por celular.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <img src="/bolao_logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg animate-pulse object-cover border border-gray-200 shadow-xs" />
          <span>Carregando Bolão...</span>
        </div>
      </div>
    );
  }

  return (
    <PoolProvider>
      <UploadProvider>
        <BrowserRouter>
        <Layout user={activeUser} onSignOut={handleSignOut}>
          <Routes>
        <Route path="/" element={
          activeUser ? (
            activeUserData?.approved ? (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Cabeçalho do Usuário */}
                <div className="bg-white p-4 rounded-xl shadow-xs border flex items-center justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                      Bem-vindo, {formatFirstAndLastName(activeUser.displayName || activeUser.email)}
                    </h1>
                    <p className="text-xs text-gray-500">
                      Perfil: <span className="font-semibold text-blue-600 uppercase">{activeUserData?.role === 'admin' ? 'Administrador' : 'Participante'}</span>
                    </p>
                  </div>
                </div>

                {/* Alertas e Notificações dos Dias de Sorteio (Push & Calendário) */}
                <DrawAlertsConfig />

                {/* 1. Tabela de Jogos Cadastrados e Apostas Registradas (Em cima de tudo) */}
                <GamesTable onOpenNewGame={() => setShowNewGameModal(true)} />

                {/* 2. Dashboard Financeiro Principal */}
                <div className="bg-white rounded-xl shadow-xs border overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-sm text-gray-800">📊 Painel Financeiro e Caixa</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="bg-purple-900 hover:bg-purple-800 text-white text-xs font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>🖨️</span> Imprimir Relatório
                      </button>
                      <ExportButton />
                    </div>
                  </div>
                  <FinancialDashboard />
                </div>

                {/* 3. Lista de Membros e Cotas */}
                <MembersList />

                {/* 4. Gráficos Visuais Avançados */}
                <VisualChartsDashboard />

                {/* 5. Relatório Financeiro Detalhado */}
                <div className="bg-white rounded-xl shadow-xs border p-4">
                  <DetailedFinancialReport />
                </div>

                {/* Modais do Administrador */}
                {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}
                {showNewGameModal && <NewGameModal onClose={() => setShowNewGameModal(false)} />}
              </div>
            ) : (
              <div className="max-w-md mx-auto mt-20 text-center bg-white p-6 rounded-2xl shadow-lg border">
                <span className="text-4xl">⏳</span>
                <h2 className="text-base font-bold text-gray-900 mt-2">Aguardando Aprovação</h2>
                <p className="text-xs text-gray-500 mt-1">Sua conta foi cadastrada e está aguardando o administrador aprovar o acesso ao bolão.</p>
              </div>
            )
          ) : (
            <div className="min-h-[80vh] flex items-center justify-center bg-gray-100 p-4">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center space-y-4 border border-gray-100">
                <div className="flex justify-center">
                  <img src="/bolao_logo.jpg" alt="Logo" className="w-24 h-24 rounded-2xl shadow-md object-cover border border-gray-100" />
                </div>
                <h1 className="text-xl font-black text-gray-950">Bolão</h1>
                <p className="text-xs text-gray-500">Escolha como deseja acessar o aplicativo de forma rápida e segura</p>

                <div className="space-y-2.5 pt-2">
                  <button 
                    onClick={handleLogin}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🌐</span> Entrar com Conta Google
                  </button>

                  <button 
                    onClick={() => setShowPhoneModal(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>📱</span> Entrar com Número de Celular
                  </button>
                </div>
              </div>

              {showPhoneModal && (
                <PhoneLoginModal
                  onClose={() => setShowPhoneModal(false)}
                  onPhoneLoginSuccess={(member) => {
                    const sessionUser = {
                      uid: member.id || 'phone_user',
                      email: member.email || `${member.phone}@bolao.local`,
                      displayName: member.displayName || 'Participante'
                    };
                    const memberData = {
                      ...member,
                      approved: true,
                      role: member.role || 'participante'
                    };
                    setPhoneUser({ sessionUser, memberData });
                    localStorage.setItem('bolao_phone_user', JSON.stringify({ sessionUser, memberData }));
                    setShowPhoneModal(false);
                  }}
                />
              )}
            </div>
          )
        } />
        <Route path="/chat" element={activeUser ? <Chat /> : <Navigate to="/" />} />
        <Route path="/whatsapp" element={activeUser ? <WhatsAppHub /> : <Navigate to="/" />} />
        <Route path="/desdobramentos" element={activeUser ? <LotofacilDesdobramento /> : <Navigate to="/" />} />
        <Route path="/calendar" element={activeUser ? <CalendarAgenda /> : <Navigate to="/" />} />
        <Route path="/backtest" element={activeUser ? <LotofacilBacktester /> : <Navigate to="/" />} />
        <Route path="/charts" element={activeUser ? <VisualChartsDashboard /> : <Navigate to="/" />} />
        <Route path="/card-generator" element={activeUser ? <VictoryCardGenerator /> : <Navigate to="/" />} />
        <Route path="/profile" element={activeUser ? <UserProfile /> : <Navigate to="/" />} />
        <Route path="/rules" element={activeUser ? <RulesAndNorms /> : <Navigate to="/" />} />
        <Route path="/permissoes" element={activeUser ? <RolesGuide /> : <Navigate to="/" />} />
      </Routes>
        </Layout>
      </BrowserRouter>
      </UploadProvider>
    </PoolProvider>
  );
}
