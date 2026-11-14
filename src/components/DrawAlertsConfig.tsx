import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { usePermissions } from '../lib/PermissionsContext';
import { downloadOrShareFile } from '../lib/fileDownloadHelper';
import { 
  requestNotificationPermission, 
  sendAppNotification, 
  scheduleUpcomingDrawAlerts, 
  requestIgnoreBatteryOptimization,
  scheduleTestClosedAppAlarm,
  getPendingNativeAlarms
} from '../lib/notifications';
import { runAutoPrizeCheck } from '../lib/autoNotificationService';
import { isDrawDay, getNextDrawDate, formatDateBR, getDayNameBR, getDrawHourForDate, getDrawTimeTextForDate, getGoogleCalendarByDay } from '../lib/drawCalendar';

interface AlertPreferences {
  pushEnabled: boolean;
  notifyAt1930: boolean; // 30 min antes
  notifyAt2000: boolean; // Na hora do sorteio
  notifyAt2035: boolean; // Apuração e resultados
  notifyAt2155?: boolean; // Conferência automática definitiva às 21h55
  daysOfWeek: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex
}

const DEFAULT_PREFERENCES: AlertPreferences = {
  pushEnabled: false,
  notifyAt1930: true,
  notifyAt2000: true,
  notifyAt2035: true,
  notifyAt2155: true,
  daysOfWeek: [0, 1, 2, 3, 4, 5] // Segunda a Sexta e Domingo (Agenda Loterias Caixa)
};

const DAYS_MAP = [
  { id: 0, label: 'Dom', full: 'Domingo (a partir das 11h)', hasDraw: true },
  { id: 1, label: 'Seg', full: 'Segunda-feira', hasDraw: true },
  { id: 2, label: 'Ter', full: 'Terça-feira', hasDraw: true },
  { id: 3, label: 'Qua', full: 'Quarta-feira', hasDraw: true },
  { id: 4, label: 'Qui', full: 'Quinta-feira', hasDraw: true },
  { id: 5, label: 'Sex', full: 'Sexta-feira', hasDraw: true },
  { id: 6, label: 'Sáb', full: 'Sábado (Sem Sorteio)', hasDraw: false }
];

export default function DrawAlertsConfig() {
  const { activePool, setIsQuotaExceeded } = usePool();
  const { isAdmin, isCounselor } = usePermissions();
  const isAdminOrCounselor = isAdmin || isCounselor;
  const isMegaSena = activePool?.lotteryType === 'megasena';
  const resultsCollection = isMegaSena ? 'megasena_results' : 'lotofacil_results';

  const [preferences, setPreferences] = useState<AlertPreferences>(() => {
    try {
      const saved = localStorage.getItem('bolao_draw_alerts_config');
      if (!saved) return DEFAULT_PREFERENCES;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.daysOfWeek) && !parsed.daysOfWeek.includes(0)) {
        parsed.daysOfWeek = Array.from(new Set([...parsed.daysOfWeek, 0])).filter((d: number) => d !== 6);
      }
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isExpanded, setIsExpanded] = useState(false);
  const [nextContestNum, setNextContestNum] = useState<number | null>(null);
  const [pendingAlarmsCount, setPendingAlarmsCount] = useState<number>(0);
  const [isCheckingNow, setIsCheckingNow] = useState<boolean>(false);
  const [nextDrawInfo, setNextDrawInfo] = useState<{
    text: string;
    isToday: boolean;
    timeLeft: string;
    statusBadge: string;
  }>({
    text: 'Calculando próximo sorteio...',
    isToday: false,
    timeLeft: '',
    statusBadge: 'Carregando'
  });

  const { addToast } = useToast();
  const currentUser = auth.currentUser;

  const refreshPendingAlarms = async () => {
    const list = await getPendingNativeAlarms();
    setPendingAlarmsCount(list.length);
  };

  useEffect(() => {
    refreshPendingAlarms();
  }, []);

  // Escuta o último resultado registrado para calcular o número exato do próximo concurso
  useEffect(() => {
    const q = query(collection(db, resultsCollection), orderBy('createdAt', 'desc'), limit(1));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const cNum = Number(data.contest);
        if (cNum > 0) {
          setNextContestNum(cNum + 1);
        }
      }
    }, err => {
      console.warn('Next contest fetch error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });
    return () => unsub();
  }, [resultsCollection]);

  // Checa permissão do navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'granted' && !preferences.pushEnabled) {
        setPreferences(prev => ({ ...prev, pushEnabled: true }));
      }
    }
  }, []);

  // Carrega preferências salvas do Firestore
  useEffect(() => {
    if (!currentUser) return;
    const loadUserPreferences = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().alertPreferences) {
          setPreferences(snap.data().alertPreferences);
        }
      } catch (err) {
        console.warn('Não foi possível carregar preferências do Firestore:', err);
        if (isQuotaError(err)) setIsQuotaExceeded(true);
      }
    };
    loadUserPreferences();
  }, [currentUser]);

  // Calcula tempo para o próximo sorteio da Lotofácil/Mega-Sena (Domingos 11h, Seg-Sex 21h, sem sábado e sem feriados)
  useEffect(() => {
    const calculateNextDraw = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const lotteryType = isMegaSena ? 'megasena' : 'lotofacil';
      const lotLabel = isMegaSena ? 'Mega-Sena' : 'Lotofácil';

      const todayDrawCheck = isDrawDay(now, lotteryType);
      const todayDrawHour = getDrawHourForDate(now);
      const todayTimeText = getDrawTimeTextForDate(now);

      let targetDate = new Date(now);
      targetDate.setHours(todayDrawHour, 0, 0, 0);

      const isBeforeDrawTime = currentHour < todayDrawHour;
      const isDuringDraw = currentHour === todayDrawHour && currentMinute <= 45;

      let isToday = false;
      let statusBadge = 'Próximo';

      if (todayDrawCheck.isDraw && isBeforeDrawTime) {
        isToday = true;
        statusBadge = `Hoje às ${todayTimeText}`;
      } else if (todayDrawCheck.isDraw && isDuringDraw) {
        isToday = true;
        statusBadge = 'Sorteio em Andamento!';
        setNextDrawInfo({
          text: `Sorteio da ${lotLabel} em apuração pela Caixa!`,
          isToday: true,
          timeLeft: `Acontecendo agora (${todayTimeText})`,
          statusBadge
        });
        return;
      } else {
        const nextDraw = getNextDrawDate(
          todayDrawCheck.isDraw && !isBeforeDrawTime
            ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            : now,
          lotteryType
        );
        targetDate = new Date(nextDraw.date);
        targetDate.setHours(getDrawHourForDate(targetDate), 0, 0, 0);
        statusBadge = `${getDayNameBR(targetDate)}, ${formatDateBR(targetDate)}`;
      }

      const targetTimeText = getDrawTimeTextForDate(targetDate);
      const diffMs = targetDate.getTime() - now.getTime();
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setNextDrawInfo({
        text: isToday
          ? `Hoje às ${targetTimeText} (Sorteio Oficial Caixa)`
          : `${getDayNameBR(targetDate)}, ${formatDateBR(targetDate)} às ${targetTimeText}`,
        isToday,
        timeLeft: totalHours > 0 ? `Faltam ${totalHours}h ${totalMinutes}m` : `Faltam ${totalMinutes}m`,
        statusBadge
      });
    };

    calculateNextDraw();
    const interval = setInterval(calculateNextDraw, 60000);
    return () => clearInterval(interval);
  }, [isMegaSena]);

  const savePreferences = async (updated: AlertPreferences) => {
    setPreferences(updated);
    localStorage.setItem('bolao_draw_alerts_config', JSON.stringify(updated));

    if (updated.pushEnabled) {
      await scheduleUpcomingDrawAlerts(isMegaSena ? 'megasena' : 'lotofacil');
    }

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { alertPreferences: updated });
      } catch (e) {
        console.warn('Erro ao salvar preferências no Firestore:', e);
        if (isQuotaError(e)) setIsQuotaExceeded(true);
      }
    }
  };

  const handleRequestPushPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPermissionStatus('granted');
        const updated = { ...preferences, pushEnabled: true };
        await savePreferences(updated);
        await requestIgnoreBatteryOptimization();

        await sendAppNotification('🍀 Bolão Lotofácil: Notificações Ativadas!', {
          body: 'Tudo pronto! Seus alertas nativos de sorteio e prêmios funcionarão com o app fechado.',
          id: 999
        });

        await refreshPendingAlarms();
        addToast('🎉 Notificações ativadas no SO do Android com disparo exato mesmo com o app fechado!', 'success');
      } else {
        addToast('Permissão de notificações não concedida. Ative nas configurações do dispositivo/navegador.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Não foi possível solicitar permissão de notificações.', 'error');
    }
  };

  const handleTestNotification = async () => {
    const lotLabel = isMegaSena ? 'Mega-Sena' : 'Lotofácil';
    const timeText = getDrawTimeTextForDate(new Date());
    await sendAppNotification(`🍀 ${lotLabel}: Sorteio das ${timeText}!`, {
      body: 'O sorteio oficial está começando. Abra o aplicativo para conferir as dezenas premiadas!',
      id: Math.floor(Math.random() * 100000) + 1
    });
    addToast('🔔 Notificação de teste enviada!', 'success');
  };

  const handleTestClosedAppAlarm = async () => {
    await requestNotificationPermission();
    await scheduleTestClosedAppAlarm(10);
    await refreshPendingAlarms();
    addToast('⏱️ Alarme nativo agendado para daqui a 10 segundos! Feche ou minimize o app AGORA para testar!', 'success');
  };

  const handleManualAutoCheck = async () => {
    setIsCheckingNow(true);
    try {
      await runAutoPrizeCheck();
      await scheduleUpcomingDrawAlerts(isMegaSena ? 'megasena' : 'lotofacil');
      await refreshPendingAlarms();
      addToast('✅ Conferência automática executada e alarmes nativos (incluindo 21h55) sincronizados!', 'success');
    } catch {
      addToast('Erro ao executar conferência automática.', 'error');
    } finally {
      setIsCheckingNow(false);
    }
  };

  // 1-Clique: Adicionar ao Google Agenda com recorrência oficial Caixa
  const handleAddToGoogleCalendar = () => {
    const lotteryType = isMegaSena ? 'megasena' : 'lotofacil';
    const lotLabel = isMegaSena ? 'Mega-Sena' : 'Lotofácil';
    const nextDraw = getNextDrawDate(new Date(), lotteryType);
    const drawHour = getDrawHourForDate(nextDraw.date);
    const year = nextDraw.date.getFullYear();
    const month = String(nextDraw.date.getMonth() + 1).padStart(2, '0');
    const day = String(nextDraw.date.getDate()).padStart(2, '0');
    const startH = String(drawHour).padStart(2, '0');

    const title = encodeURIComponent(`🍀 Sorteio Oficial ${lotLabel} - Conferir Bolão`);
    const details = encodeURIComponent(
      `Horário oficial do sorteio da ${lotLabel} (Caixa Econômica Federal): ${isMegaSena ? 'Terças e Quintas às 21h; Domingos às 11h' : 'Segunda a Sexta às 21h; Domingos às 11h'}!\n\nAbra o aplicativo do bolão para conferir seus bilhetes, pontos e premiações apuradas.`
    );
    const location = encodeURIComponent('Bolão Amigos');
    const dates = `${year}${month}${day}T${startH}0000/${year}${month}${day}T${startH}3000`;
    const recur = encodeURIComponent(`RRULE:FREQ=WEEKLY;BYDAY=${getGoogleCalendarByDay(lotteryType)}`);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&ctz=America%2FSao_Paulo&details=${details}&location=${location}&recur=${recur}`;

    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    addToast('Abrindo Google Agenda com evento recorrente...', 'info');
  };

  // Download de Arquivo .ICS (Compatível com iPhone/Apple Calendar, Android, Outlook e Mac)
  const handleDownloadIcsFile = async () => {
    const lotteryType = isMegaSena ? 'megasena' : 'lotofacil';
    const lotLabel = isMegaSena ? 'Mega-Sena' : 'Lotofácil';
    const nextDraw = getNextDrawDate(new Date(), lotteryType);
    const drawHour = getDrawHourForDate(nextDraw.date);
    const year = nextDraw.date.getFullYear();
    const month = String(nextDraw.date.getMonth() + 1).padStart(2, '0');
    const day = String(nextDraw.date.getDate()).padStart(2, '0');
    const startH = String(drawHour).padStart(2, '0');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bolao Amigos//Alertas de Sorteio//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${lotteryType}-draw-${Date.now()}@bolao.amigos`,
      `SUMMARY:🍀 Sorteio Oficial ${lotLabel} - Conferir Bolão`,
      `DESCRIPTION:Horário oficial do sorteio da ${lotLabel} (Caixa: Seg-Sex 21h / Dom 11h). Acesse o app do bolão para conferir os acertos e prêmios!`,
      'LOCATION:Bolão Amigos',
      `RRULE:FREQ=WEEKLY;BYDAY=${getGoogleCalendarByDay(lotteryType)}`,
      `DTSTART;TZID=America/Sao_Paulo:${year}${month}${day}T${startH}0000`,
      `DTEND;TZID=America/Sao_Paulo:${year}${month}${day}T${startH}3000`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Faltam 15 minutos para o sorteio da ${lotLabel}! Prepare-se para conferir.`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    await downloadOrShareFile({
      fileName: `sorteios_${lotteryType}_lembrete.ics`,
      content: icsContent,
      mimeType: 'text/calendar;charset=utf-8'
    });

    addToast('📅 Arquivo .ics baixado! Abra para sincronizar com seu calendário.', 'success');
  };

  // Compartilhar lembrete rápido para o grupo no WhatsApp
  const handleShareWhatsAppReminder = () => {
    const lotteryType = isMegaSena ? 'megasena' : 'lotofacil';
    const lotLabel = isMegaSena ? 'MEGA-SENA' : 'LOTOFÁCIL';
    const nextDraw = getNextDrawDate(new Date(), lotteryType);
    const timeText = getDrawTimeTextForDate(nextDraw.date);
    const todayCheck = isDrawDay(new Date(), lotteryType);
    const whenLabel = todayCheck.isDraw ? 'hoje' : `${getDayNameBR(nextDraw.date)} (${nextDraw.dateFormatted})`;

    const text = encodeURIComponent(
      `🍀 *LEMBRETE DO BOLÃO ${lotLabel}*\n\n` +
      `⏰ Pessoal, o próximo sorteio oficial é ${whenLabel} a partir das *${timeText}*!\n` +
      `Fiquem atentos para conferir as dezenas e acertos do nosso bolão assim que sair o resultado.\n\n` +
      `👉 Acesse o app para acompanhar!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-950 text-white rounded-2xl shadow-md border border-indigo-700/50 p-4 sm:p-5 overflow-hidden relative">
      {/* Detalhes de Fundo */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Cabeçalho Principal do Alerta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 text-2xl border border-white/20 shadow-inner">
            🔔
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-full">
                Sorteios {isMegaSena ? 'Mega-Sena' : 'Lotofácil'}
              </span>
              {nextContestNum && (
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  🎰 Próximo Concurso #{nextContestNum}
                </span>
              )}
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isMegaSena ? 'Terça, Quinta e Domingo' : 'Segunda a Sexta e Domingo'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Alertas de Sorteio</span>
            </h2>
            <p className="text-xs text-blue-200/90 font-medium">
              {nextContestNum ? `Concurso #${nextContestNum} • ` : ''}{nextDrawInfo.text} • <span className="font-bold text-amber-300">{nextDrawInfo.timeLeft}</span>
            </p>
          </div>
        </div>

        {/* Ações Rápidas no Cabeçalho */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {permissionStatus !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestPushPermission}
              className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs px-3.5 py-2 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🔔</span> Ativar Alarme Nativo & Push
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleTestClosedAppAlarm}
                className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs px-3 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Agenda um alarme nativo para daqui a 10 segundos para você fechar o app e testar"
              >
                <span>⏱️</span> Testar c/ App Fechado (10s)
              </button>
              <button
                type="button"
                onClick={handleManualAutoCheck}
                disabled={isCheckingNow}
                className="bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition border border-emerald-400/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Sincroniza os alarmes nativos (21h dias úteis / 11h domingos) e confere o jogo do dia agora"
              >
                <span>⚡</span> {isCheckingNow ? 'Conferindo...' : 'Conferir Jogo do Dia'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚙️</span> {isExpanded ? 'Ocultar Opções' : 'Configurar Alertas'}
            <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>
      </div>

      {/* Painel Expandido com Detalhes, Preferências e Integrações (Oculto por Padrão) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/15 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 relative z-10">
          {/* Card do Gatilho Automático & Alarme Nativo Android */}
          <div className="bg-emerald-950/60 border border-emerald-400/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <span>⚡</span> Gatilho Automático & Alarme Nativo (Android)
                </span>
                {pendingAlarmsCount > 0 && (
                  <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                    ✓ {pendingAlarmsCount} alarmes agendados no sistema
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100/90 leading-relaxed">
                Os alarmes oficiais (<strong>Seg–Sex às 20h30, 21h00, 21h35, 21h55 e 22h15</strong>; e <strong>Domingos às 10h30, 11h00, 11h35, 12h05 e 12h35</strong>) ficam gravados no sistema Android (<code className="text-amber-300">setExactAndAllowWhileIdle</code>) e rodam mesmo com o app 100% fechado!
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleTestClosedAppAlarm}
                className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs px-3 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                ⏱️ Testar em 10s (Feche o App)
              </button>
              <button
                type="button"
                onClick={handleTestNotification}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl transition border border-white/20 cursor-pointer"
              >
                ✨ Teste Imediato
              </button>
            </div>
          </div>

          {/* Botões de 1-Clique para Calendário e Lembretes */}
          <div className={`grid grid-cols-1 ${isAdminOrCounselor ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
            <button
              type="button"
              onClick={handleAddToGoogleCalendar}
              className="bg-white/10 hover:bg-white/15 text-white p-2.5 rounded-xl border border-white/15 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">📅</span>
              <span>Google Agenda (Recorrente)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadIcsFile}
              className="bg-white/10 hover:bg-white/15 text-white p-2.5 rounded-xl border border-white/15 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer group"
              title="Compatível com iPhone (Apple Calendar), Android e Outlook"
            >
              <span className="text-base group-hover:scale-110 transition-transform">📲</span>
              <span>Baixar Lembrete (.ics / Apple / Outlook)</span>
            </button>

            {isAdminOrCounselor && (
              <button
                type="button"
                onClick={handleShareWhatsAppReminder}
                className="bg-emerald-600/80 hover:bg-emerald-600 text-white p-2.5 rounded-xl border border-emerald-500/50 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">📢</span>
                <span>Avisar Grupo no WhatsApp</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco 1: Horários de Notificação */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <span>⏰</span> Momentos dos Alertas:
              </h4>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer text-xs">
                <span className="flex items-center gap-2">
                  <span>⏳</span>
                  <span>
                    <strong>20h30 (Seg–Sex) / 10h30 (Dom)</strong> — Pré-Sorteio (Faltam 30 min)
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.notifyAt1930}
                  onChange={(e) => savePreferences({ ...preferences, notifyAt1930: e.target.checked })}
                  className="rounded text-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer text-xs">
                <span className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>
                    <strong>21h00 (Seg–Sex) / 11h00 (Dom)</strong> — Hora do Sorteio Caixa
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.notifyAt2000}
                  onChange={(e) => savePreferences({ ...preferences, notifyAt2000: e.target.checked })}
                  className="rounded text-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer text-xs">
                <span className="flex items-center gap-2">
                  <span>🏆</span>
                  <span>
                    <strong>21h35 (Seg–Sex) / 11h35 (Dom)</strong> — Apuração & Conferência
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.notifyAt2035}
                  onChange={(e) => savePreferences({ ...preferences, notifyAt2035: e.target.checked })}
                  className="rounded text-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25 transition cursor-pointer text-xs">
                <span className="flex items-center gap-2">
                  <span>🎉</span>
                  <span>
                    <strong>Conferência Automática Final & Alerta de Prêmio</strong> (Funciona c/ App Fechado)
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.notifyAt2155 !== false}
                  onChange={(e) => savePreferences({ ...preferences, notifyAt2155: e.target.checked })}
                  className="rounded text-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Bloco 2: Dias da Semana Ativos */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <span>🗓️</span> Dias de Sorteio com Alerta:
              </h4>


              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {DAYS_MAP.filter(d => d.hasDraw).map(day => {
                  const isChecked = preferences.daysOfWeek.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        const nextDays = isChecked
                          ? preferences.daysOfWeek.filter(d => d !== day.id)
                          : [...preferences.daysOfWeek, day.id];
                        savePreferences({ ...preferences, daysOfWeek: nextDays });
                      }}
                      className={`p-2 rounded-lg text-center transition font-bold text-xs cursor-pointer border ${
                        isChecked
                          ? 'bg-purple-600 border-purple-400 text-white shadow-xs'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <div>{day.label}</div>
                      <div className="text-[9px] font-normal">{isChecked ? '✓' : '—'}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[11px] text-blue-200/90 pt-1">
                <span>Status Push no Navegador:</span>
                <span className={`font-black px-2 py-0.5 rounded-md ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : permissionStatus === 'denied'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {permissionStatus === 'granted' ? '🟢 Concedido' : permissionStatus === 'denied' ? '🔴 Bloqueado' : '🟡 Pendente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
