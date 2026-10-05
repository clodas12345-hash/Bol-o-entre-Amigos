import React, { useState, useEffect, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

interface PushBannerItem {
  id: string;
  title: string;
  body: string;
  targetPath: string;
}

const ToastContext = createContext({
  addToast: (message: string, type: ToastType = 'info') => {},
});

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pushBanners, setPushBanners] = useState<PushBannerItem[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9) + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  useEffect(() => {
    const handlePushBanner = (e: any) => {
      const detail = e?.detail;
      if (!detail || !detail.title) return;
      const bannerId = `${detail.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newBanner: PushBannerItem = {
        id: bannerId,
        title: detail.title,
        body: detail.body || '',
        targetPath: detail.targetPath || '/chat'
      };
      setPushBanners((prev) => [newBanner, ...prev].slice(0, 3));
      setTimeout(() => {
        setPushBanners((prev) => prev.filter((b) => b.id !== bannerId));
      }, 6500);
    };

    window.addEventListener('bolao_in_app_push_banner', handlePushBanner);
    return () => window.removeEventListener('bolao_in_app_push_banner', handlePushBanner);
  }, []);

  const handleBannerClick = (banner: PushBannerItem) => {
    setPushBanners((prev) => prev.filter((b) => b.id !== banner.id));
    try {
      window.dispatchEvent(
        new CustomEvent('bolao_navigate_to', { detail: { path: banner.targetPath } })
      );
    } catch {}
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Banner de Notificação Push no Topo (aparece imediatamente quando a pessoa é marcada no chat ou recebe alerta) */}
      {pushBanners.length > 0 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[120] w-[94vw] max-w-md flex flex-col gap-2 pointer-events-none"
          style={{ top: 'calc(var(--safe-top, 0px) + 12px)' }}
        >
          {pushBanners.map((banner) => (
            <div
              key={banner.id}
              onClick={() => handleBannerClick(banner)}
              className="pointer-events-auto cursor-pointer bg-slate-900/95 hover:bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-start justify-between gap-3 transition-all animate-in fade-in slide-in-from-top-3 duration-200"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-lg shrink-0">
                  🔔
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-emerald-300 leading-snug truncate">
                    {banner.title}
                  </p>
                  {banner.body && (
                    <p className="text-xs text-slate-100 mt-0.5 line-clamp-2 leading-relaxed">
                      {banner.body}
                    </p>
                  )}
                  <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">
                    Toque para abrir →
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPushBanners((prev) => prev.filter((b) => b.id !== banner.id));
                }}
                className="text-slate-400 hover:text-white text-xs p-1 shrink-0"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`p-4 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default function NotificationManager() {
  return null;
}
