import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePool } from '../lib/PoolContext';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName, normalizeBrazilianPhoneDigits } from '../lib/formatters';
import {
  sendAppNotification,
  syncPendingPaymentThreeDayReminders,
  getActiveUserDisplayName
} from '../lib/notifications';
import PixPaymentArea from './PixPaymentArea';

interface PixReceiptReminderBannerProps {
  user: any;
  userData: any;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export default function PixReceiptReminderBanner({ user, userData }: PixReceiptReminderBannerProps) {
  const { activePool } = usePool();
  const { addToast } = useToast();

  const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [liveMemberDoc, setLiveMemberDoc] = useState<any | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const activeUid = user?.uid || userData?.id || '';
  const activeContest = activePool?.currentContest || null;
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${m}/${d.getFullYear()}`;
  }, []);

  const userName = useMemo(() => {
    const raw =
      liveMemberDoc?.displayName ||
      liveMemberDoc?.name ||
      userData?.displayName ||
      userData?.name ||
      user?.displayName ||
      getActiveUserDisplayName() ||
      'Participante';
    return formatFirstAndLastName(raw);
  }, [liveMemberDoc, userData, user]);

  const userPhone = useMemo(() => {
    return (
      liveMemberDoc?.phone ||
      userData?.phone ||
      user?.phoneNumber ||
      ''
    );
  }, [liveMemberDoc, userData, user]);

  const quotasCount = useMemo(() => {
    const q = Number(liveMemberDoc?.quotas ?? userData?.quotas ?? 1);
    return q > 0 ? q : 1;
  }, [liveMemberDoc?.quotas, userData?.quotas]);

  const totalQuotaAmount = quotasCount * 20;

  // Escuta status atualizado do membro em 'members' e 'users'
  useEffect(() => {
    if (!activeUid) return;

    let unsubUser = () => {};
    let unsubMember = () => {};

    try {
      unsubUser = onSnapshot(doc(db, 'users', activeUid), (snap) => {
        if (snap.exists()) {
          setLiveMemberDoc((prev: any) => ({ ...(prev || {}), ...snap.data(), id: snap.id }));
        }
      }, () => {});
    } catch {}

    try {
      unsubMember = onSnapshot(doc(db, 'members', activeUid), (snap) => {
        if (snap.exists()) {
          setLiveMemberDoc((prev: any) => ({ ...(prev || {}), ...snap.data(), id: snap.id }));
        }
      }, () => {});
    } catch {}

    return () => {
      unsubUser();
      unsubMember();
    };
  }, [activeUid]);

  // Escuta comprovantes enviados em análise (pending_receipts) e pagamentos aprovados (payments)
  useEffect(() => {
    if (!activeUid) return;

    const unsubPending = onSnapshot(
      collection(db, 'pending_receipts'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPendingReceipts(list);
      },
      () => {}
    );

    const qPayments = query(collection(db, 'payments'), where('userId', '==', activeUid));
    const unsubPayments = onSnapshot(
      qPayments,
      (snap) => {
        setUserPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );

    return () => {
      unsubPending();
      unsubPayments();
    };
  }, [activeUid]);

  // Verifica se já enviou comprovante em análise para o concurso vigente / mês atual
  const matchingPendingReceipt = useMemo(() => {
    const normUserPhone = normalizeBrazilianPhoneDigits(userPhone);
    const cleanUserName = userName.trim().toLowerCase();

    return pendingReceipts.find((r) => {
      if (r.userId && r.userId === activeUid) return true;
      const normReceiptPhone = normalizeBrazilianPhoneDigits(r.phone || '');
      if (normUserPhone && normReceiptPhone && normUserPhone === normReceiptPhone) {
        return true;
      }
      const rName = String(r.name || '').trim().toLowerCase();
      if (cleanUserName && rName && (rName === cleanUserName || rName.includes(cleanUserName) || cleanUserName.includes(rName))) {
        return true;
      }
      return false;
    });
  }, [pendingReceipts, activeUid, userPhone, userName]);

  // Determina o status de pagamento do usuário no concurso/ciclo vigente
  const paymentState = useMemo<'paid' | 'under_review' | 'pending'>(() => {
    const statusField = liveMemberDoc?.paymentStatus || userData?.paymentStatus;
    if (statusField === 'Pago') {
      return 'paid';
    }

    // Verifica se há pagamento registrado para o mês vigente ou concurso vigente
    const hasCurrentPayment = userPayments.some((p) => {
      if (activeContest && Number(p.contestNumber) === Number(activeContest)) return true;
      if (p.month && String(p.month).trim() === currentMonthStr) return true;
      return false;
    });

    if (hasCurrentPayment) {
      return 'paid';
    }

    if (matchingPendingReceipt) {
      return 'under_review';
    }

    return 'pending';
  }, [liveMemberDoc?.paymentStatus, userData?.paymentStatus, userPayments, activeContest, currentMonthStr, matchingPendingReceipt]);

  // Sincroniza notificações a cada 3 dias caso o pagamento esteja pendente
  useEffect(() => {
    if (!activeUid) return;

    const isPending = paymentState === 'pending';

    // 1. Agenda ou cancela os alarmes nativos para +3, +6, +9 e +12 dias no Android
    syncPendingPaymentThreeDayReminders(
      isPending,
      userName,
      activeContest,
      totalQuotaAmount,
      activeUid
    );

    if (!isPending) return;

    // 2. Verifica se já se passaram 3 dias desde o último lembrete disparado para este membro
    const storageKey = `bolao_pending_payment_3day_ts_${activeUid}`;
    const firstSeenKey = `bolao_pending_payment_first_seen_${activeUid}`;
    const now = Date.now();
    const lastNotifiedRaw = localStorage.getItem(storageKey);
    const firstSeenRaw = localStorage.getItem(firstSeenKey);

    if (!firstSeenRaw) {
      localStorage.setItem(firstSeenKey, String(now));
    }

    const lastNotifiedTs = lastNotifiedRaw ? Number(lastNotifiedRaw) : 0;
    const shouldTriggerThreeDayAlert = !lastNotifiedTs || now - lastNotifiedTs >= THREE_DAYS_MS;

    if (shouldTriggerThreeDayAlert) {
      localStorage.setItem(storageKey, String(now));

      const contestLabel = activeContest ? `Concurso #${activeContest}` : `Mês ${currentMonthStr}`;
      const formattedAmount = `R$ ${totalQuotaAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const bucket3Day = Math.floor(now / THREE_DAYS_MS);
      const deterministicDocId = `pending_pix_${activeUid}_${bucket3Day}`;

      const notifTitle = `💳 Lembrete de PIX Pendente, ${userName}!`;
      const notifBody = `Olá, ${userName}! Identificamos que o seu comprovante PIX (${contestLabel} • ${formattedAmount}) ainda está pendente. Envie seu comprovante na página inicial para confirmar sua participação!`;

      // Dispara notificação no aparelho e registra no sino de notificações do membro
      sendAppNotification(notifTitle, {
        body: notifBody,
        id: 770000 + (bucket3Day % 10000),
        category: 'payment_system',
        uid: activeUid,
        targetPath: '/'
      }).catch(() => {});

      setDoc(
        doc(db, 'notifications', deterministicDocId),
        {
          userId: activeUid,
          title: notifTitle,
          message: notifBody,
          type: 'payment',
          targetPath: '/',
          read: false,
          createdAt: serverTimestamp()
        },
        { merge: true }
      ).catch(() => {});
    }
  }, [paymentState, activeUid, userName, activeContest, currentMonthStr, totalQuotaAmount]);

  const handleUploadReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Data = String(reader.result || '');
        const phoneToSend = userPhone || 'Via App';

        // Grava diretamente em pending_receipts com vínculo ao usuário e concurso vigente
        await addDoc(collection(db, 'pending_receipts'), {
          userId: activeUid,
          name: userName,
          phone: phoneToSend,
          contestNumber: activeContest || null,
          referenceMonth: currentMonthStr,
          quotas: quotasCount,
          amount: totalQuotaAmount,
          imageBase64: base64Data,
          mimeType: file.type || 'image/jpeg',
          createdAt: serverTimestamp(),
          status: 'pending'
        });

        // Notifica os administradores sobre o envio do comprovante
        try {
          const qAdmin = query(collection(db, 'users'), where('role', '==', 'admin'));
          const adminSnap = await getDocs(qAdmin);
          for (const adminDoc of adminSnap.docs) {
            const adminData = adminDoc.data();
            await addDoc(collection(db, 'notifications'), {
              userId: adminData.uid || adminDoc.id,
              title: '💸 Novo Comprovante PIX Recebido',
              message: `${userName} enviou o comprovante PIX (${quotasCount} cota${quotasCount > 1 ? 's' : ''} - R$ ${totalQuotaAmount.toFixed(2)}) referente ao ${activeContest ? `Concurso #${activeContest}` : currentMonthStr}!`,
              type: 'payment',
              targetPath: '/contatos',
              read: false,
              createdAt: serverTimestamp()
            });
          }
        } catch {}

        // Cancela os lembretes de 3 dias pois o comprovante já foi enviado
        syncPendingPaymentThreeDayReminders(false, userName, activeContest, totalQuotaAmount, activeUid);

        addToast('✅ Comprovante PIX enviado com sucesso! Aguardando homologação do administrador.', 'success');
      } catch (err) {
        console.error('Erro ao enviar comprovante PIX:', err);
        addToast('Erro ao enviar comprovante PIX. Tente novamente.', 'error');
      } finally {
        setIsUploadingReceipt(false);
        e.target.value = '';
      }
    };
  };

  // Se já estiver com status "Pago" homologado, oculta o lembrete de pendência
  if (paymentState === 'paid') {
    return null;
  }

  return (
    <>
      {paymentState === 'under_review' ? (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 rounded-2xl shadow-md border border-blue-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wide">
                  Comprovante em Homologação
                </span>
                {activeContest && (
                  <span className="text-[11px] font-extrabold text-blue-200">
                    Concurso Vigente #{activeContest}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black mt-1">
                Recebemos seu comprovante PIX, {userName}!
              </h3>
              <p className="text-xs text-blue-100/90 mt-0.5 leading-relaxed">
                Seu comprovante de <strong>R$ {totalQuotaAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({quotasCount} cota{quotasCount > 1 ? 's' : ''}) foi enviado e está aguardando confirmação da administração.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <label className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/25 transition cursor-pointer flex items-center gap-1.5">
              <span>🔄</span>
              <span>{isUploadingReceipt ? 'Enviando...' : 'Reenviar Foto'}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                disabled={isUploadingReceipt}
                onChange={handleUploadReceiptFile}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-4 sm:p-5 rounded-2xl shadow-lg border-2 border-amber-300/60 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                💸
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                    ⚠️ Status: Pagamento Pendente
                  </span>
                  <span className="bg-black/25 text-amber-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/15">
                    {activeContest ? `Concurso Vigente #${activeContest}` : `Ref. ${currentMonthStr}`}
                  </span>
                  <span className="text-[10px] font-bold text-amber-100/90 flex items-center gap-1">
                    🔔 Lembrete automático a cada 3 dias
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-white leading-snug pt-0.5">
                  Olá, {userName}! Você ainda não enviou o comprovante PIX do concurso vigente.
                </h3>

                <p className="text-xs text-amber-50/95 leading-relaxed">
                  Sua participação atual é de <strong>{quotasCount} cota{quotasCount > 1 ? 's' : ''}</strong> (Total: <strong className="underline">R$ {totalQuotaAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>). Realize o PIX ou anexe a foto do seu comprovante abaixo para atualizar seu status para <strong>Pago</strong>:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 md:self-center">
              <button
                type="button"
                onClick={() => setShowPixModal(true)}
                className="flex-1 sm:flex-initial bg-white hover:bg-amber-50 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>📱</span>
                <span>Ver QR Code / Chave PIX</span>
              </button>

              <label className="flex-1 sm:flex-initial bg-slate-950 hover:bg-slate-900 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                <span>📤</span>
                <span>{isUploadingReceipt ? 'Enviando...' : 'Enviar Comprovante'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={isUploadingReceipt}
                  onChange={handleUploadReceiptFile}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rápido de Pagamento PIX + Envio de Comprovante */}
      {showPixModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowPixModal(false)}
        >
          <div
            className="max-w-lg w-full my-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <PixPaymentArea
              customAmount={totalQuotaAmount}
              showAdminEdit={false}
              onClose={() => setShowPixModal(false)}
              title={`PIX do Concurso ${activeContest ? `#${activeContest}` : currentMonthStr}`}
            />
          </div>
        </div>
      )}
    </>
  );
}
