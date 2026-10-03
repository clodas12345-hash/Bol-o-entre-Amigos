import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getNextDrawDate } from './drawCalendar';

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

/**
 * Envia notificação imediata
 */
export async function sendAppNotification(title: string, options?: { body?: string; id?: number }) {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: options?.id || Math.floor(Math.random() * 1000000) + 1,
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_stat_icon',
            sound: 'default',
            extra: { autoCheckPrize: true }
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
            largeIcon: 'ic_stat_icon',
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
  lotteryType: 'lotofacil' | 'megasena' = 'lotofacil'
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

    // 2. Calcula as datas dos próximos 7 dias de sorteio válidos (pulando domingos e feriados da Caixa)
    const now = new Date();
    let currentCheckDate = new Date(now);

    for (let i = 0; i < 7; i++) {
      const nextDraw = getNextDrawDate(currentCheckDate, lotteryType);
      const drawDate = new Date(nextDraw.date);

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

      if (date1930.getTime() > now.getTime()) {
        const res = await scheduleNativeNotificationAt(
          `⏰ Faltam 30 minutos! (${lotName})`,
          `O sorteio oficial da ${lotName} começa às 20h00. Verifique suas apostas no app!`,
          date1930,
          baseId + 1930,
          { autoCheckPrize: false, drawStage: '1930' }
        );
        if (res) scheduledCount++;
      }

      if (date2000.getTime() > now.getTime()) {
        const res = await scheduleNativeNotificationAt(
          `🍀 Sorteio Oficial da ${lotName}!`,
          `O sorteio das 20h00 está começando agora!`,
          date2000,
          baseId + 2000,
          { autoCheckPrize: true, drawStage: '2000' }
        );
        if (res) scheduledCount++;
      }

      if (date2035.getTime() > now.getTime()) {
        const res = await scheduleNativeNotificationAt(
          `🎉 Conferência do Jogo do Dia (${lotName})`,
          `Resultado das 20h35 liberado! Toque para conferir automaticamente se o jogo de hoje foi premiado!`,
          date2035,
          baseId + 2035,
          { autoCheckPrize: true, drawStage: '2035' }
        );
        if (res) scheduledCount++;
      }

      if (date2105.getTime() > now.getTime()) {
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
    id: Number(contestNum) || Math.floor(Math.random() * 1000000) + 1
  });
}
