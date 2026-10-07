import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getNextDrawDate, isDrawDay, formatDateBR } from './drawCalendar';

let lastNotificationError: string | null = null;

export function getLastNotificationError(): string | null {
  return lastNotificationError;
}

export function setLastNotificationError(err: string | null) {
  lastNotificationError = err;
}

export interface NotificationStatusDetails {
  granted: boolean;
  display: 'granted' | 'denied' | 'prompt' | 'unknown';
  exactAlarm?: string;
  channelReady: boolean;
  platform: 'android' | 'ios' | 'web';
  error?: string;
}

/**
 * Cria os canais de notificação com importância máxima (id "default", nome "Notificações")
 * Essencial para Android 8+ e Samsung One UI exibirem heads-up banners e som.
 */
let channelCreated = false;

export async function ensureAndroidHighImportanceChannel(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    // 1. Canal principal exigido com id "default" e nome "Notificações"
    await LocalNotifications.createChannel({
      id: 'default',
      name: 'Notificações',
      description: 'Notificações de sorteios, resultados, apostas e mensagens do Bolão Amigos',
      importance: 5, // Importância máxima (Heads-up / Som / Vibração)
      visibility: 1, // Visível na tela de bloqueio
      vibration: true,
      sound: 'default'
    });

    // 2. Canal complementar para compatibilidade reversa
    await LocalNotifications.createChannel({
      id: 'bolao_high_priority',
      name: 'Alertas e Menções do Bolão',
      description: 'Alertas urgentes de sorteios, prêmios e menções',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'default'
    });

    channelCreated = true;
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn('Erro ao criar NotificationChannel:', msg);
    lastNotificationError = `Erro no canal de notificações: ${msg}`;
    return false;
  }
}

// Inicializa canal imediatamente se estiver no Android nativo
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  ensureAndroidHighImportanceChannel().catch(() => {});
}

/**
 * Solicita a permissão de notificação em tempo de execução (Android 13+ / Web)
 * e retorna detalhes completos para feedback e depuração em tela.
 */
export async function requestNotificationPermissionWithDetails(): Promise<NotificationStatusDetails> {
  await ensureAndroidHighImportanceChannel();

  if (Capacitor.isNativePlatform()) {
    try {
      let check = await LocalNotifications.checkPermissions();
      if (check.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        check = req;
      }

      const isGranted = check.display === 'granted';
      if (!isGranted) {
        lastNotificationError = `Permissão negada pelo usuário ou bloqueada pelo sistema (${check.display})`;
      } else {
        lastNotificationError = null;
      }

      let exactAlarm = 'unknown';
      try {
        const exactSetting = await (LocalNotifications as any).checkExactNotificationSetting?.();
        exactAlarm = exactSetting?.exact_alarm || 'granted';
      } catch {}

      return {
        granted: isGranted,
        display: check.display as any,
        exactAlarm,
        channelReady: channelCreated,
        platform: Capacitor.getPlatform() as any,
        error: lastNotificationError || undefined
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      lastNotificationError = `Falha ao solicitar permissões nativas: ${msg}`;
      return {
        granted: false,
        display: 'denied',
        channelReady: channelCreated,
        platform: Capacitor.getPlatform() as any,
        error: msg
      };
    }
  }

  // Plataforma Web / PWA
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      let currentPerm = Notification.permission;
      if (currentPerm === 'default') {
        currentPerm = await Notification.requestPermission();
      }
      const isGranted = currentPerm === 'granted';
      if (!isGranted) {
        lastNotificationError = `Permissão do navegador: ${currentPerm}`;
      } else {
        lastNotificationError = null;
      }
      return {
        granted: isGranted,
        display: currentPerm as any,
        channelReady: true,
        platform: 'web',
        error: lastNotificationError || undefined
      };
    } catch (webErr: any) {
      const msg = webErr?.message || String(webErr);
      lastNotificationError = `Erro permissão Web: ${msg}`;
      return {
        granted: false,
        display: 'denied',
        channelReady: false,
        platform: 'web',
        error: msg
      };
    }
  }

  return {
    granted: false,
    display: 'denied',
    channelReady: false,
    platform: 'web',
    error: 'Notificações não suportadas neste navegador'
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  const result = await requestNotificationPermissionWithDetails();
  return result.granted;
}

/**
 * Consulta o status atual de permissões sem abrir diálogo
 */
export async function getNotificationPermissionStatus(): Promise<NotificationStatusDetails> {
  if (Capacitor.isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      let exactAlarm = 'unknown';
      try {
        const exactSetting = await (LocalNotifications as any).checkExactNotificationSetting?.();
        exactAlarm = exactSetting?.exact_alarm || 'granted';
      } catch {}

      return {
        granted: check.display === 'granted',
        display: check.display as any,
        exactAlarm,
        channelReady: channelCreated,
        platform: Capacitor.getPlatform() as any,
        error: lastNotificationError || undefined
      };
    } catch (err: any) {
      return {
        granted: false,
        display: 'unknown',
        channelReady: channelCreated,
        platform: Capacitor.getPlatform() as any,
        error: err?.message || String(err)
      };
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return {
      granted: Notification.permission === 'granted',
      display: Notification.permission as any,
      channelReady: true,
      platform: 'web',
      error: lastNotificationError || undefined
    };
  }

  return {
    granted: false,
    display: 'unknown',
    channelReady: false,
    platform: 'web',
    error: 'Navegador não suporta Notificações'
  };
}

/**
 * Solicita exceção de otimização de bateria e verificação de alarmes exatos
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
  } catch (err: any) {
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

export function saveUserNotificationPreferencesLocal(
  prefs: Partial<UserNotificationPreferences>,
  uid?: string | null
): UserNotificationPreferences {
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
  | 'chat_mention'
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
  if (prefs.pushEnabled === false) return false;

  switch (category) {
    case 'chat_mention':
      return true;
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

export function resolveNotificationTargetPath(input?: {
  targetPath?: string;
  category?: NotificationCategory | string;
  type?: string;
  title?: string;
  body?: string;
}): string {
  if (input?.targetPath) return input.targetPath;

  const cat = String(input?.category || '').toLowerCase();
  const type = String(input?.type || '').toLowerCase();
  const titleLower = String(input?.title || '').toLowerCase();
  const bodyLower = String(input?.body || '').toLowerCase();

  if (
    cat === 'chat_mention' ||
    cat === 'chat_daily' ||
    type === 'chat' ||
    titleLower.includes('chat') ||
    titleLower.includes('marcou você') ||
    titleLower.includes('marcou @todos') ||
    bodyLower.includes('mensagens no chat')
  ) {
    return '/chat';
  }

  if (
    type === 'payment' ||
    titleLower.includes('cota') ||
    titleLower.includes('pagamento') ||
    titleLower.includes('participante') ||
    titleLower.includes('aprovação')
  ) {
    return '/contatos';
  }

  if (titleLower.includes('regra') || titleLower.includes('norma')) {
    return '/rules';
  }

  if (titleLower.includes('calendário') || titleLower.includes('agenda')) {
    return '/calendar';
  }

  // Sorteios, prêmios, resultados, novos concursos e jogos pendentes levam para a página principal de Apostas
  return '/';
}

/**
 * Envia notificação IMEDIATA através do NotificationChannel de importância alta "default".
 */
export async function sendAppNotification(
  title: string,
  options?: {
    body?: string;
    id?: number;
    category?: NotificationCategory;
    uid?: string | null;
    targetPath?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (options?.category && !isNotificationCategoryAllowed(options.category, options.uid)) {
    return { success: false, error: 'Categoria desabilitada nas preferências do usuário' };
  }

  const targetPath = resolveNotificationTargetPath({
    targetPath: options?.targetPath,
    category: options?.category,
    title,
    body: options?.body
  });

  // Emite banner in-app imediato
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('bolao_in_app_push_banner', {
          detail: {
            id: options?.id || Date.now(),
            title,
            body: options?.body || '',
            category: options?.category,
            targetPath
          }
        })
      );
    } catch {}
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureAndroidHighImportanceChannel();
      const notifId = options?.id || Math.floor(Math.random() * 1000000) + 1;

      // Disparo imediato com canal 'default' e som padrão
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: notifId,
            channelId: 'default', // Exigência do Requisito 4
            smallIcon: 'ic_stat_icon',
            sound: 'default',
            extra: {
              autoCheckPrize: true,
              category: options?.category,
              targetPath
            }
          }
        ]
      });
      lastNotificationError = null;
      return { success: true };
    } catch (capErr: any) {
      const msg = capErr?.message || String(capErr);
      console.warn('LocalNotifications.schedule imediato falhou:', msg);
      lastNotificationError = `Erro ao disparar notificação: ${msg}`;
      return { success: false, error: msg };
    }
  }

  // Fallback Web / PWA
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        const webNotif = new Notification(title, {
          body: options?.body || '',
          icon: '/bolao_logo_app.png'
        });
        webNotif.onclick = () => {
          try {
            window.focus();
            window.dispatchEvent(
              new CustomEvent('bolao_navigate_to', { detail: { path: targetPath } })
            );
          } catch {}
          webNotif.close();
        };
        lastNotificationError = null;
        return { success: true };
      }
    } catch (webErr: any) {
      const msg = webErr?.message || String(webErr);
      lastNotificationError = `Erro Web Notification: ${msg}`;
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Função utilitária para teste imediato de notificação com retorno e diagnóstico
 */
export async function testImmediateNotification(uid?: string | null): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const permResult = await requestNotificationPermissionWithDetails();
    if (!permResult.granted) {
      return {
        success: false,
        message: 'Permissão de notificação negada ou não concedida pelo sistema.',
        error: permResult.error || 'Permissão com status: ' + permResult.display
      };
    }

    const res = await sendAppNotification('🔔 Teste de Notificação - Bolão Amigos', {
      body: `Notificação enviada com sucesso às ${new Date().toLocaleTimeString('pt-BR')}! O canal de importância alta está funcionando.`,
      category: 'test',
      uid
    });

    if (res.success) {
      return {
        success: true,
        message: 'Notificação imediata disparada com sucesso no canal "default"!'
      };
    } else {
      return {
        success: false,
        message: 'Falha ao agendar notificação imediata.',
        error: res.error
      };
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    return {
      success: false,
      message: 'Erro ao disparar teste de notificação.',
      error: msg
    };
  }
}

/**
 * Verifica se já foi disparada a notificação diária de novas mensagens no chat hoje (DD/MM/AAAA).
 */
export function canTriggerDailyChatNotification(uid: string): boolean {
  if (!uid) return false;
  if (!isNotificationCategoryAllowed('chat_daily', uid)) return false;

  const todayBR = formatDateBR(new Date());
  const storageKey = `bolao_daily_chat_notif_${uid}`;
  const lastNotifiedDay = localStorage.getItem(storageKey);

  if (lastNotifiedDay === todayBR) {
    return false;
  }

  return true;
}

export function markDailyChatNotificationSent(uid: string): void {
  if (!uid) return;
  const todayBR = formatDateBR(new Date());
  localStorage.setItem(`bolao_daily_chat_notif_${uid}`, todayBR);
}

/**
 * Agenda notificação NATIVA para um horário exato no futuro com canal "default"
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

      await ensureAndroidHighImportanceChannel();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            channelId: 'default', // Canal de importância alta (Requisito 4)
            schedule: {
              at: targetDate,
              allowWhileIdle: true // Essencial para Android / Samsung One UI disparar com o app fechado
            },
            smallIcon: 'ic_stat_icon',
            sound: 'default',
            extra: extraData || { autoCheckPrize: true }
          }
        ]
      });

      console.log(`[Native Notification] Agendada para ${targetDate.toLocaleString('pt-BR')} (ID: ${notifId})`);
      lastNotificationError = null;
      return notifId;
    } catch (capErr: any) {
      const msg = capErr?.message || String(capErr);
      console.warn('LocalNotifications.schedule nativo falhou:', msg);
      lastNotificationError = `Erro ao agendar notificação futura: ${msg}`;
    }
  }

  return null;
}

/**
 * Agenda um alarme nativo de teste para daqui a N segundos (padrão: 10s).
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
  } catch (err: any) {
    console.warn('Erro ao listar alarmes nativos pendentes:', err);
    return [];
  }
}

/**
 * Agenda automaticamente no SO Android todos os alertas dos próximos sorteios
 */
export async function scheduleUpcomingDrawAlerts(
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil',
  uid?: string | null
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  let scheduledCount = 0;

  try {
    await ensureAndroidHighImportanceChannel();

    // 1. Limpa agendamentos anteriores da faixa de sorteios (10000 a 799999) para evitar duplicatas
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

    // 2. Calcula as datas dos próximos 7 dias de sorteio válidos
    const now = new Date();
    let currentCheckDate = new Date(now);

    for (let i = 0; i < 7; i++) {
      const nextDraw = getNextDrawDate(currentCheckDate, lotteryType);
      const drawDate = new Date(nextDraw.date);

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

      currentCheckDate = new Date(drawDate);
      currentCheckDate.setDate(currentCheckDate.getDate() + 1);
    }
  } catch (err: any) {
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
    await ensureAndroidHighImportanceChannel();

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

    if (!isAdminOrCounselor) return;
    if (!isNotificationCategoryAllowed('missing_games', uid)) return;

    const coveredSet = new Set(coveredDateStrings);
    const now = new Date();
    const hoursSlots = [8, 10, 12, 14, 16, 18, 20];

    for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
      const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      const drawCheck = isDrawDay(targetDay, lotteryType);
      if (!drawCheck.isDraw) continue;

      const dayBR = formatDateBR(targetDay);
      if (coveredSet.has(dayBR)) continue;

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
