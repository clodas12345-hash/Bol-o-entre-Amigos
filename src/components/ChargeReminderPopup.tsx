import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendAppNotification } from '../lib/notifications';

export default function ChargeReminderPopup({ isAdmin }: { isAdmin: boolean }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) return;

    const today = new Date();
    const day = today.getDate();
    const monthKey = today.toISOString().slice(0, 7); // YYYY-MM
    const storageKey = `bolao_last_charge_reminder_${monthKey}_${day}`;
    
    // Dias de cobrança: 02, 07, 12
    const chargeDays = [2, 7, 12];

    if (chargeDays.includes(day)) {
      const alreadyShown = localStorage.getItem(storageKey);
      if (!alreadyShown) {
        setShow(true);
        // Notificação Push tbm ativa
        sendAppNotification('🔔 Lembrete de Cobrança', {
          body: `Hoje é dia ${day.toString().padStart(2, '0')}! Lembre-se de realizar a cobrança dos participantes pendentes.`,
          category: 'payment_system',
          targetPath: '/contatos'
        });
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [isAdmin]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
            📢
          </div>
          <h2 className="text-xl font-black uppercase tracking-wide">Dia de Cobrança!</h2>
          <p className="text-xs text-indigo-100 font-semibold mt-1">Hoje é um dos dias programados para cobrança</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed text-center">
            Olá Administrador! Hoje é dia <strong>{new Date().getDate().toString().padStart(2, '0')}</strong>. 
            Não esqueça de enviar os lembretes para os participantes com pagamentos pendentes!
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShow(false);
                navigate('/contatos');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✅</span>
              <span>Ir para Cobrança</span>
            </button>
            <button
              onClick={() => setShow(false)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Fechar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
