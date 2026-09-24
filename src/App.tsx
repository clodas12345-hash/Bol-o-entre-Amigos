import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

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
import { PoolProvider } from './lib/PoolContext';
import { formatFirstAndLastName } from './lib/formatters';

function Layout({ children, user, onSignOut }: { children: React.ReactNode, user: any, onSignOut: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <PoolProvider>
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
              <Link to="/" className="font-black text-xs sm:text-base tracking-wide flex items-center gap-1.5 hover:opacity-90 transition">
                <span>🍀</span> <span className="hidden xs:inline">Bolão Lotofácil</span>
              </Link>
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
        {children}
      </main>

      <footer className="text-center py-4 text-[11px] text-gray-500 border-t bg-white mt-auto">
        Bolão Lotofácil Gestor &copy; {new Date().getFullYear()} — Todos os direitos reservados.
      </footer>
    </div>
    </PoolProvider>
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
                role: currentUser.email === 'clodas12345@gmail.com' ? 'admin' : 'participant',
                approved: true,
                createdAt: new Date().toISOString()
              };
              await import('firebase/firestore').then(async ({ setDoc }) => {
                await setDoc(userDocRef, defaultData);
              });
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
                role: currentUser.email === 'clodas12345@gmail.com' ? 'admin' : 'participant',
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
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
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
          <span className="animate-spin text-xl">🍀</span> Carregando Bolão Lotofácil...
        </div>
      </div>
    );
  }

  return (
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
                      Perfil: <span className="font-semibold text-blue-600 uppercase">{activeUserData?.role || 'Participante'}</span>
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
                <span className="text-4xl">🍀</span>
                <h1 className="text-xl font-black text-gray-950">Bolão Lotofácil Gestor</h1>
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
                      role: member.role || 'participant'
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
  );
}
