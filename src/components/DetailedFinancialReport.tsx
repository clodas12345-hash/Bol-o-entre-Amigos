import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs, doc, updateDoc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { formatFirstAndLastName, getWhatsAppCobrarUrl, calculatePendingMonths } from '../lib/formatters';
import { useToast } from './NotificationManager';
import PixPaymentArea from './PixPaymentArea';
import { PixConfig, DEFAULT_PIX_CONFIG } from '../lib/pix';
import { usePool } from '../lib/PoolContext';
import { usePermissions } from '../lib/PermissionsContext';

export default function DetailedFinancialReport() {
  const { setIsQuotaExceeded, activePool } = usePool();
  const { can } = usePermissions();
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixConfig, setPixConfig] = useState<PixConfig>(DEFAULT_PIX_CONFIG);

  const { addToast } = useToast();

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [paySnap, pixSnap, usersSnap, membersSnap] = await Promise.all([
          getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(500))),
          getDoc(doc(db, 'settings', 'pix')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);

        // Processa Pagamentos
        const payList = paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(payList);
        try { localStorage.setItem('bolao_cache_payments', JSON.stringify(payList)); } catch {}

        // Processa Pix Config
        if (pixSnap.exists()) {
          const pData = pixSnap.data() as PixConfig;
          setPixConfig(pData);
          try { localStorage.setItem('bolao_cache_pix_config', JSON.stringify(pData)); } catch {}
        }

        // Processa Membros
        const usersList: any[] = usersSnap.docs.map(doc => ({ id: doc.id, collectionName: 'users', quotas: 1, ...doc.data() }));
        const membersList: any[] = membersSnap.docs.map(doc => ({ id: doc.id, collectionName: 'members', quotas: 1, ...doc.data() }));
        const combined: any[] = [...usersList];
        for (const m of membersList) {
          if (!combined.some(u => u.id === m.id || (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase()))) {
            combined.push(m);
          }
        }
        // Ordena participantes e contatos em ordem crescente (A-Z)
        combined.sort((a, b) => {
          const nameA = (a.displayName || a.name || a.email || '').trim();
          const nameB = (b.displayName || b.name || b.email || '').trim();
          return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
        });
        setMembers(combined);
        try { localStorage.setItem('bolao_cache_members', JSON.stringify(combined)); } catch {}

      } catch (err) {
        console.warn('DetailedFinancialReport load error:', err);
        if (isQuotaError(err)) setIsQuotaExceeded(true);
        // Tenta carregar do cache
        try {
          const cPay = localStorage.getItem('bolao_cache_payments');
          if (cPay) setPayments(JSON.parse(cPay));
          const cPix = localStorage.getItem('bolao_cache_pix_config');
          if (cPix) setPixConfig(JSON.parse(cPix));
          const cMem = localStorage.getItem('bolao_cache_members');
          if (cMem) {
            const parsedMem = JSON.parse(cMem);
            parsedMem.sort((a: any, b: any) => {
              const nameA = (a.displayName || a.name || a.email || '').trim();
              const nameB = (b.displayName || b.name || b.email || '').trim();
              return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
            });
            setMembers(parsedMem);
          }
        } catch {}
      }
    };

    loadAllData();
    // Removendo onSnapshots de coleções para economizar cota.
  }, [activePool]);

  const togglePaymentStatus = async (member: any) => {
    const newStatus = member.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';
    setIsUpdatingStatus(member.id);
    try {
      const colName = member.collectionName || 'users';
      await updateDoc(doc(db, colName, member.id), {
        paymentStatus: newStatus
      });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, paymentStatus: newStatus } : m));
      addToast(`Status de ${formatFirstAndLastName(member.displayName || member.email)} alterado para ${newStatus}!`, 'info');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
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

  const [openChargeMenu, setOpenChargeMenu] = useState<string | null>(null);

  const report = members
    .map(member => {
      const memberPayments = payments.filter(p => p.userId === member.id || p.userId === member.uid);
      const totalInvested = memberPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const lastPayment = memberPayments.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      })[0];

      const quotas = Number(member.quotas) > 0 ? Number(member.quotas) : 1;
      return { ...member, quotas, totalInvested, lastPayment, paymentsCount: memberPayments.length };
    })
    .sort((a, b) => {
      const nameA = (a.displayName || a.name || a.email || '').trim();
      const nameB = (b.displayName || b.name || b.email || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    });

  return (
    <div className="p-4 sm:p-5 bg-white">
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

      {/* Modal de Comprovante PIX/Transferência */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 text-sm">Comprovante de Pagamento</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-800 font-bold p-1 text-sm"
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

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Extrato por Participante</h3>
        </div>

        {/* Botão de Atalho para Chave PIX */}
        <button
          onClick={() => setShowPixModal(true)}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>📲</span> Chave PIX (11 95329-2570)
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700 font-semibold border-b">
              <th className="p-2.5 text-left">Participante</th>
              <th className="p-2.5 text-center">Cotas</th>
              <th className="p-2.5 text-center">Aportes</th>
              <th className="p-2.5 text-center">Total Investido</th>
              <th className="p-2.5 text-center">Último Mês</th>
              <th className="p-2.5 text-center">Comprovante</th>
              <th className="p-2.5 text-center">Status / Ação</th>
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
                const isPaid = m.paymentStatus === 'Pago';
                const pendingMonths = calculatePendingMonths(m);
                const whatsappUrl = getWhatsAppCobrarUrl(m.phone, m.displayName || m.email, m.quotas, pixConfig.defaultAmount || 20.00, pixConfig.pixKey || '11953292570', pendingMonths);

                return (
                  <tr key={m.id} className={`${idx % 2 === 1 ? 'bg-slate-100' : 'bg-white'} hover:bg-slate-200/60 transition`}>
                    <td className="p-2.5 font-medium text-gray-800">
                      <div className="font-bold">{formatFirstAndLastName(m.displayName || m.email)}</div>
                      {m.phone && <span className="text-[10px] text-gray-400">{m.phone}</span>}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="bg-amber-100 text-amber-900 font-black text-xs px-2 py-0.5 rounded-full border border-amber-200">
                        {m.quotas} {m.quotas > 1 ? 'cotas' : 'cota'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-gray-600 font-semibold">
                      {m.paymentsCount}x
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">
                      R$ {(m.totalInvested || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-center text-gray-500">
                      {m.lastPayment?.month || '-'}
                    </td>
                    <td className="p-2.5 text-center">
                      {m.lastPayment?.receiptURL ? (
                        <button
                          onClick={() => setSelectedReceipt(m.lastPayment.receiptURL)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                        >
                          Ver PIX
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {can('members_toggle_payment') ? (
                          (() => {
                            const chargeHistory = m.charge_history?.[new Date().toISOString().slice(0, 7)] || {};
                            const days = ['02', '07', '12'];
                            
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-1">
                                  {days.map(d => {
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
                                  onClick={() => togglePaymentStatus(m)}
                                  disabled={isUpdatingStatus === m.id}
                                  title="Clique para alternar entre Pago e Pendente"
                                  className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition shadow-2xs ${
                                    isPaid
                                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                  }`}
                                >
                                  {isPaid ? '✓ Pago' : 'Pendente'}
                                </button>
                              </div>
                            );
                          })()
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
                              onClick={() => setOpenChargeMenu(openChargeMenu === m.id ? null : m.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Opções de cobrança"
                            >
                              💬 Cobrar ▼
                            </button>
                            {openChargeMenu === m.id && (
                              <div className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                <div className="p-2 bg-gray-50 text-[10px] font-black text-gray-500 uppercase text-center border-b">Escolha o dia:</div>
                                {['02', '07', '12'].map(day => (
                                  <button
                                    key={day}
                                    onClick={async () => {
                                      window.open(whatsappUrl, '_blank');
                                      try {
                                        const monthKey = new Date().toISOString().slice(0, 7);
                                        const colName = m.collectionName || 'users';
                                        const existingHistory = m.charge_history || {};
                                        const monthHistory = existingHistory[monthKey] || {};
                                        
                                        await updateDoc(doc(db, colName, m.id), {
                                          [`charge_history.${monthKey}.d${day}`]: true
                                        });
                                        
                                        setMembers(prev => prev.map(member => {
                                          if (member.id === m.id) {
                                            return {
                                              ...member,
                                              charge_history: {
                                                ...existingHistory,
                                                [monthKey]: { ...monthHistory, [`d${day}`]: true }
                                              }
                                            };
                                          }
                                          return member;
                                        }));
                                        addToast(`Cobrança do dia ${day} registrada para ${formatFirstAndLastName(m.displayName || m.email)}!`, 'success');
                                        setOpenChargeMenu(null);
                                      } catch (err) {
                                        console.error('Erro ao registrar cobrança:', err);
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center gap-2"
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
