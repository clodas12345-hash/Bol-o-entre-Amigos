import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, getDocs, addDoc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { normalizeBrazilianPhoneDigits, formatFirstAndLastName } from '../lib/formatters';

interface ReceiptsListProps {
  onMemberUpdated?: () => void;
}

export default function ReceiptsList({ onMemberUpdated }: ReceiptsListProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [latePaymentModal, setLatePaymentModal] = useState<{
    receipt: any;
    member: any | null;
    currentMonthStr: string; // MM/YYYY
    prevMonthStr: string;    // MM/YYYY
    prevMonthKey: string;    // YYYY-MM for monthly_snapshots
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addToast } = useToast();

  const fetchAllMembers = async () => {
    try {
      const [usersSnap, membersSnap] = await Promise.all([
        getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'members')).catch(() => ({ docs: [] }))
      ]);

      const usersList: any[] = usersSnap.docs.map(d => ({
        id: d.id,
        collectionName: 'users',
        quotas: 1,
        ...d.data()
      }));
      const membersList: any[] = membersSnap.docs.map(d => ({
        id: d.id,
        collectionName: 'members',
        quotas: 1,
        ...d.data()
      }));

      const combined: any[] = [...usersList];
      for (const m of membersList) {
        const alreadyExists = combined.some(u =>
          u.id === m.id ||
          (m.phone && u.phone && normalizeBrazilianPhoneDigits(u.phone) === normalizeBrazilianPhoneDigits(m.phone)) ||
          (m.displayName && u.displayName && u.displayName.trim().toLowerCase() === m.displayName.trim().toLowerCase())
        );
        if (!alreadyExists) {
          combined.push(m);
        } else {
          // Guarda também o id na outra coleção se existir em ambas
          const idx = combined.findIndex(u =>
            u.id === m.id ||
            (m.phone && u.phone && normalizeBrazilianPhoneDigits(u.phone) === normalizeBrazilianPhoneDigits(m.phone)) ||
            (m.displayName && u.displayName && u.displayName.trim().toLowerCase() === m.displayName.trim().toLowerCase())
          );
          if (idx !== -1) {
            combined[idx] = {
              ...combined[idx],
              ...m,
              userDocId: combined[idx].collectionName === 'users' ? combined[idx].id : undefined,
              memberDocId: m.id
            };
          }
        }
      }

      // Ordem crescente alfabética (A-Z)
      combined.sort((a, b) => {
        const nameA = (a.displayName || a.name || '').trim();
        const nameB = (b.displayName || b.name || '').trim();
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      });

      setMembers(combined);
    } catch (err) {
      console.warn('Erro ao carregar membros em ReceiptsList:', err);
    }
  };

  useEffect(() => {
    const unsubReceipts = onSnapshot(collection(db, 'pending_receipts'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordena por nome crescente (A-Z)
      list.sort((a: any, b: any) => {
        const nameA = (a.name || '').trim();
        const nameB = (b.name || '').trim();
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      });
      setReceipts(list);
    });

    fetchAllMembers();
    return unsubReceipts;
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data não informada';
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data não informada';
    }
  };

  const getMonthsInfo = () => {
    const now = new Date();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curYear = now.getFullYear();
    const currentMonthStr = `${curMonth}/${curYear}`;

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevY = prevDate.getFullYear();
    const prevMonthStr = `${prevM}/${prevY}`;
    const prevMonthKey = `${prevY}-${prevM}`;

    return { currentMonthStr, prevMonthStr, prevMonthKey };
  };

  const findMatchingMember = (receipt: any) => {
    const normalizedReceiptPhone = normalizeBrazilianPhoneDigits(receipt.phone || '');
    const receiptNameClean = (receipt.name || '').trim().toLowerCase();

    return members.find(m => {
      const normalizedMemberPhone = normalizeBrazilianPhoneDigits(m.phone || '');
      if (normalizedReceiptPhone && normalizedMemberPhone && normalizedMemberPhone === normalizedReceiptPhone) {
        return true;
      }
      const mName = (m.displayName || m.name || '').trim().toLowerCase();
      if (receiptNameClean && mName && (mName === receiptNameClean || mName.includes(receiptNameClean) || receiptNameClean.includes(mName))) {
        return true;
      }
      return false;
    }) || null;
  };

  const handleClickApprove = (receipt: any) => {
    const matched = findMatchingMember(receipt);
    const { currentMonthStr, prevMonthStr, prevMonthKey } = getMonthsInfo();

    // Se o participante estava com status Pendente (ou não estava "Pago"), abre o pop-up perguntando sobre pagamento atrasado / mês anterior
    const isPending = !matched || matched.paymentStatus !== 'Pago';
    if (isPending) {
      setLatePaymentModal({
        receipt,
        member: matched,
        currentMonthStr,
        prevMonthStr,
        prevMonthKey
      });
    } else {
      finalizeApproval(receipt, matched, 'current', currentMonthStr, prevMonthKey);
    }
  };

  const finalizeApproval = async (
    receipt: any,
    member: any | null,
    targetPeriod: 'current' | 'previous',
    monthRefStr: string,
    prevMonthKey: string
  ) => {
    setIsProcessing(true);
    try {
      const approvalTimestamp = new Date();
      const quotas = Number(member?.quotas) > 0 ? Number(member.quotas) : 1;
      const amountPaid = quotas * 20.0;
      const isLatePreviousMonth = targetPeriod === 'previous';

      // 1. Salva no histórico homologado permanente (Auditoria / Homologação de Envio)
      await addDoc(collection(db, 'approved_receipts'), {
        name: receipt.name,
        phone: receipt.phone,
        imageBase64: receipt.imageBase64,
        submittedAt: receipt.createdAt || serverTimestamp(),
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.email || 'Administrador',
        matchedMemberName: member ? (member.displayName || member.name) : receipt.name,
        matchedMemberId: member ? member.id : null,
        referenceMonth: monthRefStr,
        isLatePreviousMonth,
        status: 'homologated'
      });

      // 2. Registra também na coleção 'payments' com o mês de referência escolhido (mês atual ou mês anterior em atraso)
      await addDoc(collection(db, 'payments'), {
        userId: member ? (member.uid || member.id) : receipt.phone,
        memberName: member ? (member.displayName || member.name) : receipt.name,
        amount: amountPaid,
        month: monthRefStr,
        isLatePayment: isLatePreviousMonth,
        receiptURL: receipt.imageBase64,
        createdAt: serverTimestamp(),
        homologatedBy: auth.currentUser?.email || 'Administrador'
      });

      // 3. Se o administrador escolheu salvar no mês anterior (pagamento atrasado), atualiza também o snapshot do mês anterior
      if (isLatePreviousMonth) {
        try {
          const snapRef = doc(db, 'monthly_snapshots', prevMonthKey);
          const snapDoc = await getDoc(snapRef);
          const memberEntry = {
            id: member?.id || `receipt_${Date.now()}`,
            displayName: member?.displayName || member?.name || receipt.name,
            phone: member?.phone || receipt.phone,
            quotas,
            paymentStatus: 'Pago',
            paidInArrearsAt: approvalTimestamp.toISOString(),
            monthRef: monthRefStr
          };

          if (snapDoc.exists()) {
            const existingMembers: any[] = snapDoc.data().members || [];
            const existsIdx = existingMembers.findIndex((em: any) =>
              em.id === memberEntry.id ||
              (em.phone && memberEntry.phone && normalizeBrazilianPhoneDigits(em.phone) === normalizeBrazilianPhoneDigits(memberEntry.phone))
            );
            let updatedSnapshotMembers = [...existingMembers];
            if (existsIdx !== -1) {
              updatedSnapshotMembers[existsIdx] = {
                ...updatedSnapshotMembers[existsIdx],
                paymentStatus: 'Pago',
                paidInArrearsAt: approvalTimestamp.toISOString()
              };
            } else {
              updatedSnapshotMembers.push(memberEntry);
            }
            updatedSnapshotMembers.sort((a, b) =>
              (a.displayName || '').localeCompare(b.displayName || '', 'pt-BR', { sensitivity: 'base' })
            );
            await setDoc(snapRef, {
              members: updatedSnapshotMembers,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } else {
            await setDoc(snapRef, {
              members: [memberEntry],
              updatedAt: serverTimestamp()
            });
          }
        } catch (snapErr) {
          console.warn('Aviso ao salvar snapshot do mês anterior:', snapErr);
        }
      }

      // 4. Assim que homologar, atualiza o status do participante para "Pago" imediatamente (tanto em members quanto em users se existir)
      if (member) {
        const receiptRecord = {
          imageUrl: receipt.imageBase64,
          date: receipt.createdAt || approvalTimestamp.toISOString(),
          approvedAt: approvalTimestamp.toISOString(),
          approvedBy: auth.currentUser?.email || 'Admin',
          referenceMonth: monthRefStr,
          isLatePreviousMonth,
          note: isLatePreviousMonth
            ? `Homologado como Pagamento Atrasado (Ref: ${monthRefStr})`
            : `Homologado e Aprovado (Ref: ${monthRefStr})`
        };

        const updatePayload: any = {
          receipts: arrayUnion(receiptRecord),
          paymentStatus: 'Pago',
          lastHomologatedAt: serverTimestamp(),
          lastPaidMonth: monthRefStr
        };

        const primaryCol = member.collectionName || 'members';
        await updateDoc(doc(db, primaryCol, member.id), updatePayload).catch(() => {});

        if (member.userDocId && member.userDocId !== member.id) {
          await updateDoc(doc(db, 'users', member.userDocId), updatePayload).catch(() => {});
        }
        if (member.memberDocId && member.memberDocId !== member.id) {
          await updateDoc(doc(db, 'members', member.memberDocId), updatePayload).catch(() => {});
        }

        // Atualiza também cache local se existir
        try {
          const localStr = localStorage.getItem('bolao_local_members');
          if (localStr) {
            const localArr = JSON.parse(localStr).map((m: any) =>
              (m.id === member.id || normalizeBrazilianPhoneDigits(m.phone || '') === normalizeBrazilianPhoneDigits(member.phone || ''))
                ? { ...m, paymentStatus: 'Pago', lastPaidMonth: monthRefStr }
                : m
            );
            localStorage.setItem('bolao_local_members', JSON.stringify(localArr));
          }
        } catch {}

        addToast(
          isLatePreviousMonth
            ? `Comprovante de "${formatFirstAndLastName(member.displayName || member.name)}" homologado no mês anterior (${monthRefStr}) e status alterado para PAGO!`
            : `Comprovante de "${formatFirstAndLastName(member.displayName || member.name)}" homologado e status alterado para PAGO!`,
          'success'
        );
      } else {
        // Caso o membro ainda não estivesse cadastrado, cria já aprovado e com status Pago
        await addDoc(collection(db, 'members'), {
          displayName: receipt.name,
          phone: normalizeBrazilianPhoneDigits(receipt.phone || ''),
          quotas: 1,
          role: 'participant',
          paymentStatus: 'Pago',
          approved: true,
          lastPaidMonth: monthRefStr,
          createdAt: serverTimestamp(),
          receipts: [{
            imageUrl: receipt.imageBase64,
            date: new Date().toISOString(),
            approvedAt: approvalTimestamp.toISOString(),
            approvedBy: auth.currentUser?.email || 'Admin',
            referenceMonth: monthRefStr,
            isLatePreviousMonth,
            note: isLatePreviousMonth
              ? `Homologado como Pagamento Atrasado (Ref: ${monthRefStr})`
              : `Homologado e Aprovado (Ref: ${monthRefStr})`
          }]
        });
        addToast(`Comprovante homologado (${monthRefStr}) e participante "${receipt.name}" registrado como PAGO!`, 'success');
      }

      await deleteDoc(doc(db, 'pending_receipts', receipt.id));
      setLatePaymentModal(null);
      await fetchAllMembers();
      onMemberUpdated?.();
    } catch (e) {
      console.error(e);
      addToast('Erro ao homologar comprovante.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (receiptId: string) => {
    try {
      await deleteDoc(doc(db, 'pending_receipts', receiptId));
      addToast('Comprovante rejeitado/removido.', 'info');
    } catch (e) {
      console.error(e);
      addToast('Erro ao remover comprovante.', 'error');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Pop-up perguntando sobre pagamento atrasado com opção de salvar no mês anterior */}
      {latePaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
                  ⏰
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm sm:text-base">
                    Confirmação de Homologação (Status Pendente)
                  </h4>
                  <p className="text-[11px] text-amber-700 font-bold">
                    Participante: {latePaymentModal.member?.displayName || latePaymentModal.receipt.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLatePaymentModal(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5 leading-relaxed">
              <p className="font-bold">
                Este participante consta com status <span className="underline text-red-700">Pendente</span>.
              </p>
              <p>
                Trata-se de um <strong>pagamento atrasado referente ao mês anterior ({latePaymentModal.prevMonthStr})</strong> ou do pagamento regular do <strong>mês atual ({latePaymentModal.currentMonthStr})</strong>?
              </p>
              <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                ✓ Em ambos os casos, o status do participante mudará imediatamente para <strong>PAGO</strong>.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  finalizeApproval(
                    latePaymentModal.receipt,
                    latePaymentModal.member,
                    'previous',
                    latePaymentModal.prevMonthStr,
                    latePaymentModal.prevMonthKey
                  )
                }
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition cursor-pointer shadow-sm flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Pagamento Atrasado — Salvar no Mês Anterior ({latePaymentModal.prevMonthStr})</span>
                </span>
                <span>➔</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  finalizeApproval(
                    latePaymentModal.receipt,
                    latePaymentModal.member,
                    'current',
                    latePaymentModal.currentMonthStr,
                    latePaymentModal.prevMonthKey
                  )
                }
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-sm flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Pagamento Regular — Salvar no Mês Atual ({latePaymentModal.currentMonthStr})</span>
                </span>
                <span>➔</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setLatePaymentModal(null)}
                className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <span>🧾</span> Comprovantes Pendentes de Homologação
        </h3>
        <p className="text-[11px] text-blue-200 mt-1">
          Ao homologar, o status do participante muda imediatamente para PAGO (com opção de registrar no mês anterior em caso de atraso).
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-xs font-bold shadow-xs border">
          Nenhum comprovante pendente no momento.
        </div>
      ) : (
        receipts.map(r => {
          const matched = findMatchingMember(r);
          return (
            <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <a href={r.imageBase64} target="_blank" rel="noopener noreferrer" title="Ampliar imagem">
                  <img src={r.imageBase64} alt="Comprovante" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-200 hover:scale-105 transition cursor-pointer shadow-xs shrink-0" />
                </a>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm text-gray-900 truncate">{r.name}</p>
                    {matched && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        matched.paymentStatus === 'Pago'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        Status Atual: {matched.paymentStatus || 'Pendente'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono font-bold text-indigo-700">{r.phone}</p>
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>📅</span> Enviado em: <strong className="text-gray-700">{formatDate(r.createdAt)}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleClickApprove(r)}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>✓</span> Homologar / Aprovar
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={isProcessing}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer border border-red-200"
                  title="Excluir/Rejeitar comprovante"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
