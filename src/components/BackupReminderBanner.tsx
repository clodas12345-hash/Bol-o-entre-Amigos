import { useState, useEffect } from 'react';
import { checkIfBackupNeeded, downloadFullBackup } from '../lib/backupService';
import { useToast } from './NotificationManager';

interface BackupReminderBannerProps {
  isAdmin: boolean;
}

export default function BackupReminderBanner({ isAdmin }: BackupReminderBannerProps) {
  const [reminder, setReminder] = useState<{ needed: boolean; reason: any; message: string }>({
    needed: false,
    reason: null,
    message: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isAdmin) return;

    // Se já dispensou nesta sessão do navegador, não perturba de novo
    const sessionDismissed = sessionStorage.getItem('bolao_backup_banner_dismissed') === 'true';
    if (sessionDismissed) {
      setDismissed(true);
      return;
    }

    const check = checkIfBackupNeeded();
    setReminder(check);
  }, [isAdmin]);

  if (!isAdmin || !reminder.needed || dismissed) {
    return null;
  }

  const handleBackupNow = async () => {
    setIsExporting(true);
    addToast('📦 Gerando arquivo de backup completo...', 'info');

    try {
      const { totalRecords } = await downloadFullBackup();
      addToast(`🎉 Backup baixado com sucesso! (${totalRecords} registros protegidos)`, 'success');
      setDismissed(true);
      sessionStorage.setItem('bolao_backup_banner_dismissed', 'true');
    } catch (err) {
      console.error(err);
      addToast('Erro ao realizar o download do backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('bolao_backup_banner_dismissed', 'true');
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-lg border-2 border-amber-300 animate-in slide-in-from-top duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/30 backdrop-blur-xs flex items-center justify-center shrink-0 text-2xl shadow-xs">
            {reminder.reason === 'last_day_of_month' ? '📅' : '💾'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase bg-white/40 px-2 py-0.5 rounded-full text-slate-900">
                {reminder.reason === 'last_day_of_month' ? 'Último Dia do Mês' : 'Lembrete de Segurança'}
              </span>
              <span className="text-xs font-bold text-amber-950">Atenção Administrador</span>
            </div>
            <h3 className="text-base font-black text-slate-950 mt-0.5">
              Hora de Fazer o Backup dos Dados do Bolão
            </h3>
            <p className="text-xs text-amber-950/80 font-medium mt-0.5">
              {reminder.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-bold px-3 py-2 rounded-xl text-amber-950 hover:bg-black/10 transition cursor-pointer"
          >
            Lembrar depois
          </button>

          <button
            type="button"
            onClick={handleBackupNow}
            disabled={isExporting}
            className="bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Baixando...
              </>
            ) : (
              <>
                <span>📥</span> Fazer Backup Agora
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
