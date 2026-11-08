import { collection, addDoc, getDoc, getDocs, setDoc, updateDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { sendAppNotification, notifyWinningPrize } from './notifications';
import { calculateGamePrize } from './prizes';
import { fetchLotteryResultDirectly, LotteryResultData } from './apiHelper';

/**
 * Handles automatic notifications for a newly initiated contest.
 */
export async function triggerNewContestNotification(contestNum: number) {
  if (!contestNum || contestNum <= 0) return;

  try {
    // 1. Fetch notification rules/settings
    const settingsRef = doc(db, 'settings', 'notifications');
    const settingsSnap = await getDoc(settingsRef);
    
    let newContestTemplate = '🍀 Novo Concurso Iniciado! Confira as novas apostas do Concurso #{contest} já cadastradas no Bolão Amigos.';
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      if (data.notifyOnNewContest === false) return; // Disabled
      if (data.newContestTemplate) newContestTemplate = data.newContestTemplate;
    }

    // 2. Check if already notified for this contest to prevent double alerts
    const notifiedRef = doc(db, 'settings', 'notified_contests');
    const notifiedSnap = await getDoc(notifiedRef);
    let notifiedList: number[] = [];
    
    if (notifiedSnap.exists()) {
      notifiedList = notifiedSnap.data().list || [];
    }
    
    if (notifiedList.includes(contestNum)) {
      return; // Already notified
    }

    // 3. Dispatch the auto notification to 'all' members
    const formattedMsg = newContestTemplate.replace('{contest}', String(contestNum));
    await addDoc(collection(db, 'notifications'), {
      userId: 'all',
      title: '🍀 Novo Concurso',
      message: formattedMsg,
      type: 'info',
      read: false,
      createdAt: serverTimestamp()
    });

    // Also trigger native app / web push notification
    await sendAppNotification('🍀 Novo Concurso', {
      body: formattedMsg,
      id: contestNum,
      category: 'new_contest'
    });

    // 4. Update the notified contests list
    notifiedList.push(contestNum);
    await setDoc(notifiedRef, { list: notifiedList }, { merge: true });
    
    console.log(`[Auto Notification] Successfully triggered contest #${contestNum} alert.`);
  } catch (err) {
    console.warn('[Auto Notification] Error triggering new contest notification:', err);
  }
}

/**
 * Handles automatic notifications for a published contest result.
 */
export async function triggerResultNotification(contestNum: number, winningCount: number = 0, totalPrize: number = 0, highestHits: number = 0) {
  if (!contestNum || contestNum <= 0) return;

  try {
    // 1. Fetch notification rules/settings
    const settingsRef = doc(db, 'settings', 'notifications');
    const settingsSnap = await getDoc(settingsRef);
    
    let resultPublishedTemplate = '🎉 Resultado Publicado! Confira os números sorteados e acertos do Concurso #{contest} do Bolão Amigos.';
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      if (data.notifyOnResultPublished === false) return; // Disabled
      if (data.resultPublishedTemplate) resultPublishedTemplate = data.resultPublishedTemplate;
    }

    // 2. Check if already notified for this result to prevent double alerts
    const notifiedRef = doc(db, 'settings', 'notified_results');
    const notifiedSnap = await getDoc(notifiedRef);
    let notifiedList: number[] = [];
    
    if (notifiedSnap.exists()) {
      notifiedList = notifiedSnap.data().list || [];
    }
    
    // Allow re-notifying specifically if a prize was discovered after a generic result notification
    const prizeNotifiedKey = `bolao_prize_notified_global_${contestNum}_${Math.round(totalPrize)}`;
    const alreadyNotifiedPrize = totalPrize > 0 && localStorage.getItem(prizeNotifiedKey);

    if (notifiedList.includes(contestNum) && (totalPrize <= 0 || alreadyNotifiedPrize)) {
      return; // Already notified
    }

    // 3. Dispatch the auto notification to 'all' members
    let title = '🎉 Resultado Oficial';
    let formattedMsg = resultPublishedTemplate.replace('{contest}', String(contestNum));

    if (winningCount > 0 && totalPrize > 0) {
      const formattedPrize = `R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const hitsText = highestHits > 0 ? ` (${highestHits} pontos)` : '';
      title = `🏆 Parabéns, {name}! Aposta Premiada (#${contestNum})!`;
      formattedMsg =
        winningCount > 1
          ? `🎉 Parabéns, {name}! Tivemos ${winningCount} apostas premiadas no Concurso #${contestNum} somando ${formattedPrize}${hitsText}!`
          : `🎉 Parabéns, {name}! Tivemos 1 aposta premiada no Concurso #${contestNum} no valor de ${formattedPrize}${hitsText}!`;
      
      // Native / Local Notification specifically for winning bets with prize details
      await notifyWinningPrize(contestNum, winningCount, totalPrize, highestHits);
      localStorage.setItem(prizeNotifiedKey, new Date().toISOString());

      await setDoc(
        doc(db, 'notifications', `prize_contest_${contestNum}`),
        {
          userId: 'all',
          title,
          message: formattedMsg,
          type: 'prize',
          read: false,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );
    } else if (!notifiedList.includes(contestNum)) {
      await sendAppNotification(title, {
        body: formattedMsg,
        id: contestNum + 500000,
        category: 'official_result'
      });

      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title,
        message: formattedMsg,
        type: 'prize',
        read: false,
        createdAt: serverTimestamp()
      });
    }

    // 4. Update the notified results list
    if (!notifiedList.includes(contestNum)) {
      notifiedList.push(contestNum);
      await setDoc(notifiedRef, { list: notifiedList }, { merge: true });
    }
    
    console.log(`[Auto Notification] Successfully triggered result published alert for #${contestNum}.`);
  } catch (err) {
    console.warn('[Auto Notification] Error triggering result published notification:', err);
  }
}

/**
 * Confere automaticamente os jogos do concurso/dia contra o resultado oficial recém-obtido
 * e dispara notificação imediata caso haja aposta premiada, mesmo fora da aba de Apostas.
 */
export async function checkAndNotifyWinningGamesForResult(
  lotteryType: 'lotofacil' | 'megasena',
  result: LotteryResultData
) {
  if (!result || !result.contest || !Array.isArray(result.numbers) || result.numbers.length === 0) {
    return;
  }

  const contestNum = Number(result.contest);
  if (!contestNum || contestNum <= 0) return;

  try {
    // 1. Obtém jogos do cache local ou consulta Firestore para este concurso
    let candidateGames: any[] = [];

    try {
      const cached = localStorage.getItem('bolao_cache_games');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          candidateGames = parsed;
        }
      }
    } catch {
      // ignore cache parse errors
    }

    if (candidateGames.length === 0) {
      try {
        const qGames = query(collection(db, 'games'), where('contestNumber', '==', contestNum));
        const snap = await getDocs(qGames);
        candidateGames = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {
        // fallback se offline
      }
    }

    // Filtra os jogos que pertencem ao concurso apurado ou à data do sorteio do dia
    const matchingGames = candidateGames.filter((g) => {
      const gContestNum = Number(g.contestNumber);
      if (gContestNum === contestNum) return true;
      const contestStr = String(g.contest || '');
      const match = contestStr.match(/#?(\d{4})/);
      if (match && Number(match[1]) === contestNum) return true;
      return false;
    });

    if (matchingGames.length === 0) return;

    let winningCount = 0;
    let totalPrize = 0;
    let highestHits = 0;

    for (const game of matchingGames) {
      const nums = Array.isArray(game.numbers) ? game.numbers : [];
      if (nums.length === 0) continue;

      const prizeInfo = calculateGamePrize(nums, result.numbers, game.customPrize, result);
      if (prizeInfo.isWinner && prizeInfo.prizeAmount > 0) {
        winningCount++;
        totalPrize += prizeInfo.prizeAmount;
        if (prizeInfo.hits > highestHits) {
          highestHits = prizeInfo.hits;
        }
      }
    }

    if (winningCount > 0 && totalPrize > 0) {
      // Verifica se já notificou este prêmio neste dispositivo
      const localKey = `bolao_prize_notified_main_${contestNum}_${Math.round(totalPrize)}`;
      if (!localStorage.getItem(localKey)) {
        localStorage.setItem(localKey, new Date().toISOString());
        await triggerResultNotification(contestNum, winningCount, totalPrize, highestHits);
      }
    }
  } catch (err) {
    console.warn('[Auto Check] Erro ao conferir jogos do dia automaticamente:', err);
  }
}

/**
 * Executa busca ativa do resultado oficial da Caixa e confere automaticamente se o jogo do dia foi premiado.
 */
export async function runAutoPrizeCheck() {
  try {
    const lotoResult = await fetchLotteryResultDirectly('lotofacil', 'latest');
    if (lotoResult && lotoResult.contest > 0) {
      await checkAndNotifyWinningGamesForResult('lotofacil', lotoResult);
    }

    const megaResult = await fetchLotteryResultDirectly('megasena', 'latest');
    if (megaResult && megaResult.contest > 0) {
      await checkAndNotifyWinningGamesForResult('megasena', megaResult);
    }
  } catch (err) {
    console.warn('[Auto Prize Check] Falha na conferência automática:', err);
  }
}

/**
 * Serviço automático (cron-job local) que verifica os Pix agendados no banco
 * e dispara notificação push para o membro participante 24 horas antes do vencimento.
 */
export async function checkScheduledPix() {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // 24 horas a frente (amanhã)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const q = query(
      collection(db, 'payments'),
      where('isScheduledPix', '==', true)
    );
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const statusLower = String(data.status || '').toLowerCase();
      const isPending = statusLower === 'pending' || statusLower === 'pendente';
      if (!isPending) continue;

      const scheduledDate = String(data.scheduledDate || '').trim();
      if (!scheduledDate) continue;

      const memberName = data.memberName || 'Participante';
      const amountVal = Number(data.amount) || 0;
      const amountFormatted = amountVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      
      const [yyyy, mm, dd] = scheduledDate.split('-');
      const formattedDateBR = (dd && mm && yyyy) ? `${dd}/${mm}/${yyyy}` : scheduledDate;

      // 1. Notificação 24 HORAS ANTES do vencimento
      const isDueTomorrow = scheduledDate === tomorrowStr;
      const alreadyNotified24h = data.notified24hBefore === true || !!localStorage.getItem(`bolao_pix_24h_${docSnap.id}`);

      if (isDueTomorrow && !alreadyNotified24h) {
        const title = '⏰ Lembrete de Pix Agendado (Vence em 24h)';
        const body = `Olá, ${memberName}! Seu Pix programado de R$ ${amountFormatted} vence amanhã (${formattedDateBR}). Lembre-se de confirmar o envio do valor para o Bolão.`;

        // Dispara push notification para o membro
        await sendAppNotification(title, {
          body,
          id: Math.floor(Math.random() * 800000) + 200000,
          category: 'payment_system',
          uid: data.userId || null,
          targetPath: '/contatos'
        });

        // Grava no histórico de notificações do participante no Firestore
        if (data.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: data.userId,
            title,
            message: body,
            type: 'payment',
            targetPath: '/contatos',
            read: false,
            createdAt: serverTimestamp()
          });
        }

        // Atualiza o documento no Firestore para evitar envios duplicados
        await updateDoc(doc(db, 'payments', docSnap.id), {
          notified24hBefore: true,
          notified24hAt: serverTimestamp()
        });

        try {
          localStorage.setItem(`bolao_pix_24h_${docSnap.id}`, new Date().toISOString());
        } catch {}

        console.log(`[Auto Pix 24h] Notificação de 24h enviada para ${memberName} (vence em ${formattedDateBR})`);
      }

      // 2. Notificação no dia do vencimento (caso ainda pendente)
      const isDueToday = scheduledDate === todayStr;
      const alreadyNotifiedToday = data.notifiedToday === true || !!localStorage.getItem(`bolao_pix_today_${docSnap.id}`);

      if (isDueToday && !alreadyNotifiedToday) {
        const titleToday = '⚡ Pix Agendado Vencendo Hoje!';
        const bodyToday = `Olá, ${memberName}! Seu Pix programado de R$ ${amountFormatted} vence hoje (${formattedDateBR}). Por favor, realize ou confirme a transferência no Bolão.`;

        await sendAppNotification(titleToday, {
          body: bodyToday,
          id: Math.floor(Math.random() * 800000) + 300000,
          category: 'payment_system',
          uid: data.userId || null,
          targetPath: '/contatos'
        });

        if (data.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: data.userId,
            title: titleToday,
            message: bodyToday,
            type: 'payment',
            targetPath: '/contatos',
            read: false,
            createdAt: serverTimestamp()
          });
        }

        await updateDoc(doc(db, 'payments', docSnap.id), {
          notifiedToday: true,
          notifiedTodayAt: serverTimestamp()
        });

        try {
          localStorage.setItem(`bolao_pix_today_${docSnap.id}`, new Date().toISOString());
        } catch {}

        console.log(`[Auto Pix Today] Notificação de vencimento hoje enviada para ${memberName}`);
      }
    }
  } catch (err) {
    console.warn('[Auto Pix Check] Falha na verificação de Pix agendado:', err);
  }
}

let pixCronInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Inicializa o serviço contínuo de cron-job local para verificação periódica de Pix agendados.
 */
export function startScheduledPixCronService() {
  if (pixCronInterval) return;
  // Executa imediatamente na inicialização
  checkScheduledPix().catch(err => console.warn('[Pix Cron Startup] Erro:', err));

  // Executa periodicamente a cada 60 segundos
  pixCronInterval = setInterval(() => {
    checkScheduledPix().catch(err => console.warn('[Pix Cron Loop] Erro:', err));
  }, 60000);
}

/**
 * Dispara notificações para administradores sobre um novo comprovante enviado.
 */
export async function triggerNewReceiptNotification(senderName: string, senderPhone: string) {
  try {
    // Busca administradores em ambas as coleções
    const [usersSnap, membersSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('role', '==', 'admin'))),
      getDocs(query(collection(db, 'members'), where('role', '==', 'admin')))
    ]);
    
    const adminIds = new Set<string>();
    
    // Adiciona o admin principal (clodas12345@gmail.com) caso ele tenha um documento
    const mainAdminSnap = await getDocs(query(collection(db, 'users'), where('email', '==', 'clodas12345@gmail.com')));
    mainAdminSnap.docs.forEach(d => adminIds.add(d.id));

    usersSnap.docs.forEach(d => adminIds.add(d.id));
    membersSnap.docs.forEach(d => adminIds.add(d.id));

    // Se nenhum admin for encontrado pelo campo 'role', garante notificação para o UID do clodas se ele for conhecido
    // ou tenta encontrar pelo e-mail se o set estiver vazio
    if (adminIds.size === 0) {
      console.warn('[Auto Notification] Nenhum admin encontrado por papel. Tentando encontrar por e-mail fixo.');
    }

    for (const adminId of adminIds) {
      await addDoc(collection(db, 'notifications'), {
        userId: adminId,
        title: '💸 Novo Comprovante PIX',
        message: `${senderName} (${senderPhone}) enviou um comprovante. Clique para validar!`,
        type: 'payment',
        targetPath: '/contatos?tab=receipts',
        read: false,
        createdAt: serverTimestamp()
      });
    }

    // Caso o set ainda esteja vazio (nenhum usuário cadastrado como admin no banco), 
    // registramos um broadcast 'all' temporário para que o admin veja ao logar
    if (adminIds.size === 0) {
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title: '💸 Novo Comprovante PIX (Geral)',
        message: `${senderName} enviou um comprovante.`,
        type: 'payment',
        targetPath: '/contatos?tab=receipts',
        read: false,
        createdAt: serverTimestamp()
      });
    }

    console.log(`[Auto Notification] Notificações de comprovante registradas para ${adminIds.size || 'todos'} admins.`);
  } catch (err) {
    console.warn('[Auto Notification] Erro ao notificar admins sobre comprovante:', err);
  }
}
