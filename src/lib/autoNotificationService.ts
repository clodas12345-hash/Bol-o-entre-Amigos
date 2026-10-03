import { collection, addDoc, getDoc, getDocs, setDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
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
      id: contestNum
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
      title = `🏆 Jogo do Dia Premiado (#${contestNum})!`;
      formattedMsg = `🎉 Tivemos ${winningCount} aposta(s) premiada(s) no Concurso #${contestNum}! Prêmio total: R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      
      // Native / Local Notification specifically for winning bets with prize details
      await notifyWinningPrize(contestNum, winningCount, totalPrize, highestHits);
      localStorage.setItem(prizeNotifiedKey, new Date().toISOString());
    } else if (!notifiedList.includes(contestNum)) {
      await sendAppNotification(title, {
        body: formattedMsg,
        id: contestNum + 500000
      });
    }

    await addDoc(collection(db, 'notifications'), {
      userId: 'all',
      title,
      message: formattedMsg,
      type: 'prize',
      read: false,
      createdAt: serverTimestamp()
    });

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
