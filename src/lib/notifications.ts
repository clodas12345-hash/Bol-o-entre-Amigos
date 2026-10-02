import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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

export async function sendAppNotification(title: string, options?: { body?: string; id?: number }) {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: options?.id || Math.floor(Math.random() * 1000000) + 1,
            smallIcon: 'ic_stat_icon', // ou 'ic_launcher'
            sound: 'default'
          }
        ]
      });
      return;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule falhou:', capErr);
    }
  }

  // Fallback para notificações Web no navegador / PWA
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body || '',
        icon: '/pwa-192x192.png'
      });
    } catch (webErr) {
      console.warn('Web notification falhou:', webErr);
    }
  }
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
