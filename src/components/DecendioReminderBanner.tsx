import { useState, useEffect } from 'react';
import { useToast } from './NotificationManager';

interface DecendioReminderBannerProps {
  isAdmin: boolean;
  onOpenReport?: () => void;
}

export default function DecendioReminderBanner({ isAdmin, onOpenReport }: DecendioReminderBannerProps) {
  const [showReminder, setShowReminder] = useState(false);
  const [reminderInfo, setReminderInfo] = useState({ title: '', decendioName: '', deadlineText: '' });
  const { addToast } = useToast();

  useEffect(() => {
    if (!isAdmin) return;

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Determina o último dia do mês atual
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    // Condições para 1 dia antes do fechamento do decêndio:
    // - Dia 9 (1 dia antes do fechamento do 1º decêndio em 10)
    // - Dia 19 (1 dia antes do fechamento do 2º decêndio em 20)
    // - Penúltimo dia do mês (1 dia antes do fechamento do 3º decêndio no último dia)
    let isTriggerDay = false;
    let decName = '';
    let deadline = '';

    if (day === 9) {
      isTriggerDay = true;
      decName = '1º Decêndio (Dias 01 a 10)';
      deadline = `Amanhã (10/${String(month).padStart(2, '0')}/${year})`;
    } else if (day === 19) {
      isTriggerDay = true;
      decName = '2º Decêndio (Dias 11 a 20)';
      deadline = `Amanhã (20/${String(month).padStart(2, '0')}/${year})`;
    } else if (day === lastDayOfMonth - 1) {
      isTriggerDay = true;
      decName = '3º Decêndio (Dias 21 a Fim do Mês)';
      deadline = `Amanhã (${lastDayOfMonth}/${String(month).padStart(2, '0')}/${year})`;
    }

    if (!isTriggerDay) return;

    // Verifica se já foi dispensado hoje
    const dismissKey = `bolao_decendio_reminder_dismissed_${year}_${month}_${day}`;
    const dismissed = localStorage.getItem(dismissKey) === 'true';
    if (dismissed) return;

    setReminderInfo({
      title: 'Lembrete de Prestação de Contas',
      decendioName: decName,
      deadlineText: deadline
    });
    setShowReminder(true);

    // Dispara toast e notificação push interna
    addToast('📢 Alerta Administrador: Amanhã fecha o decêndio! Prepare a prestação de contas.', 'info');
    try {
      window.dispatchEvent(
        new CustomEvent('bolao_in_app_push_banner', {
          detail: {
            title: '📢 Prazo de Prestação de Contas',
            body: `Amanhã (${deadline}) encerra o ${decName}. Realize a conferência e prestação de contas dos números consolidados!`,
            targetPath: '/financial'
          }
        })
      );
    } catch {}
  }, [isAdmin]);

  const handleDismiss = () => {
    setShowReminder(false);
    const now = new Date();
    const dismissKey = `bolao_decendio_reminder_dismissed_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`;
    localStorage.setItem(dismissKey, 'true');
  };

  const handleAction = () => {
    handleDismiss();
    if (onOpenReport) {
      onOpenReport();
    } else {
      try {
        window.dispatchEvent(
          new CustomEvent('bolao_navigate_to', { detail: { path: '/financial' } })
        );
      } catch {}
    }
  };

  if (!isAdmin || !showReminder) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 rounded-2xl shadow-2xl border-2 border-indigo-400/50 mb-6 animate-in slide-in-from-top duration-300 relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl select-none pointer-events-none">
        📊
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-300/40 flex items-center justify-center shrink-0 text-2xl shadow-inner">
            ⏰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase bg-indigo-400/30 px-2.5 py-0.5 rounded-full text-indigo-200">
                Alerta de Decêndio
              </span>
              <span className="text-xs font-bold text-indigo-300">
                Fechamento {reminderInfo.deadlineText}
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              {reminderInfo.title}: {reminderInfo.decendioName}
            </h3>
            <p className="text-xs text-indigo-200/90 font-medium mt-1 leading-relaxed">
              Olá Administrador! O fechamento do decêndio está próximo. Lembre-se de realizar a conferência dos números consolidados e divulgar a prestação de contas com os participantes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-bold px-3.5 py-2.5 rounded-xl text-indigo-300 hover:bg-white/10 transition cursor-pointer"
          >
            Lembrar depois
          </button>

          <button
            type="button"
            onClick={handleAction}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <span>📈</span> Ver Relatório de 10 Dias
          </button>
        </div>
      </div>
    </div>
  );
}
