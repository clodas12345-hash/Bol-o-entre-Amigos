import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getNextDrawDate, isDrawDay, formatDateBR } from './drawCalendar';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('Erro ao solicitar permissão de notificações nativas:', err);
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (webErr) {
      console.warn('Erro ao solicitar permissão no navegador:', webErr);
    }
  }

  return false;
}

/**
 * Solicita exceção de otimização de bateria e verifica permissão de alarmes exatos no Android
 * para impedir que o sistema cancele ou adie alarmes com o app fechado.
 */
export async function requestIgnoreBatteryOptimization(): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    return 'web';
  }

  try {
    const exactStatus = await (LocalNotifications as any).checkExactNotificationSetting?.();
    if (exactStatus && exactStatus.exact_alarm !== 'granted') {
      await (LocalNotifications as any).changeExactNotificationSetting?.();
      return 'requested_exact';
    }
    await LocalNotifications.checkPermissions();
    return 'granted';
  } catch (err) {
    console.warn('Erro ao verificar permissão de bateria/alarmes exatos:', err);
    return 'unknown';
  }
}

export interface UserNotificationPreferences {
  pushEnabled: boolean;
  chatDailyNotification: boolean;      // 1 notificação por dia caso tenha msg no chat
  newContestNotification: boolean;     // Novos concursos / novas apostas cadastradas
  drawTimeAlerts: boolean;             // Alertas de horário do sorteio (19h30 e 20h00)
  officialResultsAlerts: boolean;      // Resultados publicados e conferência (20h35 / 21h05)
  winningPrizeAlerts: boolean;         // Apostas premiadas e rateio
  paymentAndSystemAlerts: boolean;     // Avisos de pagamento, cotas e comunicados da administração
  missingGamesReminder: boolean;       // Lembrete a cada 2h de jogos pendentes (Admin/Conselheiro)
  notifyAt1930: boolean;
  notifyAt2000: boolean;
  notifyAt2035: boolean;
  daysOfWeek: number[];
}

export const DEFAULT_USER_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  pushEnabled: true,
  chatDailyNotification: true,
  newContestNotification: true,
  drawTimeAlerts: true,
  officialResultsAlerts: true,
  winningPrizeAlerts: true,
  paymentAndSystemAlerts: true,
  missingGamesReminder: true,
  notifyAt1930: true,
  notifyAt2000: true,
  notifyAt2035: true,
  daysOfWeek: [1, 2, 3, 4, 5, 6]
};

export function getUserNotificationPreferences(uid?: string | null): UserNotificationPreferences {
  try {
    const key = uid ? `bolao_notif_prefs_${uid}` : 'bolao_notif_prefs_default';
    const savedSpecific = localStorage.getItem(key);
    const savedLegacy = localStorage.getItem('bolao_draw_alerts_config');
    const parsedSpecific = savedSpecific ? JSON.parse(savedSpecific) : {};
    const parsedLegacy = savedLegacy ? JSON.parse(savedLegacy) : {};
    return {
      ...DEFAULT_USER_NOTIFICATION_PREFERENCES,
      ...parsedLegacy,
      ...parsedSpecific
    };
  } catch {
    return DEFAULT_USER_NOTIFICATION_PREFERENCES;
  }
}

export function saveUserNotificationPreferencesLocal(prefs: Partial<UserNotificationPreferences>, uid?: string | null): UserNotificationPreferences {
  const current = getUserNotificationPreferences(uid);
  const merged: UserNotificationPreferences = { ...current, ...prefs };
  try {
    if (uid) {
      localStorage.setItem(`bolao_notif_prefs_${uid}`, JSON.stringify(merged));
    }
    localStorage.setItem('bolao_notif_prefs_default', JSON.stringify(merged));
    localStorage.setItem('bolao_draw_alerts_config', JSON.stringify(merged));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bolao_notif_prefs_updated', { detail: merged }));
    }
  } catch (err) {
    console.warn('Erro ao salvar preferências de notificação localmente:', err);
  }
  return merged;
}

export type NotificationCategory =
  | 'chat_daily'
  | 'new_contest'
  | 'draw_time'
  | 'official_result'
  | 'winning_prize'
  | 'payment_system'
  | 'missing_games'
  | 'test';

export function isNotificationCategoryAllowed(category?: NotificationCategory, uid?: string | null): boolean {
  if (!category || category === 'test') return true;
  const prefs = getUserNotificationPreferences(uid);
  if (!prefs.pushEnabled) return false;

  switch (category) {
    case 'chat_daily':
      return prefs.chatDailyNotification !== false;
    case 'new_contest':
      return prefs.newContestNotification !== false;
    case 'draw_time':
      return prefs.drawTimeAlerts !== false;
    case 'official_result':
      return prefs.officialResultsAlerts !== false;
    case 'winning_prize':
      return prefs.winningPrizeAlerts !== false;
    case 'payment_system':
      return prefs.paymentAndSystemAlerts !== false;
    case 'missing_games':
      return prefs.missingGamesReminder !== false;
    default:
      return true;
  }
}

/**
 * Envia notificação imediata (respeitando as escolhas do participante caso a categoria seja informada)
 */
export async function sendAppNotification(
  title: string,
  options?: { body?: string; id?: number; category?: NotificationCategory; uid?: string | null }
) {
  if (options?.category && !isNotificationCategoryAllowed(options.category, options.uid)) {
    return;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: options?.id || Math.floor(Math.random() * 1000000) + 1,
            smallIcon: 'ic_stat_icon',
            sound: 'default',
            extra: { autoCheckPrize: true, category: options?.category }
          }
        ]
      });
      return;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule imediato falhou:', capErr);
    }
  }

  // Fallback para notificações Web no navegador / PWA
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body || '',
        icon: '/bolao_logo_app.png'
      });
    } catch (webErr) {
      console.warn('Web notification falhou:', webErr);
    }
  }
}

/**
 * Verifica se já foi disparada a notificação diária de novas mensagens no chat hoje (DD/MM/AAAA).
 * Retorna true e marca como enviada se ainda não tiver subido hoje e a preferência estiver ativa.
 */
export function canTriggerDailyChatNotification(uid: string): boolean {
  if (!uid) return false;
  if (!isNotificationCategoryAllowed('chat_daily', uid)) return false;

  const todayBR = formatDateBR(new Date()); // DD/MM/AAAA
  const storageKey = `bolao_daily_chat_notif_${uid}`;
  const lastNotifiedDay = localStorage.getItem(storageKey);

  if (lastNotifiedDay === todayBR) {
    return false; // Já subiu 1 notificação hoje
  }

  return true;
}

export function markDailyChatNotificationSent(uid: string): void {
  if (!uid) return;
  const todayBR = formatDateBR(new Date());
  localStorage.setItem(`bolao_daily_chat_notif_${uid}`, todayBR);
}

/**
 * Agenda notificação NATIVA para um horário exato no futuro.
 * O gatilho usa 'schedule: { at: targetDate, allowWhileIdle: true }' que é registrado
 * diretamente no AlarmManager do Android e funciona mesmo se o aplicativo estiver FECHADO.
 */
export async function scheduleNativeNotificationAt(
  title: string,
  body: string,
  targetDate: Date,
  id?: number,
  extraData?: Record<string, any>
): Promise<number | null> {
  const notifId = id || Math.floor(Math.random() * 900000) + 100000;

  if (Capacitor.isNativePlatform()) {
    try {
      if (targetDate.getTime() <= Date.now()) {
        return null;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            schedule: {
              at: targetDate,
              allowWhileIdle: true // Essencial para Android disparar em standby com app fechado
            },
            smallIcon: 'ic_stat_icon',
            sound: 'default',
            extra: extraData || { autoCheckPrize: true }
          }
        ]
      });

      console.log(`[Native Notification] Agendada com sucesso para ${targetDate.toLocaleString('pt-BR')} (ID: ${notifId})`);
      return notifId;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule nativo falhou:', capErr);
    }
  }

  return null;
}

/**
 * Agenda um alarme nativo de teste para daqui a N segundos (padrão: 10s).
 * Ideal para o usuário fechar o app e testar o disparo do alarme + conferência automática com o app fechado.
 */
export async function scheduleTestClosedAppAlarm(seconds: number = 10): Promise<Date> {
  const targetDate = new Date(Date.now() + seconds * 1000);
  const title = '🔔 Teste de Alarme Nativo + Conferência!';
  const body = 'O alarme disparou com sucesso! Toque aqui ou aguarde: conferindo automaticamente o jogo do dia na Caixa...';

  if (Capacitor.isNativePlatform()) {
    await scheduleNativeNotificationAt(title, body, targetDate, 888888, {
      autoCheckPrize: true,
      isTestAlarm: true
    });
  } else if (typeof window !== 'undefined') {
    setTimeout(() => {
      sendAppNotification(title, { body, id: 888888 });
    }, seconds * 1000);
  }

  return targetDate;
}

/**
 * Retorna a lista de alarmes nativos pendentes registrados no Android OS
 */
export async function getPendingNativeAlarms(): Promise<Array<{ id: number; title: string; body: string; at?: string }>> {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const pending = await LocalNotifications.getPending();
    if (!pending || !Array.isArray(pending.notifications)) return [];
    return pending.notifications.map((n: any) => ({
      id: n.id,
      title: n.title || 'Alarme do Bolão',
      body: n.body || '',
      at: n.schedule?.at ? new Date(n.schedule.at).toLocaleString('pt-BR') : undefined
    }));
  } catch (err) {
    console.warn('Erro ao listar alarmes nativos pendentes:', err);
    return [];
  }
}

/**
 * Agenda automaticamente no SO Android todos os alertas dos próximos sorteios
 * (19h30, 20h00, 20h35 e 21h05) utilizando gatilhos nativos do LocalNotifications.
 * Não depende de temporizadores JS (setInterval/setTimeout) e funciona com o app fechado.
 */
export async function scheduleUpcomingDrawAlerts(
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil',
  uid?: string | null
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  let scheduledCount = 0;

  try {
    // 1. Limpa agendamentos anteriores da faixa de sorteios (10000 a 999999) para evitar duplicatas
    try {
      const pending = await LocalNotifications.getPending();
      if (pending && pending.notifications.length > 0) {
        const idsToCancel = pending.notifications
          .filter(n => n.id >= 10000 && n.id <= 799999)
          .map(n => ({ id: n.id }));
        if (idsToCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: idsToCancel });
        }
      }
    } catch (cancelErr) {
      console.warn('Não foi possível cancelar agendamentos anteriores:', cancelErr);
    }

    const prefs = getUserNotificationPreferences(uid);
    if (!prefs.pushEnabled) {
      return 0;
    }

    // 2. Calcula as datas dos próximos 7 dias de sorteio válidos (pulando domingos e feriados da Caixa)
    const now = new Date();
    let currentCheckDate = new Date(now);

    for (let i = 0; i < 7; i++) {
      const nextDraw = getNextDrawDate(currentCheckDate, lotteryType);
      const drawDate = new Date(nextDraw.date);

      // Respeita os dias da semana escolhidos pelo participante
      if (Array.isArray(prefs.daysOfWeek) && !prefs.daysOfWeek.includes(drawDate.getDay())) {
        currentCheckDate = new Date(drawDate);
        currentCheckDate.setDate(currentCheckDate.getDate() + 1);
        continue;
      }

      // Alerta 1: 19h30 (30 minutos antes do sorteio)
      const date1930 = new Date(drawDate);
      date1930.setHours(19, 30, 0, 0);

      // Alerta 2: 20h00 (Horário oficial do sorteio)
      const date2000 = new Date(drawDate);
      date2000.setHours(20, 0, 0, 0);

      // Alerta 3: 20h35 (1ª Conferência automática das dezenas sorteadas)
      const date2035 = new Date(drawDate);
      date2035.setHours(20, 35, 0, 0);

      // Alerta 4: 21h05 (2ª Conferência automática com rateio oficial da Caixa liberado)
      const date2105 = new Date(drawDate);
      date2105.setHours(21, 5, 0, 0);

      const baseId = (i + 1) * 10000;
      const lotName = lotteryType === 'megasena' ? 'Mega-Sena' : 'Lotofácil';

      if (prefs.drawTimeAlerts !== false && prefs.notifyAt1930 !== false && date1930.getTime() > now.getTime()) {
        const res = await scheduleNativeNotificationAt(
          `⏰ Faltam 30 minutos! (${lotName})`,
          `O sorteio oficial da ${lotName} começa às 20h00. Verifique suas apostas no app!`,
          date1930,
          baseId + 1930,
          { autoCheckPrize: false, drawStage: '1930' }
        );
        if (res) scheduledCount++;
      }

      if (prefs.drawTimeAlerts !== false && prefs.notifyAt2000 !== false && date2000.getTime() > now.getTime()) {
        const res = await scheduleNativeNotificationAt(
          `🍀 Sorteio Oficial da ${lotName}!`,
          `O sorteio das 20h00 está começando agora!`,
          date2000,
          baseId + 2000,
          { autoCheckPrize: true, drawStage: '2000' }
        );
        if (res) scheduledCount++;
      }

      if (prefs.officialResultsAlerts !== false && prefs.notifyAt2035 !== false && date2035.getTime() > now.getTime()) {
        const res = await scheduleNativeNotificationAt(
          `🎉 Conferência do Jogo do Dia (${lotName})`,
          `Resultado das 20h35 liberado! Toque para conferir automaticamente se o jogo de hoje foi premiado!`,
          date2035,
          baseId + 2035,
          { autoCheckPrize: true, drawStage: '2035' }
        );
        if (res) scheduledCount++;
      }

      if (prefs.officialResultsAlerts !== false && prefs.notifyAt2035 !== false && date2105.getTime() > now.getTime()) {
        const res = await scheduleNativeNotificationAt(
          `🏆 Rateio Oficial Caixa (${lotName})`,
          `Verificando premiação oficial do concurso de hoje! Toque para ver o resultado das apostas.`,
          date2105,
          baseId + 2105,
          { autoCheckPrize: true, drawStage: '2105' }
        );
        if (res) scheduledCount++;
      }

      // Avança a data para procurar o próximo dia útil de sorteio
      currentCheckDate = new Date(drawDate);
      currentCheckDate.setDate(currentCheckDate.getDate() + 1);
    }
  } catch (err) {
    console.warn('Erro ao agendar alertas de sorteio nativos:', err);
  }

  return scheduledCount;
}

/**
 * Notifica automaticamente quando houver aposta premiada com valor do prêmio
 */
export async function notifyWinningPrize(
  contestNum: number | string,
  winningCount: number,
  totalPrize: number,
  highestHits?: number
) {
  const formattedPrize = totalPrize > 0
    ? `R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'Prêmio a conferir';

  const hitsInfo = highestHits ? ` (Maior acerto: ${highestHits} pontos)` : '';
  const title = `🏆 Aposta Premiada no Concurso #${contestNum}!`;
  const body = winningCount > 1
    ? `🎉 ${winningCount} apostas premiadas somando ${formattedPrize}${hitsInfo}! Abra o app e confira os detalhes!`
    : `🎉 1 aposta premiada no valor de ${formattedPrize}${hitsInfo}! Abra o app e confira os detalhes!`;

  await sendAppNotification(title, {
    body,
    id: Number(contestNum) || Math.floor(Math.random() * 1000000) + 1,
    category: 'winning_prize'
  });
}

/**
 * Agenda (ou cancela) notificações nativas a cada 2 horas nos dias em que não houver
 * jogo feito/cadastrado. Exclusivo para Administradores e Conselheiros.
 */
export async function syncMissingGamesTwoHourReminders(
  coveredDateStrings: string[],
  isAdminOrCounselor: boolean,
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil',
  uid?: string | null
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Cancela agendamentos anteriores da faixa 800000..899999
    try {
      const pending = await LocalNotifications.getPending();
      if (pending && pending.notifications.length > 0) {
        const idsToCancel = pending.notifications
          .filter(n => n.id >= 800000 && n.id <= 899999)
          .map(n => ({ id: n.id }));
        if (idsToCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: idsToCancel });
        }
      }
    } catch (cancelErr) {
      console.warn('Erro ao limpar lembretes de 2h anteriores:', cancelErr);
    }

    // Apenas Admin e Conselheiros recebem alertas de realizar os jogos, e somente se estiver ativo nas preferências
    if (!isAdminOrCounselor) return;
    if (!isNotificationCategoryAllowed('missing_games', uid)) return;

    const coveredSet = new Set(coveredDateStrings);
    const now = new Date();
    const hoursSlots = [8, 10, 12, 14, 16, 18, 20];

    // Verifica hoje (dayOffset = 0) e os próximos 3 dias
    for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
      const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      const drawCheck = isDrawDay(targetDay, lotteryType);
      if (!drawCheck.isDraw) continue;

      const dayBR = formatDateBR(targetDay);
      // Se já houver jogo cadastrado para este dia, não agenda lembrete de falta de jogo
      if (coveredSet.has(dayBR)) continue;

      // Agenda a cada 2 horas (08h, 10h, 12h, 14h, 16h, 18h, 20h)
      for (const hour of hoursSlots) {
        const alarmDate = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), hour, 0, 0, 0);
        if (alarmDate.getTime() > now.getTime() + 30000) {
          const notifId = 800000 + dayOffset * 100 + hour;
          await scheduleNativeNotificationAt(
            `⚠️ Lembrete: Jogos do Bolão Pendentes!`,
            `Ainda não há apostas cadastradas para o sorteio de ${dayOffset === 0 ? 'hoje' : dayBR} (${dayBR}). Lembre-se de realizar e subir os jogos!`,
            alarmDate,
            notifId,
            { missingGamesReminder: true }
          );
        }
      }

      // Se for HOJE e ainda não tiver jogo feito, garante também lembretes a cada 2h exatas a partir do momento atual
      if (dayOffset === 0) {
        for (let step = 1; step <= 4; step++) {
          const relativeAlarm = new Date(now.getTime() + step * 2 * 60 * 60 * 1000);
          if (
            relativeAlarm.getDate() === now.getDate() &&
            relativeAlarm.getHours() >= 7 &&
            relativeAlarm.getHours() <= 21
          ) {
            const relId = 850000 + step;
            await scheduleNativeNotificationAt(
              `⚠️ Sem Jogos Cadastrados Hoje (${dayBR})!`,
              `Lembrete a cada 2h: Precisa realizar e subir as apostas do bolão para o sorteio de hoje!`,
              relativeAlarm,
              relId,
              { missingGamesReminder: true }
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao sincronizar lembretes de 2h de jogos pendentes:', err);
  }
}

