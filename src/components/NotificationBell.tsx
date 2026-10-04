import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, limit, writeBatch, updateDoc } from 'firebase/firestore';
import { db, auth, isQuotaError } from '../lib/firebase';
import { usePool } from '../lib/PoolContext';
import { getUserNotificationPreferences, UserNotificationPreferences, resolveNotificationTargetPath, sendAppNotification } from '../lib/notifications';
import { formatAnyDateBR } from '../lib/formatters';

export default function NotificationBell() {
  const { setIsQuotaExceeded } = usePool();
  const navigate = useNavigate();
  const initialLoadDoneRef = useRef(false);
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('bolao_cache_notifications');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = auth.currentUser;
  const activeUid = useMemo(() => {
    if (currentUser?.uid) return currentUser.uid;
    try {
      const phoneSaved = localStorage.getItem('bolao_phone_user');
      if (phoneSaved) {
        const parsed = JSON.parse(phoneSaved);
        return parsed?.sessionUser?.uid || null;
      }
    } catch {}
    return null;
  }, [currentUser]);

  const [prefs, setPrefs] = useState<UserNotificationPreferences>(() => getUserNotificationPreferences(activeUid));

  useEffect(() => {
    setPrefs(getUserNotificationPreferences(activeUid));
    const handlePrefsUpdate = () => {
      setPrefs(getUserNotificationPreferences(activeUid));
    };
    window.addEventListener('bolao_notif_prefs_updated', handlePrefsUpdate);
    return () => window.removeEventListener('bolao_notif_prefs_updated', handlePrefsUpdate);
  }, [activeUid]);

  useEffect(() => {
    if (!activeUid) return;
    initialLoadDoneRef.current = false;

    // Listen for notifications for this user OR broadcast to 'all'
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [activeUid, 'all']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(list);

      // Dispara push nativo instantâneo caso chegue uma nova notificação direcionada em tempo real
      if (initialLoadDoneRef.current) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const nData = change.doc.data();
            if (!nData.read && nData.isDirectMention) {
              const pushedKey = `bolao_pushed_notif_${change.doc.id}`;
              if (!sessionStorage.getItem(pushedKey)) {
                sessionStorage.setItem(pushedKey, '1');
                sendAppNotification(nData.title || '💬 Nova menção no Chat', {
                  body: nData.message || '',
                  category: 'chat_mention',
                  uid: activeUid,
                  targetPath: '/chat'
                });
              }
            }
          }
        });
      } else {
        initialLoadDoneRef.current = true;
      }

      try {
        localStorage.setItem('bolao_cache_notifications', JSON.stringify(list));
      } catch (cacheErr) {
        console.warn('Failed to cache notifications:', cacheErr);
      }
    }, err => {
      console.warn('Notifications snapshot error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      
      const cached = localStorage.getItem('bolao_cache_notifications');
      if (cached) {
        try { setNotifications(JSON.parse(cached)); } catch {}
      }
    });

    return () => unsubscribe();
  }, [activeUid]);

  const visibleNotifications = useMemo(() => {
    if (!prefs.pushEnabled) return [];
    return notifications.filter(notif => {
      const titleLower = String(notif.title || '').toLowerCase();
      if (notif.type === 'chat' || titleLower.includes('chat')) {
        return prefs.chatDailyNotification !== false;
      }
      if (titleLower.includes('novo concurso') || titleLower.includes('novas apostas')) {
        return prefs.newContestNotification !== false;
      }
      if (notif.type === 'prize' || titleLower.includes('premiad') || titleLower.includes('rateio')) {
        return prefs.winningPrizeAlerts !== false;
      }
      if (titleLower.includes('resultado')) {
        return prefs.officialResultsAlerts !== false;
      }
      if (notif.type === 'payment' || notif.type === 'alert' || notif.type === 'info') {
        return prefs.paymentAndSystemAlerts !== false;
      }
      return true;
    });
  }, [notifications, prefs]);

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    const unread = visibleNotifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        if (!String(n.id).startsWith('local_')) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all as read:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.read && notif.id && !String(notif.id).startsWith('local_')) {
      updateDoc(doc(db, 'notifications', notif.id), { read: true }).catch(() => {});
    }
    const targetPath = resolveNotificationTargetPath({
      targetPath: notif.targetPath,
      type: notif.type,
      title: notif.title,
      body: notif.message
    });
    setIsOpen(false);
    navigate(targetPath);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllAsRead();
        }}
        className="relative p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <h4 className="font-black text-sm uppercase tracking-wider">Avisos do Bolão</h4>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
            
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {visibleNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <span className="text-3xl block mb-2">🎈</span>
                  <p className="text-xs font-bold uppercase">Sem notificações no momento</p>
                </div>
              ) : (
                visibleNotifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 flex gap-3 hover:bg-indigo-50/60 active:bg-indigo-100/60 transition cursor-pointer ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                    title="Toque para abrir"
                  >
                    <div className="text-2xl mt-0.5">
                      {notif.type === 'prize' ? '💰' : notif.type === 'chat' ? '💬' : notif.type === 'alert' ? '🚨' : notif.type === 'payment' ? '💳' : 'ℹ️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className={`text-sm font-bold ${!notif.read ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">
                          {notif.createdAt?.toDate ? `${formatAnyDateBR(notif.createdAt)} • ${notif.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Agora'}
                        </span>
                        <span className="text-[10px] font-black text-indigo-600">
                          Abrir →
                        </span>
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0"></div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 bg-gray-50 border-t text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
