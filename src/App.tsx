import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, query, where, deleteDoc, onSnapshot, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

import PaymentModal from './components/PaymentModal';
import NewGameModal from './components/NewGameModal';
import UserProfile from './components/UserProfile';
import RulesAndNorms from './components/RulesAndNorms';
import ExportButton from './components/ExportButton';
import MembersList from './components/MembersList';
import GamesTable from './components/GamesTable';
import FinancialDashboard from './components/FinancialDashboard';
import DetailedFinancialReport from './components/DetailedFinancialReport';
import TenDayAccountabilityReport from './components/TenDayAccountabilityReport';
import DecendioReminderBanner from './components/DecendioReminderBanner';
import VisualChartsDashboard from './components/VisualChartsDashboard';
import StatsThermometer from './components/StatsThermometer';
import Chat from './components/Chat';
import WhatsAppHub from './components/WhatsAppHub';
import PublicReceiptUpload from './components/PublicReceiptUpload';
import MonthlySnapshotManager from './components/MonthlySnapshotManager';
import LotofacilDesdobramento from './components/LotofacilDesdobramento';
import BackupManager from './components/BackupManager';
import CalendarAgenda from './components/CalendarAgenda';
import VictoryCardGenerator from './components/VictoryCardGenerator';
import LotofacilBacktester from './components/LotofacilBacktester';
import RolesGuide from './components/RolesGuide';
import PhoneLoginModal from './components/PhoneLoginModal';
import EditProfileModal from './components/EditProfileModal';
import SetPasswordModal from './components/SetPasswordModal';
import BetReleaseManager from './components/BetReleaseManager';
import Settings from './components/Settings';
import MemberBetSubmission from './components/MemberBetSubmission';
import HowToUseModal from './components/HowToUseModal';
import DrawAlertsConfig from './components/DrawAlertsConfig';
import DrawCalendarModal from './components/DrawCalendarModal';
import { getAdjustedActiveContestInfo, formatDateBR } from './lib/drawCalendar';
import { 
  scheduleUpcomingDrawAlerts, 
  sendAppNotification, 
  canTriggerDailyChatNotification, 
  markDailyChatNotificationSent, 
  resolveNotificationTargetPath,
  ensureAndroidHighImportanceChannel,
  requestNotificationPermissionWithDetails,
  getNotificationPermissionStatus,
  NotificationStatusDetails
} from './lib/notifications';
import NotificationManager, { useToast } from './components/NotificationManager';
import PoolSelector from './components/PoolSelector';
import NotificationBell from './components/NotificationBell';
import { PoolProvider, usePool } from './lib/PoolContext';
import { UploadProvider, useUpload } from './lib/UploadContext';
import { PermissionsProvider, usePermissions } from './lib/PermissionsContext';
import { PendingRequestsProvider, usePendingRequests } from './lib/PendingRequestsContext';
import { formatFirstAndLastName, normalizeBrazilianPhoneDigits } from './lib/formatters';
import { PermissionKey } from './lib/permissions';
import { fetchLotteryResultDirectly } from './lib/apiHelper';
import { checkAndNotifyWinningGamesForResult } from './lib/autoNotificationService';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

import logoImg from './assets/images/bolao_logo_app.png';

function BackgroundUploadStatus() {
  const { queue, clearCompleted, retryFailed, isProcessing } = useUpload();
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Rola estritamente dentro do container do painel de uploads, sem interferir na janela ou em outros modais
    if (!minimized && containerRef.current) {
      const container = containerRef.current;
      const activeItem = container.querySelector<HTMLElement>('.animate-pulse-item');
      if (activeItem) {
        const targetScroll = activeItem.offsetTop - container.offsetTop;
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }, [queue, minimized]);
  
  if (queue.length === 0 || closed) return null;

  const totalItems = queue.length;
  const completedItems = queue.filter(item => item.status === 'success' || item.status === 'error' || item.status === 'duplicate').length;
  const failedItems = queue.filter(item => item.status === 'error').length;
  const isCurrentlyAnalyzing = queue.some(item => item.status === 'ocr');

  return (
    <div className={`fixed bottom-4 right-4 z-[100] transition-all duration-300 ease-in-out ${minimized ? 'w-14 h-14' : 'w-72 sm:w-80 max-w-[calc(100vw-2rem)]'}`}>
      {minimized ? (
        <button 
          onClick={() => setMinimized(false)}
          className="w-14 h-14 bg-gradient-to-tr from-indigo-950 via-blue-900 to-indigo-900 text-white rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden group hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-indigo-400/30"
          title="Ver progresso de envio dos bilhetes"
        >
          {isProcessing ? (
            <div className="absolute inset-0 bg-amber-400/20 animate-pulse" />
          ) : null}
          <div className="flex flex-col items-center justify-center relative z-10">
            <span className="text-base leading-none">
              {isCurrentlyAnalyzing ? '🔍' : '📤'}
            </span>
            <span className="text-[9px] font-black mt-0.5 text-amber-300">
              {completedItems}/{totalItems}
            </span>
          </div>
          {isProcessing && (
            <div className="absolute top-1 right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-indigo-950 animate-ping" />
          )}
        </button>
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-indigo-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-indigo-900 text-white p-3.5 flex justify-between items-center select-none">
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
            <div className="flex items-center gap-1.5">
              {failedItems > 0 && !isProcessing && (
                <button 
                  onClick={retryFailed} 
                  className="bg-amber-400 hover:bg-amber-300 text-indigo-950 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer shadow-xs flex items-center gap-1"
                  title="Tentar processar novamente as fotos que deram tempo esgotado"
                >
                  <span>🔄</span> Reprocessar
                </button>
              )}
              {!isProcessing && (
                <button 
                  onClick={clearCompleted} 
                  className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer"
                >
                  Limpar
                </button>
              )}
              <button 
                onClick={() => setMinimized(true)}
                className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer text-xs"
                title="Minimizar janela para flutuante"
              >
                ➖
              </button>
              <button 
                onClick={() => setClosed(true)}
                className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer text-xs text-red-200 hover:text-white"
                title="Fechar alerta"
              >
                ✕
              </button>
            </div>
          </div>

          {/* List - Smooth Touch Scroll */}
          <div ref={containerRef} className="max-h-48 sm:max-h-56 overflow-y-auto overscroll-contain touch-pan-y p-2.5 space-y-2 bg-gray-50/40 divide-y divide-gray-100/50">
            {queue.map((item) => {
              const isActive = item.status !== 'success' && item.status !== 'error' && item.status !== 'duplicate';
              return (
                <div key={item.id} className={`p-2.5 rounded-2xl border transition-all duration-300 ${
                  isActive ? 'animate-pulse-item bg-indigo-50/40' : ''
                } ${
                  item.status === 'success' ? 'bg-emerald-50/60 border-emerald-100' : 
                  item.status === 'error' ? 'bg-red-50/60 border-red-100' :
                  item.status === 'duplicate' ? 'bg-amber-50/60 border-amber-100' :
                  'bg-white border-gray-100 shadow-xs'
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
            );
          })}
        </div>
          
          {isProcessing && (
            <div className="px-3.5 py-1.5 bg-indigo-50/80 border-t border-indigo-100 flex items-center justify-between">
              <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-1.5">
                <span className="animate-bounce">💡</span> Você pode navegar na tela normalmente.
              </p>
              <button 
                onClick={() => setMinimized(true)}
                className="text-[9px] font-black text-indigo-900 underline hover:no-underline cursor-pointer"
              >
                Minimizar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WaitingForApprovalScreen({ user, userData, onSignOut }: { user: any, userData: any, onSignOut: () => void }) {
  return (
    <div className="min-h-dvh h-full bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-950 flex items-center justify-center p-4 safe-area">
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center text-white relative">
          <div className="absolute top-4 right-4 animate-ping w-2.5 h-2.5 rounded-full bg-white opacity-75" />
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner animate-bounce-slow">
            ⏳
          </div>
          <h2 className="text-xl font-black uppercase tracking-wide">Cadastro Pendente</h2>
          <p className="text-xs text-amber-100 font-semibold mt-1">Aguardando Aprovação do Administrador</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-sm text-gray-600 leading-relaxed space-y-3 text-left">
            <p>
              Olá, <strong className="text-gray-900">{userData?.displayName || user?.displayName || 'Participante'}</strong>!
            </p>
            <p>
              Seu cadastro foi registrado com sucesso em nosso sistema do <strong className="text-gray-900">Bolão Amigos</strong>.
            </p>
            <p>
              Para garantir a segurança de todos os participantes, as finanças e apostas do grupo são privadas. Um administrador precisa aprovar seu acesso antes que você possa visualizar os jogos e participar do chat.
            </p>
          </div>

          {/* Dados Cadastrados */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-2 text-xs text-left">
            <p className="font-bold text-gray-500 uppercase tracking-widest text-[9px] mb-2">Seus Dados de Acesso:</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Nome:</span>
              <span className="font-bold text-gray-800">{userData?.displayName || user?.displayName}</span>
            </div>
            {userData?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">WhatsApp:</span>
                <span className="font-mono font-bold text-gray-800">{userData.phone}</span>
              </div>
            )}
            {userData?.email && (
              <div className="flex justify-between text-right">
                <span className="text-gray-500">E-mail:</span>
                <span className="font-bold text-gray-800 truncate max-w-[200px]">{userData.email}</span>
              </div>
            )}
          </div>

          <div className="text-center bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-amber-800 text-[11px] font-semibold animate-pulse flex items-center justify-center gap-1.5">
            <span className="text-base">🔄</span>
            <span>Esta tela se atualizará automaticamente assim que você for aprovado!</span>
          </div>

          <div className="pt-2">
            <button
              onClick={onSignOut}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-2xl font-black transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-2xs border border-red-200"
            >
              <span>🚪</span>
              <span>Sair / Entrar com outra conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Layout({ children, user, userData, isAdmin, onSignOut, onUpdateUserData }: { children: React.ReactNode, user: any, userData: any, isAdmin: boolean, onSignOut: () => void, onUpdateUserData?: (data: any) => void }) {
  const { isQuotaExceeded, setIsQuotaExceeded, activePool } = usePool();
  const { can, isAdmin: permissionsIsAdmin, isSimulating, simulatedRole, setSimulatedRole } = usePermissions();
  const { pendingJoinRequests, pendingQuotaRequests, totalPendingCount } = usePendingRequests();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoViewState, setLogoViewState] = useState<'closed' | 'description' | 'full'>('closed');

  const locationRef = useRef(location.pathname);
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Listener para o botão voltar do celular (Capacitor):
  // Se estiver em qualquer tela que não seja a inicial ('/'), volta para a tela inicial.
  // Se já estiver na tela inicial, não faz nada (nunca fecha o app).
  useEffect(() => {
    const handlePromise = CapApp.addListener('backButton', () => {
      if (locationRef.current !== '/') {
        navigate('/');
      }
    }).catch((err) => {
      console.debug('Capacitor backButton listener indisponível neste ambiente:', err);
      return null;
    });

    return () => {
      handlePromise.then((handler) => {
        if (handler && typeof handler.remove === 'function') {
          handler.remove();
        }
      }).catch(() => {});
    };
  }, [navigate]);
  
  const isMegaSena = activePool?.lotteryType === 'megasena';
  const resultsCollection = isMegaSena ? 'megasena_results' : 'lotofacil_results';
  const [currentContest, setCurrentContest] = useState<number | null>(null);
  const [currentPrize, setCurrentPrize] = useState<number | null>(null);
  
  const [isEditingContest, setIsEditingContest] = useState(false);
  const [customContestInput, setCustomContestInput] = useState('');
  const [showDrawCalendarModal, setShowDrawCalendarModal] = useState(false);
  const [notifPermissionStatus, setNotifPermissionStatus] = useState<NotificationStatusDetails | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Solicita a permissão de notificação em tempo de execução (Android 13+ / One UI)
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await ensureAndroidHighImportanceChannel();
        const res = await requestNotificationPermissionWithDetails();
        setNotifPermissionStatus(res);
        if (!res.granted && (res.display === 'denied' || res.display === 'prompt')) {
          const isDismissed = sessionStorage.getItem('bolao_notif_banner_dismissed');
          if (!isDismissed) {
            setShowPermissionBanner(true);
          }
        }
      } catch (err) {
        console.warn('Erro ao inicializar permissões de notificação:', err);
      }
    };
    initNotifications();
  }, []);

  const contestCalendarInfo = useMemo(() => {
    return getAdjustedActiveContestInfo(
      currentContest,
      activePool?.currentContest,
      isMegaSena ? 'megasena' : 'lotofacil'
    );
  }, [currentContest, activePool?.currentContest, isMegaSena]);

  useEffect(() => {
    if (!user) return;
    const lastRead = localStorage.getItem(`bolao_last_read_chat_${user.uid}`);
    const lastReadDate = lastRead ? new Date(lastRead) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const normalizeMentionStr = (str: string) =>
      String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\([^)]*\)/g, '')
        .trim()
        .toLowerCase();

    const unsub = onSnapshot(q, (snapshot) => {
      let count = 0;
      let latestOtherMessageToday: { text: string; displayName: string } | null = null;
      const todayBR = formatDateBR(new Date());

      const rawDisplayName = String(userData?.displayName || user?.displayName || '').trim();
      const myNameNorm = normalizeMentionStr(rawDisplayName);
      const myShortNameNorm = normalizeMentionStr(formatFirstAndLastName(rawDisplayName));
      const myFirstNameNorm = myNameNorm.split(/\s+/)[0] || '';
      const myPhoneClean = normalizeBrazilianPhoneDigits(userData?.phone || user?.phoneNumber || '');
      const isModUser = isAdmin || userData?.role === 'admin' || userData?.role === 'counselor';

      // Lista de IDs de menções já notificadas neste aparelho
      let notifiedMentionIds: string[] = [];
      try {
        const savedMentions = localStorage.getItem(`bolao_notified_mentions_${user.uid}`);
        if (savedMentions) {
          notifiedMentionIds = JSON.parse(savedMentions);
        }
      } catch {}

      let updatedMentionIds = [...notifiedMentionIds];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status !== 'pending_approval' && !data.deleted) {
          const msgDate = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
            ? new Date(data.createdAt)
            : data.clientTimestampMs
            ? new Date(data.clientTimestampMs)
            : new Date();
          const msgText = String(data.text || '');
          const msgNorm = normalizeMentionStr(msgText);
          const hasMentions = data.hasMentions === true || /@\S+/.test(msgText);
          const mentionEveryone = data.mentionEveryone === true || /@(todos|todo\s*mundo|grupo)\b/i.test(msgNorm);
          const mentionAdmins = data.mentionAdmins === true || /@(administradores|admins|admin|moderadores|clodas)\b/i.test(msgNorm);
          const mentionedIds: string[] = Array.isArray(data.mentionedUserIds) ? data.mentionedUserIds : [];
          const mentionedPhones: string[] = Array.isArray(data.mentionedPhones) ? data.mentionedPhones : [];
          const mentionedNames: string[] = Array.isArray(data.mentionedNames)
            ? data.mentionedNames.map((n: string) => normalizeMentionStr(n))
            : [];

          const isCurrentUserMentioned =
            mentionedIds.includes(user.uid) ||
            (userData?.id && mentionedIds.includes(userData.id)) ||
            (userData?.uid && mentionedIds.includes(userData.uid)) ||
            (myPhoneClean.length >= 10 && mentionedPhones.includes(myPhoneClean)) ||
            (myNameNorm.length >= 2 && (mentionedNames.includes(myNameNorm) || msgNorm.includes(`@${myNameNorm}`))) ||
            (myShortNameNorm.length >= 2 && (mentionedNames.includes(myShortNameNorm) || msgNorm.includes(`@${myShortNameNorm}`))) ||
            (myFirstNameNorm.length >= 2 && new RegExp(`@${myFirstNameNorm}\\b`, 'i').test(msgNorm)) ||
            (mentionAdmins && isModUser);

          // 1. Se houve marcação (@Nome ou @Todos) direcionada a este usuário, sobe NOTIFICAÇÃO IMEDIATA!
          const msgAgeMs = Math.abs(Date.now() - msgDate.getTime());
          const isRecentMention = msgAgeMs < 15 * 60 * 1000;
          if (
            hasMentions &&
            (mentionEveryone || isCurrentUserMentioned) &&
            isRecentMention &&
            !updatedMentionIds.includes(docSnap.id)
          ) {
            updatedMentionIds.push(docSnap.id);
            const senderName = formatFirstAndLastName(data.displayName || 'Participante');
            const mentionTitle = mentionEveryone
              ? `📢 ${senderName} marcou @Todos no Chat`
              : `💬 ${senderName} marcou você no Chat!`;
            const mentionBody = `${senderName}: "${msgText.slice(0, 100)}"`;

            const pushKey = `bolao_pushed_mention_${docSnap.id}_${user.uid}`;
            if (!sessionStorage.getItem(pushKey)) {
              sessionStorage.setItem(pushKey, '1');
              sendAppNotification(mentionTitle, {
                body: mentionBody,
                id: Math.floor(Math.random() * 800000) + 100000,
                category: 'chat_mention',
                uid: user.uid,
                targetPath: '/chat'
              });
            }
          }

          // 2. Contagem de não lidas e notificação diária (1x por dia) para mensagens normais de outros participantes
          if (data.uid !== user.uid && msgDate > lastReadDate) {
            // Se a mensagem marcou alguém específico (e NÃO é @Todos), APENAS a pessoa marcada recebe
            const shouldNotifyThisUser = !hasMentions || mentionEveryone || isCurrentUserMentioned;

            if (shouldNotifyThisUser) {
              count++;
              if (!latestOtherMessageToday && !hasMentions && formatDateBR(msgDate) === todayBR) {
                latestOtherMessageToday = {
                  text: data.text || (data.imageUrl ? '📷 Enviou uma foto no chat' : 'Nova mensagem no chat'),
                  displayName: data.displayName || 'Participante'
                };
              }
            }
          }
        }
      });

      if (updatedMentionIds.length !== notifiedMentionIds.length) {
        try {
          localStorage.setItem(
            `bolao_notified_mentions_${user.uid}`,
            JSON.stringify(updatedMentionIds.slice(-50))
          );
        } catch {}
      }

      setUnreadChatCount(count);

      // Subir 1 notificação por dia caso tenha mensagem normal (sem @) no chat hoje
      if (
        count > 0 &&
        latestOtherMessageToday &&
        location.pathname !== '/chat' &&
        canTriggerDailyChatNotification(user.uid)
      ) {
        markDailyChatNotificationSent(user.uid);
        const targetInfo = latestOtherMessageToday as any;
        const notifTitle = '💬 Novas mensagens hoje no Chat do Bolão';
        const notifBody = count === 1
          ? `${targetInfo.displayName}: "${String(targetInfo.text).slice(0, 80)}"`
          : `Há ${count} novas mensagens no chat hoje (${todayBR}). Toque no ícone de chat para conversar!`;

        sendAppNotification(notifTitle, {
          body: notifBody,
          id: 777001,
          category: 'chat_daily',
          uid: user.uid
        });

        addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: notifTitle,
          message: notifBody,
          type: 'chat',
          read: false,
          createdAt: serverTimestamp()
        }).catch(() => {});
      }
    }, err => console.warn('Unread chat count error:', err));

    return unsub;
  }, [user, userData, isAdmin, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/chat' && user?.uid) {
      localStorage.setItem(`bolao_last_read_chat_${user.uid}`, new Date().toISOString());
      setUnreadChatCount(0);
    }
  }, [location.pathname, user?.uid]);

  // Redireciona quando o usuário toca em uma notificação nativa (Android/iOS) ou Web
  useEffect(() => {
    const handleNavigateEvent = (e: any) => {
      const targetPath = e?.detail?.path;
      if (targetPath) {
        if (targetPath === '/chat' && user?.uid) {
          localStorage.setItem(`bolao_last_read_chat_${user.uid}`, new Date().toISOString());
          setUnreadChatCount(0);
        }
        navigate(targetPath);
      }
    };
    window.addEventListener('bolao_navigate_to', handleNavigateEvent);

    // Se havia uma rota pendente salva ao abrir o app pelo clique na notificação nativa
    const pendingPath = sessionStorage.getItem('bolao_pending_notif_path');
    if (pendingPath) {
      sessionStorage.removeItem('bolao_pending_notif_path');
      navigate(pendingPath);
    }

    return () => window.removeEventListener('bolao_navigate_to', handleNavigateEvent);
  }, [navigate, user?.uid]);

  useEffect(() => {
    const q = query(collection(db, resultsCollection), orderBy('createdAt', 'desc'), limit(1));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const cNum = Number(data.contest);
        if (cNum > 0) {
          setCurrentContest(cNum + 1);
          setCurrentPrize(data.nextEstimatedPrize || null);
        }
      }
    }, err => {
      console.warn('Current contest header fetch error:', err);
    });
    return unsub;
  }, [resultsCollection]);

  useEffect(() => {
    scheduleUpcomingDrawAlerts(isMegaSena ? 'megasena' : 'lotofacil');
  }, [isMegaSena]);

  const { addToast } = useToast();
  const isHome = location.pathname === '/';
  const isChatPage = location.pathname === '/chat';
  const displayContestNum = Math.max(currentContest || 0, activePool?.currentContest || 0);
  const canManageMembers = can('members_edit');

  const handleSaveCustomContest = async () => {
    if (!customContestInput.trim() || !activePool?.id) return;
    try {
      const poolRef = doc(db, 'pools', activePool.id);
      await updateDoc(poolRef, {
        currentContest: Number(customContestInput.trim())
      });
      setIsEditingContest(false);
      addToast('Concurso vigente atualizado com sucesso!', 'success');
    } catch (err) {
      console.error('Error saving custom contest:', err);
      addToast('Erro ao atualizar concurso vigente.', 'error');
    }
  };

  const navLinks = useMemo(() => {
    const links: { to: string; label: string; icon: string; badge?: number }[] = [
      { to: '/', label: 'Apostas', icon: '🎰' },
      { to: '/rules', label: 'Regras', icon: '📜' },
      { to: '/calendar', label: 'Calendário', icon: '📅' },
      { to: '/desdobramentos', label: 'Desdobramentos', icon: '🎯' },
      { to: '/chat', label: 'Chat', icon: '💬' },
      { to: '/historico-boloes', label: 'Histórico', icon: '📜' },
    ];

    if (can('members_view')) {
      links.push({
        to: '/contatos',
        label: 'Contatos',
        icon: '👥',
        badge: canManageMembers && totalPendingCount > 0 ? totalPendingCount : undefined
      } as any);
    }

    if (can('whatsapp_view')) {
      links.push({ to: '/whatsapp', label: 'WhatsApp', icon: '📢' } as any);
    }

    links.push({ to: '/permissoes', label: 'Ajuda / Papéis', icon: '🛡️' } as any);

    links.push({ to: '/configuracoes', label: 'Configurações', icon: '⚙️' } as any);

    return links;
  }, [can, canManageMembers, totalPendingCount]);

  const isUserApproved = userData?.approved === true || isAdmin;

  const isSettingPassword = user && userData?.approved === true && !userData?.passwordSet && !isAdmin;
  const hideHeader = !user || isSettingPassword;

  if (user && !isUserApproved) {
    return <WaitingForApprovalScreen user={user} userData={userData} onSignOut={onSignOut} />;
  }

  if (isSettingPassword) {
    return (
      <SetPasswordModal 
        userId={userData.id} 
        onClose={() => {
          // If admin skips, we just let them through this session
          if (isAdmin) {
            onUpdateUserData?.({ ...userData, passwordSet: 'skipped' });
          }
        }} 
        onSuccess={() => onUpdateUserData?.({ ...userData, passwordSet: true })}
        onSignOut={onSignOut}
        canSkip={isAdmin}
      />
    );
  }

  return (
    <div
      className={`${isChatPage ? 'h-dvh overflow-hidden' : 'min-h-dvh'} flex flex-col bg-gray-50 text-gray-800 selection:bg-blue-600 selection:text-white`}
    >
      {!hideHeader && (
        <header
          style={{ paddingTop: 'calc(var(--safe-top, 0px) + 0.625rem)', top: 'var(--safe-top, 0px)' }}
          className="bg-black text-white pb-2.5 px-3 sm:px-4 shadow-lg border-b border-white/10 shrink-0 sticky z-50 w-full"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
              {/* Logo */}
              <div className="flex items-center gap-2 min-w-0">
                  <div 
                    onClick={() => navigate('/')}
                    className="font-black text-sm sm:text-xl tracking-wide flex items-center gap-2 hover:opacity-95 transition cursor-pointer py-0.5 shrink-0"
                    title="Página Inicial do Bolão"
                  >
                    <img src={logoImg} alt="Logotipo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white/60 shadow-md shrink-0" />
                    <span className="font-black text-white text-sm sm:text-lg truncate drop-shadow-xs">Bolão Amigos</span>
                  </div>
                </div>

              {/* Chat & Notificações */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Ícone do Chat ao lado da Notificação (abre ou fecha ao clicar novamente) */}
                <button
                  onClick={() => {
                    if (user?.uid) {
                      localStorage.setItem(`bolao_last_read_chat_${user.uid}`, new Date().toISOString());
                      setUnreadChatCount(0);
                    }
                    if (location.pathname === '/chat') {
                      navigate('/');
                    } else {
                      navigate('/chat');
                    }
                  }}
                  className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center border ${
                    location.pathname === '/chat'
                      ? 'bg-white/30 text-white border-white/40 shadow-inner'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                  title={location.pathname === '/chat' ? 'Fechar Chat' : 'Abrir Chat do Bolão'}
                >
                  <span className="text-base sm:text-lg">💬</span>
                  {unreadChatCount > 0 && location.pathname !== '/chat' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-blue-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-blue-900 animate-bounce shadow-sm">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </button>

                <NotificationBell />
                
                {/* Botão Menu Mobile */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer relative"
                >
                  <span>{mobileMenuOpen ? '✕' : '☰'}</span>
                  {totalPendingCount > 0 && canManageMembers && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-blue-800 animate-pulse">
                      {totalPendingCount}
                    </span>
                  )}
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
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 relative ${
                      active ? 'bg-white/20 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-0.5 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full shadow-xs animate-pulse">
                        {link.badge}
                      </span>
                    )}
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
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      active ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </span>
                    {link.badge && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                        {link.badge} pendente(s)
                      </span>
                    )}
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
      )}

      {/* Banner de Simulação Ativa para o Administrador */}
      {isSimulating && (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-sm border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="text-base animate-bounce">👁️</span>
            <span>
              MODO SIMULAÇÃO ATIVO: Você está navegando com os acessos de <strong>{simulatedRole === 'counselor' ? '🛡️ Conselheiro' : '👥 Participante'}</strong>.
            </span>
          </div>
          <button
            onClick={() => setSimulatedRole(null)}
            className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded-lg text-[11px] font-black transition cursor-pointer shadow-xs"
          >
            Sair da Simulação ✕
          </button>
        </div>
      )}

      {/* Sub-header com Concurso Vigente Sincronizado (oculto no Chat) */}
      {!hideHeader && !isChatPage && (
        <div className="bg-emerald-50 border-b border-emerald-100 py-1.5 px-2.5 sm:px-4 text-xs font-semibold text-emerald-900 shadow-2xs w-full">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-gray-700 font-semibold text-[11px] sm:text-xs whitespace-nowrap">
                <span className="hidden xs:inline">Concurso </span>Vigente:
              </span>
              
              {isEditingContest ? (
                <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                  <input
                    type="number"
                    placeholder="Ex: 3251"
                    value={customContestInput}
                    onChange={(e) => setCustomContestInput(e.target.value)}
                    className="w-20 bg-white border border-emerald-300 rounded px-1.5 py-0.5 text-xs text-gray-800 font-bold focus:outline-emerald-600"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveCustomContest}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition shadow-2xs"
                    title="Salvar Concurso"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditingContest(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  {displayContestNum ? (
                    <span className="bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] shadow-2xs whitespace-nowrap tabular-nums">
                      #{displayContestNum}
                    </span>
                  ) : (
                    <span className="text-emerald-600/70 text-[11px] animate-pulse whitespace-nowrap">Sincronizando...</span>
                  )}
                  
                  {currentPrize && (
                    <div className="flex items-center gap-1 animate-in fade-in duration-300">
                      <span className="hidden sm:inline text-gray-400 font-medium text-[11px]">Prêmio:</span>
                      <span className="bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] border border-amber-200/80 flex items-center gap-0.5 whitespace-nowrap tabular-nums">
                        <span className="text-[9px] opacity-75 font-bold">R$</span>
                        <span>{currentPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </span>
                    </div>
                  )}

                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowDrawCalendarModal(true)}
                className="bg-white hover:bg-emerald-100/60 text-emerald-800 font-extrabold px-2 py-1 rounded-lg text-[10px] sm:text-[11px] border border-emerald-200 transition flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                title="Ver Calendário Oficial de Sorteios e Feriados Nacionais"
              >
                <span>📅</span>
                <span>Calendário<span className="hidden sm:inline"> Caixa</span></span>
              </button>

              <div className="hidden md:flex text-[10px] text-emerald-700/80 uppercase font-bold tracking-wider items-center gap-1.5 bg-emerald-100/50 px-2 py-1 rounded-md whitespace-nowrap">
                <span>
                  {!contestCalendarInfo.isTodayDrawDay 
                    ? `⚠️ ${contestCalendarInfo.nextDrawDayName} (${contestCalendarInfo.nextDrawFormatted})` 
                    : (activePool?.currentContest > (currentContest || 0) ? '📌 Forçado por Admin' : '🟢 Sincronizado')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Calendário de Sorteios & Feriados Caixa */}
      {showDrawCalendarModal && (
        <DrawCalendarModal onClose={() => setShowDrawCalendarModal(false)} />
      )}

      {/* Conteúdo Principal */}
      <main
        className={`flex-1 max-w-4xl w-full mx-auto overflow-x-hidden ${
          isChatPage
            ? 'flex flex-col min-h-0 p-0 sm:px-4 sm:py-2 pb-[var(--safe-bottom,0px)] overflow-hidden'
            : 'px-2.5 py-3 sm:p-5'
        }`}
      >
        {/* Banner de Permissão de Notificação (Android 13+ / Samsung One UI) */}
        {showPermissionBanner && !isChatPage && (
          <div className="mb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border border-amber-400/40">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shrink-0 shadow-xs animate-bounce">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                    Notificações Desativadas no Celular
                  </h4>
                  <span className="bg-white text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {notifPermissionStatus?.display === 'denied' ? 'Negada (denied)' : 'Pendente'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 mt-0.5 leading-snug">
                  Para receber avisos imediatos de sorteios, prêmios e mensagens (mesmo com o app fechado no Android / Samsung One UI), ative as notificações.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  const res = await requestNotificationPermissionWithDetails();
                  setNotifPermissionStatus(res);
                  if (res.granted) {
                    setShowPermissionBanner(false);
                    addToast('Notificações ativadas com sucesso!', 'success');
                  } else {
                    setShowPermissionGuide(true);
                  }
                }}
                className="bg-white hover:bg-amber-50 text-amber-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>✨</span>
                <span>Permitir Notificações</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPermissionGuide(true)}
                className="bg-amber-950/60 hover:bg-amber-950 text-white font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer border border-white/20"
              >
                ⚙️ Como Ativar
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPermissionBanner(false);
                  sessionStorage.setItem('bolao_notif_banner_dismissed', 'true');
                }}
                className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg transition cursor-pointer"
                title="Fechar aviso temporariamente"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Modal de Guia de Configuração de Notificações */}
        {showPermissionGuide && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Como Ativar Notificações no Celular</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPermissionGuide(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-gray-600 space-y-3">
                <p className="font-semibold text-gray-800">
                  No Android (Samsung One UI, Xiaomi, Motorola, etc.), as notificações precisam ser autorizadas no sistema operacional:
                </p>

                <ol className="list-decimal pl-5 space-y-2 font-medium">
                  <li>Abra as <strong>Configurações</strong> do seu celular.</li>
                  <li>Toque em <strong>Aplicativos</strong> e procure por <strong>Bolão Amigos</strong>.</li>
                  <li>Toque em <strong>Notificações</strong> e marque a opção <strong>Permitir notificações</strong>.</li>
                  <li>Em <em>Categorias de Notificações</em>, verifique se o canal <strong>Notificações</strong> está ativado.</li>
                  <li>Em <em>Bateria</em>, selecione <strong>Não restrita</strong> para que o sistema não congele os alertas com o app fechado.</li>
                </ol>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await requestNotificationPermissionWithDetails();
                    setNotifPermissionStatus(res);
                    if (res.granted) {
                      setShowPermissionGuide(false);
                      setShowPermissionBanner(false);
                      addToast('Permissão concedida com sucesso!', 'success');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  🔄 Verificar se Ativou
                </button>
                <button
                  type="button"
                  onClick={() => setShowPermissionGuide(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Banner de Pedidos Pendentes (Entradas e Cotas) */}
        {totalPendingCount > 0 && canManageMembers && (
          <div className="mb-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border border-red-400/40">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shrink-0 shadow-xs animate-bounce">
                📢
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                    {totalPendingCount} Pedido(s) Pendente(s) de Aprovação
                  </h4>
                  <span className="bg-white text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Ação Necessária
                  </span>
                </div>
                <p className="text-[11px] text-red-100 mt-0.5 leading-relaxed">
                  {pendingJoinRequests.length > 0 && `• ${pendingJoinRequests.length} nova(s) solicitação(ões) de entrada`}
                  {pendingJoinRequests.length > 0 && pendingQuotaRequests.length > 0 && ' '}
                  {pendingQuotaRequests.length > 0 && `• ${pendingQuotaRequests.length} pedido(s) de alteração de cota`}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/contatos')}
              className="bg-white hover:bg-red-50 text-red-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 shrink-0"
            >
              <span>Ver e Aprovar na Lista</span>
              <span>➔</span>
            </button>
          </div>
        )}

        {isQuotaExceeded && (
          <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 relative">
            <button
              onClick={() => setIsQuotaExceeded(false)}
              className="absolute top-2 right-2 text-amber-700 hover:text-amber-900 p-1 text-sm font-bold cursor-pointer transition"
              title="Fechar aviso temporariamente"
            >
              ✕
            </button>
            <div className="flex pr-6">
              <div className="flex-shrink-0 text-xl">⚠️</div>
              <div className="ml-3">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                  Limite de Cota do Firestore / AI Atingido
                </p>
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                  O limite diário gratuito de operações foi atingido. O aplicativo está utilizando cache local e dados em memória.
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <a
                    href="https://console.firebase.google.com/project/bolao-entre-amigos-78804/firestore/databases/(default)/data?openUpgradeDialog=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase shadow-sm"
                  >
                    Abrir Firebase Console ➔
                  </a>
                  <button
                    onClick={() => setIsQuotaExceeded(false)}
                    className="inline-flex items-center bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase border border-amber-300"
                  >
                    Ocultar Aviso
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}

        {!isHome && !isChatPage && (
          <div className="mt-8 mb-4 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white font-extrabold text-xs shadow-md hover:scale-102 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10"
              title="Voltar à página inicial"
            >
              <span>←</span> Voltar para o Início
            </button>
          </div>
        )}

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
                  <img src={logoImg} alt="Logotipo" className="w-24 h-24 rounded-2xl shadow-lg border-4 border-blue-50 object-cover cursor-pointer hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-blue-900">Bolão Amigos</h3>
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
                  src={logoImg} 
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

      {!isChatPage && (
        <footer 
          style={{ paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))', paddingTop: '1rem' }} 
          className="text-center text-[11px] text-gray-300 border-t border-white/10 bg-black mt-auto"
        >
          Bolão Amigos &copy; {new Date().getFullYear()} — Todos os direitos reservados.
        </footer>
      )}
    </div>
  );
}

function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission: PermissionKey }) {
  const { can, loading } = usePermissions();
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-semibold text-sm">
        Carregando permissões...
      </div>
    );
  }
  if (!can(permission)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
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
  const [showHowToUseModal, setShowHowToUseModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const { addToast } = useToast();

  // Configura a StatusBar do Android/iOS para não sobrepor o WebView e ter a cor do cabeçalho
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#1e3a8a' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  const activeUser = user || (phoneUser ? phoneUser.sessionUser : null);
  const activeUserData = userData || (phoneUser ? phoneUser.memberData : null);

  const isUserAdmin = activeUserData?.role === 'admin' ||
    activeUser?.email === 'clodas12345@gmail.com' ||
    phoneUser?.sessionUser?.uid?.startsWith('admin_phone_') ||
    (activeUserData?.phone && normalizeBrazilianPhoneDigits(activeUserData.phone).includes('11953292570')) ||
    (activeUser?.phoneNumber && normalizeBrazilianPhoneDigits(activeUser.phoneNumber).includes('11953292570'));

  const handleSignOut = () => {
    localStorage.removeItem('bolao_phone_user');
    setPhoneUser(null);
    signOut(auth);
  };

  useEffect(() => {
    if (!phoneUser?.sessionUser?.uid) return;
    const phoneUid = phoneUser.sessionUser.uid;

    if (phoneUid.startsWith('admin_phone_')) {
      return;
    }

    const unsubMember = onSnapshot(doc(db, 'members', phoneUid), (docSnap) => {
      if (docSnap.exists()) {
        const mData = docSnap.data();
        if (isUserAdmin || mData.email === 'clodas12345@gmail.com' || (mData.phone && normalizeBrazilianPhoneDigits(mData.phone).includes('11953292570'))) {
          mData.role = 'admin';
        }
        const updated = {
          sessionUser: phoneUser.sessionUser,
          memberData: { id: docSnap.id, ...mData }
        };
        setPhoneUser(updated);
        localStorage.setItem('bolao_phone_user', JSON.stringify(updated));
      } else {
        const unsubUser = onSnapshot(doc(db, 'users', phoneUid), (userSnap) => {
          if (userSnap.exists()) {
            const uData = userSnap.data();
            if (isUserAdmin || uData.email === 'clodas12345@gmail.com' || (uData.phone && normalizeBrazilianPhoneDigits(uData.phone).includes('11953292570'))) {
              uData.role = 'admin';
            }
            const updated = {
              sessionUser: phoneUser.sessionUser,
              memberData: { id: userSnap.id, ...uData }
            };
            setPhoneUser(updated);
            localStorage.setItem('bolao_phone_user', JSON.stringify(updated));
          }
        });
        return () => unsubUser();
      }
    });

    return () => unsubMember();
  }, [phoneUser?.sessionUser?.uid]);

  useEffect(() => {
    // Inicialização e sincronização automática dos sorteios oficiais + conferência automática do jogo do dia
    const syncLatestLotteryResults = async () => {
      try {
        // 1. Limpeza apenas de dados explicitamente marcados como simulados/inválidos no cache
        const cachedLatest = localStorage.getItem('bolao_cache_latest_result');
        if (cachedLatest) {
          try {
            const parsed = JSON.parse(cachedLatest);
            const num = Number(parsed?.contest);
            if (!num || parsed?.isSimulated) {
              localStorage.removeItem('bolao_cache_latest_result');
            }
          } catch {
            localStorage.removeItem('bolao_cache_latest_result');
          }
        }

        // 2. Busca o resultado oficial mais recente da Lotofácil e Mega-Sena e confere automaticamente se o jogo do dia foi premiado
        const lotoResult = await fetchLotteryResultDirectly('lotofacil', 'latest');
        if (lotoResult && lotoResult.contest > 0) {
          console.log(`[Auto-Sync] Sorteio oficial Lotofácil #${lotoResult.contest} sincronizado`);
          await checkAndNotifyWinningGamesForResult('lotofacil', lotoResult);
        }

        const megaResult = await fetchLotteryResultDirectly('megasena', 'latest');
        if (megaResult && megaResult.contest > 0) {
          console.log(`[Auto-Sync] Sorteio oficial Mega-Sena #${megaResult.contest} sincronizado`);
          await checkAndNotifyWinningGamesForResult('megasena', megaResult);
        }
      } catch (err) {
        console.warn('[Auto-Sync] Erro na sincronização inicial de resultados:', err);
      }
    };

    syncLatestLotteryResults();

    // Sincronização periódica em segundo plano (a cada 2 minutos)
    const interval = setInterval(() => {
      syncLatestLotteryResults();
    }, 120000);

    // Quando o app volta do segundo plano ou a tela é desbloqueada, confere imediatamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLatestLotteryResults();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Quando uma notificação agendada ou push nativo no Android é tocada, leva até o local da notificação (ex: /chat)
    let notifReceivedListener: any = null;
    let notifActionListener: any = null;
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationReceived', () => {
        syncLatestLotteryResults();
      }).then(h => { notifReceivedListener = h; }).catch(() => {});

      LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction: any) => {
        const notif = notificationAction?.notification || {};
        const extra = notif.extra || {};
        const targetPath = resolveNotificationTargetPath({
          targetPath: extra.targetPath,
          category: extra.category,
          title: notif.title,
          body: notif.body
        });

        try {
          sessionStorage.setItem('bolao_pending_notif_path', targetPath);
          window.dispatchEvent(
            new CustomEvent('bolao_navigate_to', { detail: { path: targetPath } })
          );
        } catch {}

        syncLatestLotteryResults();
      }).then(h => { notifActionListener = h; }).catch(() => {});
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (notifReceivedListener?.remove) notifReceivedListener.remove();
      if (notifActionListener?.remove) notifActionListener.remove();
    };
  }, []);

  useEffect(() => {
    let unsubUserRealtime = () => {};

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      unsubUserRealtime(); // Cancela listener anterior se houver

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const memberDocRef = doc(db, 'members', currentUser.uid);

        // Listener em tempo real para mudanças no cadastro do usuário
        unsubUserRealtime = onSnapshot(userDocRef, async (userSnap) => {
          if (userSnap.exists()) {
            const uData = userSnap.data();
            setUserData(uData);
            try {
              localStorage.setItem('bolao_cache_user_data', JSON.stringify(uData));
            } catch (cacheErr) {
              console.warn('Failed to cache user data:', cacheErr);
            }
            setLoading(false);
          } else {
            // Se não existe na coleção 'users', verifica 'members'
            try {
              const memberSnap = await getDoc(memberDocRef);
              if (memberSnap.exists()) {
                // Se existe em 'members', escuta mudanças em tempo real lá
                unsubUserRealtime = onSnapshot(memberDocRef, (memSnap) => {
                  if (memSnap.exists()) {
                    const mData = memSnap.data();
                    setUserData(mData);
                    try {
                      localStorage.setItem('bolao_cache_user_data', JSON.stringify(mData));
                    } catch (cacheErr) {
                      console.warn('Failed to cache member data:', cacheErr);
                    }
                  }
                  setLoading(false);
                });
              } else {
                // Novo usuário via Google: cadastra com approved = false (exceto admin clodas)
                const isAdminEmail = currentUser.email === 'clodas12345@gmail.com';
                const defaultData = {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName || 'Participante',
                  role: isAdminEmail ? 'admin' : 'participante',
                  approved: isAdminEmail ? true : false,
                  createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, defaultData);
                setUserData(defaultData);
                try {
                  localStorage.setItem('bolao_cache_user_data', JSON.stringify(defaultData));
                } catch (cacheErr) {
                  console.warn('Failed to cache default user data:', cacheErr);
                }
                setLoading(false);
              }
            } catch (err) {
              console.warn('Erro ao verificar coleção members:', err);
              setLoading(false);
            }
          }
        }, async (snapErr) => {
          console.warn('Erro no listener em tempo real, usando fallback de getDoc:', snapErr);
          // Fallback silencioso via getDoc em caso de erro de regras/permissões iniciais
          try {
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const uData = userSnap.data();
              setUserData(uData);
            } else {
              const memberSnap = await getDoc(memberDocRef);
              if (memberSnap.exists()) {
                const mData = memberSnap.data();
                setUserData(mData);
              }
            }
          } catch (fbErr) {
            console.error('Fallback fetch user error:', fbErr);
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      unsubUserRealtime();
    };
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
      <div className="min-h-dvh h-full flex items-center justify-center bg-gray-50 text-gray-600 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-lg animate-pulse object-cover border border-gray-200 shadow-xs" />
          <span>Carregando Bolão Amigos...</span>
        </div>
      </div>
    );
  }

  return (
    <PoolProvider>
      <PermissionsProvider>
        <PendingRequestsProvider>
          <UploadProvider>
            <BrowserRouter>
            <Layout user={activeUser} userData={activeUserData} isAdmin={isUserAdmin} onSignOut={handleSignOut} onUpdateUserData={setUserData}>
            <Routes>
              <Route path="/upload-receipt" element={<PublicReceiptUpload />} />
              <Route path="/historico-boloes" element={<ProtectedRoute permission="members_edit"><MonthlySnapshotManager /></ProtectedRoute>} />
          <Route path="/" element={
            activeUser ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Cabeçalho do Usuário com Acesso Direto à Edição do Cadastro */}
                  <div 
                    onClick={() => setShowEditProfileModal(true)}
                    className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group select-none"
                    title="Clique para editar seus dados de cadastro"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-blue-600 transition flex items-center gap-1.5">
                          <span>👋</span> Bem-vindo, {formatFirstAndLastName(activeUser.displayName || activeUser.email)}
                        </h1>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Perfil: <span className="font-semibold text-blue-600 uppercase">
                          {
                            (activeUserData?.role === 'admin' || activeUser?.email === 'clodas12345@gmail.com' || phoneUser?.sessionUser?.uid?.startsWith('admin_phone_') || (activeUserData?.phone && normalizeBrazilianPhoneDigits(activeUserData.phone).includes('11953292570')) || activeUser?.email === 'clodas12345@gmail.com')
                              ? 'Administrador'
                              : (activeUserData?.role === 'counselor' ? 'Conselheiro' : 'Participante')
                          }
                        </span>
                      </p>
                    </div>

                    <div className="text-gray-400 group-hover:text-blue-600 transition font-bold text-xs sm:text-sm flex items-center gap-1">
                      <span className="hidden xs:inline">Meu Cadastro</span>
                      <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>

                  {/* Componente para Membros enviarem suas apostas (apenas se houver liberação ativa) */}
                  {activeUser && (
                    <MemberBetSubmission user={activeUser} userData={activeUserData} />
                  )}

                  {/* 1. Tabela de Jogos Cadastrados, Apostas e Resultado Oficial Caixa Unificado */}
                  <GamesTable onOpenNewGame={() => setShowNewGameModal(true)} />

                  {/* 2. Dashboard Financeiro Principal (Apenas Admin) */}
                  {isUserAdmin && (
                    <div className="bg-white rounded-xl shadow-xs border overflow-hidden">
                      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-sm text-gray-800">📊 Painel Financeiro e Caixa</h2>
                        <div className="flex items-center gap-2">
                          {(activeUserData?.role === 'admin' || activeUserData?.role === 'counselor' || activeUser?.email === 'clodas12345@gmail.com' || (activeUserData?.phone && normalizeBrazilianPhoneDigits(activeUserData.phone).includes('11953292570'))) && (
                            <>
                              <button
                                onClick={() => window.print()}
                                className="bg-purple-900 hover:bg-purple-800 text-white text-xs font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <span>🖨️</span> Imprimir Relatório
                              </button>
                              <ExportButton />
                            </>
                          )}
                        </div>
                      </div>
                      <FinancialDashboard />
                    </div>
                  )}

                  {/* 4. Gráficos Visuais Avançados (Apenas Admin) */}
                  {isUserAdmin && <VisualChartsDashboard />}

                  {/* 5. Relatório Financeiro Detalhado (Apenas Admin) */}
                  {isUserAdmin && (
                    <div className="bg-white rounded-xl shadow-xs border p-4 space-y-6">
                      <DetailedFinancialReport />
                    </div>
                  )}

                  {/* 6. Prestação de Contas a cada 10 Dias (Decêndios) */}
                  {isUserAdmin && (
                    <div className="space-y-6">
                      <DecendioReminderBanner isAdmin={isUserAdmin} />
                      <TenDayAccountabilityReport />
                    </div>
                  )}

                  {/* Modais do Sistema */}
                  {showHowToUseModal && <HowToUseModal onClose={() => setShowHowToUseModal(false)} />}
                  {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}
                  {showNewGameModal && <NewGameModal onClose={() => setShowNewGameModal(false)} />}
                  {showEditProfileModal && (
                    <EditProfileModal
                      user={activeUser}
                      userData={activeUserData}
                      onClose={() => setShowEditProfileModal(false)}
                      onSaved={(updated) => {
                        if (userData) setUserData((prev: any) => ({ ...prev, ...updated }));
                        if (phoneUser) {
                          setPhoneUser((prev: any) => ({
                            ...prev,
                            memberData: { ...(prev?.memberData || {}), ...updated },
                            sessionUser: { ...(prev?.sessionUser || {}), displayName: updated.displayName }
                          }));
                        }
                      }}
                    />
                  )}
                </div>
            ) : (
              <div className="min-h-[80vh] flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4 border border-gray-100">
                  <div className="flex justify-center">
                    <img src={logoImg} alt="Logo" className="w-24 h-24 rounded-2xl shadow-md object-cover border border-gray-100 animate-pulse" />
                  </div>
                  <h1 className="text-xl font-black text-gray-950 text-center">Bolão Amigos</h1>
                  
                  <PhoneLoginModal
                    isInline={true}
                    onPhoneLoginSuccess={(member) => {
                      const sessionUser = {
                        uid: member.id || 'phone_user',
                        email: member.email || `${member.phone}@bolao.local`,
                        displayName: member.displayName || 'Participante'
                      };
                      const memberData = {
                        ...member,
                        approved: member.approved === true, // Strict check: only true becomes true
                        role: member.role || 'participante'
                      };
                      setPhoneUser({ sessionUser, memberData });
                      localStorage.setItem('bolao_phone_user', JSON.stringify({ sessionUser, memberData }));
                    }}
                  />
                </div>
              </div>
            )
          } />
           <Route path="/contatos" element={activeUser ? <ProtectedRoute permission="members_view"><MembersList /></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/chat" element={activeUser ? <Chat /> : <Navigate to="/" />} />
          <Route path="/whatsapp" element={activeUser ? <ProtectedRoute permission="whatsapp_view"><WhatsAppHub /></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/desdobramentos" element={activeUser ? <LotofacilDesdobramento /> : <Navigate to="/" />} />
          <Route path="/calendar" element={activeUser ? <CalendarAgenda /> : <Navigate to="/" />} />
          <Route path="/backtest" element={activeUser ? <LotofacilBacktester /> : <Navigate to="/" />} />
          <Route path="/charts" element={activeUser ? <VisualChartsDashboard /> : <Navigate to="/" />} />
          <Route path="/card-generator" element={activeUser ? <VictoryCardGenerator /> : <Navigate to="/" />} />
          <Route path="/profile" element={activeUser ? <UserProfile /> : <Navigate to="/" />} />
          <Route path="/rules" element={activeUser ? <RulesAndNorms /> : <Navigate to="/" />} />
          <Route path="/permissoes" element={activeUser ? <RolesGuide /> : <Navigate to="/" />} />
          <Route path="/configuracoes" element={activeUser ? <Settings /> : <Navigate to="/" />} />
        </Routes>
          </Layout>
        </BrowserRouter>
        </UploadProvider>
        </PendingRequestsProvider>
      </PermissionsProvider>
    </PoolProvider>
  );
}
