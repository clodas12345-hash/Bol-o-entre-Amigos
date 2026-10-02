import { collection, addDoc, getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { sendAppNotification, notifyWinningPrize } from './notifications';

/**
 * Handles automatic notifications for a newly initiated contest.
 */
export async function triggerNewContestNotification(contestNum: number) {
  if (!contestNum || contestNum <= 0) return;

  try {
    // 1. Fetch notification rules/settings
    const settingsRef = doc(db, 'settings', 'notifications');
    const settingsSnap = await getDoc(settingsRef);
    
    let notifyOnNewContest = true;
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
    
    let notifyOnResultPublished = true;
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
    
    if (notifiedList.includes(contestNum)) {
      return; // Already notified
    }

    // 3. Dispatch the auto notification to 'all' members
    let title = '🎉 Resultado Oficial';
    let formattedMsg = resultPublishedTemplate.replace('{contest}', String(contestNum));

    if (winningCount > 0 && totalPrize > 0) {
      title = `🏆 Bolão Premiado (#${contestNum})!`;
      formattedMsg = `🎉 Tivemos ${winningCount} aposta(s) premiada(s) no Concurso #${contestNum}! Prêmio total: R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      
      // Native / Local Notification specifically for winning bets with prize details
      await notifyWinningPrize(contestNum, winningCount, totalPrize, highestHits);
    } else {
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
    notifiedList.push(contestNum);
    await setDoc(notifiedRef, { list: notifiedList }, { merge: true });
    
    console.log(`[Auto Notification] Successfully triggered result published alert for #${contestNum}.`);
  } catch (err) {
    console.warn('[Auto Notification] Error triggering result published notification:', err);
  }
}
