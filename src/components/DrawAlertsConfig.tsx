import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';

interface AlertPreferences {
  pushEnabled: boolean;
  notifyAt1930: boolean; // 30 min antes
  notifyAt2000: boolean; // Na hora do sorteio
  notifyAt2035: boolean; // Apuração e resultados
  daysOfWeek: number[]; // 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
}

const DEFAULT_PREFERENCES: AlertPreferences = {
  pushEnabled: false,
  notifyAt1930: true,
  notifyAt2000: true,
  notifyAt2035: true,
  daysOfWeek: [1, 2, 3, 4, 5, 6] // Segunda a Sábado
};

const DAYS_MAP = [
  { id: 0, label: 'Dom', full: 'Domingo', hasDraw: false },
  { id: 1, label: 'Seg', full: 'Segunda-feira', hasDraw: true },
  { id: 2, label: 'Ter', full: 'Terça-feira', hasDraw: true },
  { id: 3, label: 'Qua', full: 'Quarta-feira', hasDraw: true },
  { id: 4, label: 'Qui', full: 'Quinta-feira', hasDraw: true },
  { id: 5, label: 'Sex', full: 'Sexta-feira', hasDraw: true },
  { id: 6, label: 'Sáb', full: 'Sábado', hasDraw: true }
];

export default function DrawAlertsConfig() {
  const { activePool } = usePool();
  const isMegaSena = activePool?.lotteryType === 'megasena';
  const resultsCollection = isMegaSena ? 'megasena_results' : 'lotofacil_results';

  const [preferences, setPreferences] = useState<AlertPreferences>(() => {
    try {
      const saved = localStorage.getItem('bolao_draw_alerts_config');
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isExpanded, setIsExpanded] = useState(false);
  const [nextContestNum, setNextContestNum] = useState<number | null>(null);
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
    }, err => console.warn('Next contest fetch error:', err));
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
      }
    };
    loadUserPreferences();
  }, [currentUser]);

  // Calcula tempo para o próximo sorteio da Lotofácil (Segunda a Sábado às 20h00)
  useEffect(() => {
    const calculateNextDraw = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Dom, 6 = Sáb
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      let targetDate = new Date(now);
      targetDate.setHours(20, 0, 0, 0);

      const isTodayDrawDay = currentDay >= 1 && currentDay <= 6;
      const isBeforeDrawTime = currentHour < 20;
      const isDuringDraw = currentHour === 20 && currentMinute <= 45;

      let isToday = false;
      let statusBadge = 'Próximo';

      if (isTodayDrawDay && isBeforeDrawTime) {
        // Sorteio acontece hoje às 20h
        isToday = true;
        statusBadge = 'Hoje às 20h00';
      } else if (isTodayDrawDay && isDuringDraw) {
        isToday = true;
        statusBadge = 'Sorteio em Andamento!';
        setNextDrawInfo({
          text: 'Sorteio da Lotofácil em apuração pela Caixa!',
          isToday: true,
          timeLeft: 'Acontecendo agora às 20h00',
          statusBadge
        });
        return;
      } else {
        // Próximo sorteio será amanhã ou na segunda-feira
        let daysToAdd = 1;
        if (currentDay === 6) {
          // Hoje é sábado pós-sorteio -> próximo é segunda (+2 dias)
          daysToAdd = 2;
        } else if (currentDay === 0) {
          // Hoje é domingo -> próximo é segunda (+1 dia)
          daysToAdd = 1;
        }
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        targetDate.setHours(20, 0, 0, 0);
        statusBadge = DAYS_MAP[targetDate.getDay()].full;
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setNextDrawInfo({
        text: isToday
          ? 'Hoje às 20h00 (Sorteio Oficial Caixa)'
          : `${DAYS_MAP[targetDate.getDay()].full}, ${targetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às 20h00`,
        isToday,
        timeLeft: totalHours > 0 ? `Faltam ${totalHours}h ${totalMinutes}m` : `Faltam ${totalMinutes}m`,
        statusBadge
      });
    };

    calculateNextDraw();
    const interval = setInterval(calculateNextDraw, 60000);
    return () => clearInterval(interval);
  }, []);

  const savePreferences = async (updated: AlertPreferences) => {
    setPreferences(updated);
    localStorage.setItem('bolao_draw_alerts_config', JSON.stringify(updated));

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { alertPreferences: updated });
      } catch (e) {
        console.warn('Erro ao salvar preferências no Firestore:', e);
      }
    }
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      addToast('Este navegador não suporta notificações push do sistema.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const updated = { ...preferences, pushEnabled: true };
        savePreferences(updated);

        // Dispara uma notificação de boas-vindas para confirmação imediata
        try {
          new Notification('🍀 Bolão Lotofácil: Notificações Ativadas!', {
            body: 'Tudo pronto! Você receberá alertas nos dias de sorteio para conferir os resultados.',
            icon: '/favicon.ico'
          });
        } catch {
          // Ignora se restrito por ambiente
        }

        addToast('🎉 Notificações push ativadas com sucesso no seu dispositivo!', 'success');
      } else if (permission === 'denied') {
        addToast('Permissão de notificações bloqueada pelo navegador. Ative nas configurações do site.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Não foi possível solicitar permissão de notificações.', 'error');
    }
  };

  const handleTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification('🍀 Lotofácil: Sorteio das 20h00!', {
          body: 'O sorteio oficial de hoje está começando. Abra o aplicativo para conferir as dezenas premiadas!',
          icon: '/favicon.ico',
          tag: 'lotofacil_test_alert'
        });

        notif.onclick = () => {
          window.focus();
        };

        addToast('🔔 Notificação de teste enviada para sua tela!', 'success');
      } catch {
        addToast('🔔 [Simulação] Sorteio Lotofácil 20h00: Hora de conferir os resultados no app!', 'info');
      }
    } else {
      addToast('🔔 [Demonstração] Sorteio Lotofácil 20h00: Hora de conferir os resultados!', 'info');
    }
  };

  // 1-Clique: Adicionar ao Google Agenda com recorrência de Segunda a Sábado às 20h00
  const handleAddToGoogleCalendar = () => {
    // Formato UTC: 20:00 Horário de Brasília (BRT / UTC-3) corresponde às 23:00 UTC
    // Cria data base para o próximo sorteio
    const baseDate = new Date();
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');

    const title = encodeURIComponent('🍀 Sorteio Oficial Lotofácil - Conferir Bolão');
    const details = encodeURIComponent(
      'Horário do sorteio oficial da Lotofácil (Caixa Econômica Federal)!\n\nAbra o aplicativo do bolão para conferir seus bilhetes, pontos e premiações apuradas.'
    );
    const location = encodeURIComponent('Bolão Lotofácil Gestor');
    // 20:00 às 20:30 BRT
    const dates = `${year}${month}${day}T230000Z/${year}${month}${day}T233000Z`;
    const recur = encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&recur=${recur}`;

    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    addToast('Abrindo Google Agenda com evento recorrente...', 'info');
  };

  // Download de Arquivo .ICS (Compatível com iPhone/Apple Calendar, Android, Outlook e Mac)
  const handleDownloadIcsFile = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bolao Lotofacil Gestor//Alertas de Sorteio//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:lotofacil-draw-${Date.now()}@bolao.lotofacil`,
      'SUMMARY:🍀 Sorteio Oficial Lotofácil - Conferir Bolão',
      'DESCRIPTION:Horário oficial do sorteio da Lotofácil (Caixa). Acesse o app do bolão para conferir os acertos e prêmios!',
      'LOCATION:Bolão Lotofácil Gestor',
      'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA',
      'DTSTART:20260101T230000Z',
      'DTEND:20260101T233000Z',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Faltam 15 minutos para o sorteio da Lotofácil! Prepare-se para conferir.',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sorteios_lotofacil_lembrete.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('📅 Arquivo .ics baixado! Abra para sincronizar com seu calendário.', 'success');
  };

  // Compartilhar lembrete rápido para o grupo no WhatsApp
  const handleShareWhatsAppReminder = () => {
    const text = encodeURIComponent(
      `🍀 *LEMBRETE DO BOLÃO LOTOFÁCIL*\n\n` +
      `⏰ Pessoal, hoje tem sorteio oficial às *20h00*!\n` +
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
                {isMegaSena ? 'Terça, Quinta e Sábado às 20h00' : 'Segunda a Sábado às 20h00'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Alertas & Lembretes de Sorteio</span>
              {nextContestNum && (
                <span className="text-amber-300 font-extrabold text-sm sm:text-base">
                  (Concurso #{nextContestNum})
                </span>
              )}
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
              <span>🔔</span> Ativar Notificações Push
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTestNotification}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
              title="Disparar notificação demonstrativa"
            >
              <span>✨</span> Testar Alerta
            </button>
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
          {/* Botões de 1-Clique para Calendário e Lembretes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

            <button
              type="button"
              onClick={handleShareWhatsAppReminder}
              className="bg-emerald-600/80 hover:bg-emerald-600 text-white p-2.5 rounded-xl border border-emerald-500/50 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">📢</span>
              <span>Avisar Grupo no WhatsApp</span>
            </button>
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
                    <strong>19h30</strong> — Pré-Sorteio (Faltam 30 min)
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
                    <strong>20h00</strong> — Hora Exata do Sorteio
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
                    <strong>20h35</strong> — Apuração & Conferência dos Jogos
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.notifyAt2035}
                  onChange={(e) => savePreferences({ ...preferences, notifyAt2035: e.target.checked })}
                  className="rounded text-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Bloco 2: Dias da Semana Ativos */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <span>🗓️</span> Dias de Sorteio com Alerta:
              </h4>

              <p className="text-[11px] text-blue-200/80">
                A Lotofácil é sorteada oficialmente de <strong>Segunda a Sábado</strong> pela Caixa Econômica Federal.
              </p>

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
