import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, getDoc, getDocs, query, where, setDoc, addDoc, deleteDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, isQuotaError, auth } from '../lib/firebase';
import { formatFirstAndLastName, getWhatsAppCobrarUrl, calculatePendingMonths, isMemberActiveInMonth, normalizeBrazilianPhoneDigits } from '../lib/formatters';
import { useToast } from './NotificationManager';
import PixPaymentArea from './PixPaymentArea';
import { PixConfig, DEFAULT_PIX_CONFIG } from '../lib/pix';
import { usePool } from '../lib/PoolContext';
import { usePermissions } from '../lib/PermissionsContext';
import { useData } from '../lib/DataContext';
import PaymentDetailsModal from './PaymentDetailsModal';
import PaymentThankYouWhatsAppModal, { PaymentThankYouPayload } from './PaymentThankYouWhatsAppModal';

export default function DetailedFinancialReport() {
  const { setIsQuotaExceeded } = usePool();
  const { can } = usePermissions();
  const { payments, members } = useData();
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedPaymentForModal, setSelectedPaymentForModal] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixConfig, setPixConfig] = useState<PixConfig>(DEFAULT_PIX_CONFIG);
  const [thankYouModalData, setThankYouModalData] = useState<PaymentThankYouPayload | null>(null);

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showAllTime, setShowAllTime] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const loadPix = async () => {
      try {
        const pixSnap = await getDoc(doc(db, 'settings', 'pix'));
        if (pixSnap.exists()) {
          setPixConfig(pixSnap.data() as PixConfig);
        }
      } catch {}
    };
    loadPix();
  }, []);

  const togglePaymentStatus = async (member: any, targetMonthKey?: string) => {
    if (!member) return;
    const memberId = member.id || member.uid;
    if (!memberId) return;

    if (isUpdatingStatus === memberId) return;
    setIsUpdatingStatus(memberId);

    try {
      const monthKey = targetMonthKey || `${String(filterMonth).padStart(2, '0')}/${filterYear}`;
      const memberPhoneClean = member.phone ? normalizeBrazilianPhoneDigits(member.phone) : '';
      const isMatchingMemberPayment = (p: any) =>
        p.userId === member.id ||
        p.userId === member.uid ||
        (memberPhoneClean && p.phone && normalizeBrazilianPhoneDigits(p.phone) === memberPhoneClean);
      const isPaidInMonth = payments.some(p => isMatchingMemberPayment(p) && p.month === monthKey);
      const newStatus = isPaidInMonth ? 'Pendente' : 'Pago';
      const currentUserEmail = auth.currentUser?.email || auth.currentUser?.displayName || 'Administrador';

      if (newStatus === 'Pago') {
        const quotas = Number(member.quotas) > 0 ? Number(member.quotas) : 1;
        const amount = quotas * (pixConfig.defaultAmount || 20.00);

        let attachedReceiptURL: string | null = null;
        try {
          const qReceipts = query(collection(db, 'pending_receipts'), where('status', '==', 'pending'));
          const receiptsSnap = await getDocs(qReceipts);
          const memberPhoneClean = member.phone ? normalizeBrazilianPhoneDigits(member.phone) : '';
          
          const matchingPending = receiptsSnap.docs.find(d => {
            const data = d.data();
            const sameUser = (data.userId && (data.userId === member.id || data.userId === member.uid));
            const pendingPhone = data.phone ? normalizeBrazilianPhoneDigits(data.phone) : '';
            const samePhone = (memberPhoneClean && pendingPhone && memberPhoneClean === pendingPhone);
            return sameUser || samePhone;
          });

          if (matchingPending) {
            const pData = matchingPending.data();
            attachedReceiptURL = pData.imageBase64 || pData.receiptUrl || null;
            await updateDoc(doc(db, 'pending_receipts', matchingPending.id), {
              status: 'homologated',
              referenceMonth: monthKey,
              homologatedAt: serverTimestamp(),
              homologatedBy: currentUserEmail
            }).catch(() => {});
          }
        } catch {}

        if (!attachedReceiptURL && Array.isArray(member.receipts)) {
          const inProfile = member.receipts.find((r: any) => r.referenceMonth === monthKey);
          if (inProfile?.imageUrl) {
            attachedReceiptURL = inProfile.imageUrl;
          }
        }

        await addDoc(collection(db, 'payments'), {
          userId: member.uid || member.id,
          memberName: member.displayName || member.name || 'Participante',
          phone: member.phone || '',
          amount: amount,
          month: monthKey,
          status: 'Pago',
          receiptURL: attachedReceiptURL,
          createdAt: serverTimestamp(),
          homologatedBy: currentUserEmail,
          history: [{
            timestamp: new Date().toISOString(),
            updatedBy: currentUserEmail,
            userRole: auth.currentUser?.email ? 'admin' : 'membro',
            previousStatus: 'Pendente',
            newStatus: 'Pago',
            note: `Status alterado no Extrato Financeiro por ${currentUserEmail} para o mês ${monthKey}`
          }]
        }).catch((e) => {
          console.warn('Erro ao salvar pagamento em payments:', e);
        });

        addToast(`Pagamento de ${monthKey} registrado para ${formatFirstAndLastName(member.displayName || member.email)}!`, 'success');
      } else {
        const matchingPaymentsToDelete = payments.filter(p => isMatchingMemberPayment(p) && p.month === monthKey);
        if (matchingPaymentsToDelete.length > 0) {
          await Promise.all(
            matchingPaymentsToDelete.map(p => deleteDoc(doc(db, 'payments', p.id)).catch(() => {}))
          );
          addToast(`Pagamento de ${monthKey} removido.`, 'info');
        }
      }

      const updatePayload: any = {
        paymentStatus: newStatus
      };
      if (newStatus === 'Pago') {
        updatePayload.lastPaidMonth = monthKey;
      } else if (member.lastPaidMonth) {
        updatePayload.lastPaidMonth = member.lastPaidMonth;
      }

      const primaryCol = member.collectionName || (member.uid ? 'users' : 'members');
      const secondaryCol = primaryCol === 'users' ? 'members' : 'users';

      await setDoc(doc(db, primaryCol, memberId), updatePayload, { merge: true }).catch(() => {});
      if (member.uid && member.uid !== memberId) {
        await setDoc(doc(db, primaryCol, member.uid), updatePayload, { merge: true }).catch(() => {});
      }
      await setDoc(doc(db, secondaryCol, memberId), updatePayload, { merge: true }).catch(() => {});

      if (newStatus === 'Pago') {
        const quotas = Number(member.quotas) > 0 ? Number(member.quotas) : 1;
        const amount = quotas * (pixConfig.defaultAmount || 20.00);
        setThankYouModalData({
          member,
          confirmedMonth: monthKey,
          quotas,
          amount
        });
      }

    } catch (err) {
      console.error('Erro ao atualizar status do pagamento:', err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        addToast('Limite de cota atingido no banco.', 'error');
      } else {
        addToast('Erro ao atualizar status.', 'error');
      }
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handlePrevMonth = () => {
    if (filterMonth === 1) {
      setFilterMonth(12);
      setFilterYear(prev => prev - 1);
    } else {
      setFilterMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (filterMonth === 12) {
      setFilterMonth(1);
      setFilterYear(prev => prev + 1);
    } else {
      setFilterMonth(prev => prev + 1);
    }
  };

  const monthKey = `${String(filterMonth).padStart(2, '0')}/${filterYear}`;
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const days = ['02', '07', '12'];

  const [openChargeMenu, setOpenChargeMenu] = useState<string | null>(null);

  // Efeito para fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-charge-menu-trigger]') && !target.closest('[data-charge-menu-content]')) {
        setOpenChargeMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openChargeMenu]);

  const report = members
    .filter(member => {
      if (member.rejected === true || member.status === 'recusado') return false;

      const memberPhoneClean = member.phone ? normalizeBrazilianPhoneDigits(member.phone) : '';
      const allMemberPayments = payments.filter(p =>
        p.userId === member.id ||
        p.userId === member.uid ||
        (memberPhoneClean && p.phone && normalizeBrazilianPhoneDigits(p.phone) === memberPhoneClean)
      );
      const filteredPayments = showAllTime 
        ? allMemberPayments 
        : allMemberPayments.filter(p => p.month === monthKey);

      // Aplica filtro de pendentes se ativado (apenas participantes sem pagamento no período)
      if (showPendingOnly && filteredPayments.length > 0) return false;

      // Se possui pagamento registrado para este mês ou no histórico total, sempre exibe!
      if (filteredPayments.length > 0) return true;

      if (showAllTime) {
        return isMemberActiveInMonth(member, monthKey) || allMemberPayments.length > 0;
      }

      // No mês selecionado, verifica se o participante estava ativo naquela época
      return isMemberActiveInMonth(member, monthKey);
    })
    .map(member => {
      const allMemberPayments = payments.filter(p => 
        p.userId === member.id || 
        p.userId === member.uid ||
        (member.phone && p.phone && normalizeBrazilianPhoneDigits(p.phone) === normalizeBrazilianPhoneDigits(member.phone))
      );
      
      // Filtra aportes e total baseado no modo de visualização
      const filteredPayments = showAllTime 
        ? allMemberPayments 
        : allMemberPayments.filter(p => p.month === monthKey);

      const totalInvested = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      // Pagamento específico do mês selecionado
      const monthPayment = filteredPayments.find(p => p.month === monthKey) || (showAllTime ? null : filteredPayments[0]);

      // Último pagamento para exibição e auditoria
      const sortedAll = [...allMemberPayments].sort((a, b) => {
        const timeA = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
        const timeB = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
        return timeB - timeA;
      });
      const lastPayment = sortedAll[0];

      const quotas = Number(member.quotas) > 0 ? Number(member.quotas) : 1;
      const isPaid = showAllTime 
        ? member.paymentStatus === 'Pago'
        : filteredPayments.length > 0;

      // Comprovante correspondente ao mês de referência atual
      const profileReceipt = Array.isArray(member.receipts)
        ? member.receipts.find((r: any) => r.referenceMonth === monthKey)
        : null;

      const receiptForMonth = monthPayment?.receiptURL || monthPayment?.receiptUrl || profileReceipt?.imageUrl || (showAllTime ? lastPayment?.receiptURL : null);

      return { 
        ...member, 
        quotas, 
        totalInvested, 
        lastPayment, 
        monthPayment,
        receiptForMonth,
        paymentsCount: filteredPayments.length,
        isPaidInSelectedMonth: isPaid
      };
    })
    .sort((a, b) => {
      const nameA = (a.displayName || a.name || a.email || '').trim();
      const nameB = (b.displayName || b.name || b.email || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    });

  return (
    <div className="p-1 sm:p-2 bg-white w-full">
      <PaymentThankYouWhatsAppModal
        data={thankYouModalData}
        payments={payments}
        onClose={() => setThankYouModalData(null)}
      />

      {/* Modal Chave PIX & QR Code */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="max-w-md w-full my-4">
            <PixPaymentArea
              onClose={() => setShowPixModal(false)}
              title="Chave PIX e QR Code do Bolão"
            />
          </div>
        </div>
      )}

      {/* Modal de Detalhes & Rastreabilidade do Pagamento */}
      {selectedPaymentForModal && (
        <PaymentDetailsModal
          payment={selectedPaymentForModal}
          onClose={() => setSelectedPaymentForModal(null)}
        />
      )}

      {/* Modal de Comprovante PIX/Transferência */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 text-sm">Comprovante de Pagamento</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-800 font-bold p-1 text-sm cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-2">
              <img
                src={selectedReceipt}
                alt="Comprovante"
                className="max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 bg-gray-50 p-2 rounded-xl border border-gray-150">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-tight">Extrato Financeiro</h3>
          <div className="h-3.5 w-px bg-gray-300 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAllTime(!showAllTime)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all border cursor-pointer ${
                showAllTime 
                  ? 'bg-purple-600 text-white border-purple-500' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {showAllTime ? '♾️ Tudo' : '📅 Mensal'}
            </button>
            <button
              onClick={() => setShowPendingOnly(!showPendingOnly)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all border cursor-pointer ${
                showPendingOnly 
                  ? 'bg-amber-600 text-white border-amber-500' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {showPendingOnly ? '⏳ Pendentes' : '👤 Todos'}
            </button>
          </div>
        </div>

        {!showAllTime && (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition shadow-2xs cursor-pointer text-xs"
            >
              ◀
            </button>
            <div className="bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-2xs min-w-[120px] text-center">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wide">
                {monthNames[filterMonth - 1]} / {filterYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition shadow-2xs cursor-pointer text-xs"
            >
              ▶
            </button>
          </div>
        )}

        <button
          onClick={() => setShowPixModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>📲</span> Chave PIX
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs relative w-full">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
              <th className="py-2 px-1 text-left sticky left-0 bg-gray-100 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.08)] border-r border-b border-gray-200 min-w-[100px] sm:min-w-[115px] max-w-[125px] whitespace-nowrap text-gray-800">
                Nome
              </th>
              <th className="p-3 text-center min-w-[80px] whitespace-nowrap border-b border-gray-200">Cotas</th>
              <th className="p-3 text-center min-w-[80px] whitespace-nowrap border-b border-gray-200">Aportes</th>
              <th className="p-3 text-center min-w-[120px] whitespace-nowrap border-b border-gray-200">Total Investido</th>
              <th className="p-3 text-center min-w-[100px] whitespace-nowrap border-b border-gray-200">Último Mês</th>
              <th className="p-3 text-center min-w-[110px] whitespace-nowrap border-b border-gray-200">Comprovante</th>
              <th className="p-3 text-center min-w-[140px] whitespace-nowrap border-b border-gray-200">Status / Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {report.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 text-xs">
                  Nenhum participante encontrado.
                </td>
              </tr>
            ) : (
              report.map((m, idx) => {
                const isPaid = m.isPaidInSelectedMonth;
                const pendingMonths = calculatePendingMonths(m);
                const currentMonthKey = `${String(filterMonth).padStart(2, '0')}/${filterYear}`;
                const memberName = m.displayName || m.name || m.email || 'Participante';
                const whatsappUrl = getWhatsAppCobrarUrl(m.phone, memberName, m.quotas, pixConfig.defaultAmount || 20.00, pixConfig.pixKey || '11953292570', pendingMonths);
                const isOdd = idx % 2 === 1;

                return (
                  <tr key={m.id} className={`${isOdd ? 'bg-slate-50' : 'bg-white'} hover:bg-slate-100/80 transition group`}>
                    <td className={`py-2.5 px-2 font-medium text-gray-800 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.08)] border-r border-b border-gray-150 min-w-[130px] sm:min-w-[145px] whitespace-nowrap ${isOdd ? 'bg-slate-50 group-hover:bg-slate-100' : 'bg-white group-hover:bg-slate-100'}`}>
                      <div className="font-black text-gray-900 text-xs sm:text-sm tracking-tight">{formatFirstAndLastName(m.displayName || m.name || m.email)}</div>
                      {m.phone && <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{m.phone}</span>}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-1 rounded-full border border-amber-200 inline-block">
                        {m.quotas} {m.quotas > 1 ? 'cotas' : 'cota'}
                      </span>
                    </td>
                    <td className="p-3 text-center text-gray-600 font-semibold whitespace-nowrap">
                      {m.paymentsCount}x
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700 whitespace-nowrap text-sm">
                      R$ {(m.totalInvested || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center text-gray-600 font-medium whitespace-nowrap">
                      {showAllTime 
                        ? (m.lastPayment?.month || '-') 
                        : (isPaid ? monthKey : (m.lastPayment?.month || '-'))}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        {m.receiptForMonth && (
                          <button
                            onClick={() => setSelectedReceipt(m.receiptForMonth)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer flex items-center gap-1"
                            title={`Visualizar comprovante referente a ${showAllTime ? (m.lastPayment?.month || '') : monthKey}`}
                          >
                            <span>🖼️</span> Ver PIX
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const paymentObj = m.monthPayment || m.lastPayment || {
                              id: `payment_${m.id}_${monthKey}`,
                              memberName: m.displayName || m.name || m.email,
                              userId: m.id || m.uid,
                              phone: m.phone,
                              amount: (Number(m.quotas) > 0 ? Number(m.quotas) : 1) * (pixConfig.defaultAmount || 20.00),
                              month: monthKey,
                              status: isPaid ? 'Pago' : 'Pendente',
                              createdAt: m.createdAt,
                              history: m.payment_history || m.history || []
                            };
                            setSelectedPaymentForModal(paymentObj);
                          }}
                          className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                          title="Ver histórico de alterações de status e rastreabilidade"
                        >
                          <span>🔍</span> Detalhes
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-2">
                        {can('members_toggle_payment') ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex gap-1">
                              {days.map(d => {
                                const chargeHistory = m.charge_history?.[currentMonthKey] || {};
                                const isSent = chargeHistory[`d${d}`] === true;
                                const colorClass = (isPaid || isSent) ? 'bg-emerald-500' : 'bg-blue-500';
                                return (
                                  <div 
                                    key={d} 
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-black shadow-xs ${colorClass}`}
                                    title={isPaid ? 'Pago' : isSent ? `Enviado dia ${d}` : `Pendente dia ${d}`}
                                  >
                                    {d}
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              onClick={() => togglePaymentStatus(m, currentMonthKey)}
                              disabled={isUpdatingStatus === m.id}
                              title={`Clique para marcar ${currentMonthKey} como ${isPaid ? 'Pendente' : 'Pago'}`}
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition shadow-2xs ${
                                isPaid
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            >
                              {isPaid ? '✓ Pago' : 'Pendente'}
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {isPaid ? '✓ Pago' : 'Pendente'}
                          </span>
                        )}

                        {!isPaid && can('members_send_reminder') && (
                          <div className="relative">
                            <button
                              data-charge-menu-trigger
                              onClick={() => setOpenChargeMenu(openChargeMenu === m.id ? null : m.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Opções de cobrança"
                            >
                              💬 Cobrar ▼
                            </button>
                            {openChargeMenu === m.id && (
                              <div data-charge-menu-content className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                <div className="p-2 bg-gray-50 text-[10px] font-black text-gray-500 uppercase text-center border-b">Escolha o dia:</div>
                                {days.map(day => (
                                  <button
                                    key={day}
                                    onClick={async () => {
                                      setOpenChargeMenu(null);
                                      window.open(whatsappUrl, '_blank');
                                      try {
                                        const colName = m.collectionName || 'users';
                                        await updateDoc(doc(db, colName, m.id), {
                                          [`charge_history.${currentMonthKey}.d${day}`]: true
                                        });
                                        addToast(`Cobrança do dia ${day} registrada para ${formatFirstAndLastName(m.displayName || m.email)}!`, 'success');
                                      } catch (err) {
                                        console.error('Erro ao registrar cobrança:', err);
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center gap-2 cursor-pointer"
                                  >
                                    <span>📅</span> Dia {day}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
