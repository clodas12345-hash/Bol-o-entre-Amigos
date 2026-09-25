import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs, doc, updateDoc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { formatFirstAndLastName, getWhatsAppCobrarUrl } from '../lib/formatters';
import { useToast } from './NotificationManager';
import PixPaymentArea from './PixPaymentArea';
import { PixConfig, DEFAULT_PIX_CONFIG } from '../lib/pix';
import { usePool } from '../lib/PoolContext';

export default function DetailedFinancialReport() {
  const { setIsQuotaExceeded } = usePool();
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
          if (cMem) setMembers(JSON.parse(cMem));
        } catch {}
      }
    };

    loadAllData();
    // Removendo onSnapshots de coleções para economizar cota.
  }, []);

  const togglePaymentStatus = async (member: any) => {
    const newStatus = member.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';
    setIsUpdatingStatus(member.id);
    try {
      const colName = member.collectionName || 'users';
      await updateDoc(doc(db, colName, member.id), {
        paymentStatus: newStatus
      });
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

  const report = members.map(member => {
    const memberPayments = payments.filter(p => p.userId === member.id || p.userId === member.uid);
    const totalInvested = memberPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const lastPayment = memberPayments.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    })[0];

    const quotas = Number(member.quotas) > 0 ? Number(member.quotas) : 1;
    return { ...member, quotas, totalInvested, lastPayment, paymentsCount: memberPayments.length };
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
          <h3 className="font-bold text-gray-800 text-sm">Extrato e Prestação de Contas Individual</h3>
          <p className="text-xs text-gray-500">Histórico de arrecadação por participante e status de cotas</p>
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
              report.map(m => {
                const isPaid = m.paymentStatus === 'Pago';
                const whatsappUrl = getWhatsAppCobrarUrl(m.phone, m.displayName || m.email, m.quotas, pixConfig.defaultAmount || 20.00, pixConfig.pixKey || '11953292570');

                return (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition">
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => togglePaymentStatus(m)}
                          disabled={isUpdatingStatus === m.id}
                          title="Clique para alternar entre Pago e Pendente"
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition shadow-2xs ${
                            isPaid
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {isPaid ? '✓ Pago' : 'Pendente'}
                        </button>

                        {!isPaid && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1"
                            title="Enviar cobrança via WhatsApp com chave PIX e valor das cotas"
                          >
                            💬 Cobrar
                          </a>
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
