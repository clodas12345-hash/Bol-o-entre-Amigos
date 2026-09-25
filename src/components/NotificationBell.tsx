import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, limit, writeBatch } from 'firebase/firestore';
import { db, auth, isQuotaError } from '../lib/firebase';
import { usePool } from '../lib/PoolContext';

export default function NotificationBell() {
  const { setIsQuotaExceeded } = usePool();
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

  useEffect(() => {
    if (!currentUser) return;

    // Listen for notifications for this user OR broadcast to 'all'
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [currentUser.uid, 'all']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(list);
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
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all as read:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    }
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
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <span className="text-3xl block mb-2">🎈</span>
                  <p className="text-xs font-bold uppercase">Sem notificações no momento</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`p-4 flex gap-3 hover:bg-gray-50 transition ${!notif.read ? 'bg-indigo-50/30' : ''}`}>
                    <div className="text-2xl mt-0.5">
                      {notif.type === 'prize' ? '💰' : notif.type === 'alert' ? '🚨' : notif.type === 'payment' ? '💳' : 'ℹ️'}
                    </div>
                    <div className="flex-1">
                      <h5 className={`text-sm font-bold ${!notif.read ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-gray-400 font-bold uppercase mt-2 block">
                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                      </span>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
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
