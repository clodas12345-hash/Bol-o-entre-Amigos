import { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName, normalizeBrazilianPhoneDigits } from '../lib/formatters';
import { useData } from '../lib/DataContext';
import PaymentThankYouWhatsAppModal, { PaymentThankYouPayload } from './PaymentThankYouWhatsAppModal';

export interface AuditHistoryEntry {
  id?: string;
  timestamp: string;
  updatedBy: string;
  userRole: 'admin' | 'membro' | 'sistema';
  previousStatus: string;
  newStatus: string;
  note?: string;
}

export interface PaymentDetailsModalProps {
  payment: {
    id: string;
    collectionName?: 'payments' | 'pending_receipts' | 'approved_receipts' | string;
    memberName?: string;
    name?: string;
    phone?: string;
    userId?: string;
    memberId?: string;
    amount?: number;
    value?: number;
    month?: string;
    status?: string;
    paymentStatus?: string;
    receiptUrl?: string;
    receiptURL?: string;
    imageBase64?: string;
    createdAt?: any;
    validatedDate?: string;
    validatedAt?: any;
    homologatedBy?: string;
    approvedBy?: string;
    history?: AuditHistoryEntry[];
    auditTrail?: AuditHistoryEntry[];
  };
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export default function PaymentDetailsModal({
  payment,
  onClose,
  onStatusUpdated
}: PaymentDetailsModalProps) {
  const { addToast } = useToast();
  const { payments, members } = useData();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatusInput, setNewStatusInput] = useState<string>(
    payment.status || payment.paymentStatus || 'Pendente'
  );
  const [adminNote, setAdminNote] = useState('');
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);
  const [thankYouModalData, setThankYouModalData] = useState<PaymentThankYouPayload | null>(null);

  const currentStatus = payment.status || payment.paymentStatus || 'Pendente';
  const displayName = payment.memberName || payment.name || 'Participante';
  const receiptImg = payment.receiptUrl || payment.receiptURL || payment.imageBase64 || '';
  const collectionTarget = payment.collectionName || 'payments';

  // Consolida o histórico vindo do documento ou de metadados legados
  const historyList: AuditHistoryEntry[] = (() => {
    const rawList = payment.history || payment.auditTrail || [];
    if (rawList.length > 0) {
      return [...rawList].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Se ainda não houver array de histórico explícito, constrói entradas legadas sintéticas para rastreabilidade
    const synthetic: AuditHistoryEntry[] = [];
    if (payment.createdAt) {
      let createdTimeStr = new Date().toLocaleString('pt-BR');
      try {
        if (payment.createdAt?.toDate) {
          createdTimeStr = payment.createdAt.toDate().toLocaleString('pt-BR');
        } else if (typeof payment.createdAt === 'string') {
          createdTimeStr = new Date(payment.createdAt).toLocaleString('pt-BR');
        }
      } catch {}

      synthetic.push({
        timestamp: createdTimeStr,
        updatedBy: payment.name || payment.memberName || 'Membro',
        userRole: 'membro',
        previousStatus: 'Criado',
        newStatus: 'Aguardando Validação',
        note: 'Pagamento/Comprovante cadastrado pelo participante'
      });
    }

    if (payment.validatedDate || payment.homologatedBy || payment.approvedBy) {
      synthetic.push({
        timestamp: payment.validatedDate || new Date().toLocaleString('pt-BR'),
        updatedBy: payment.homologatedBy || payment.approvedBy || 'Admin',
        userRole: 'admin',
        previousStatus: 'Aguardando Validação',
        newStatus: payment.status || 'validado',
        note: 'Pagamento homologado e validado pelo administrador'
      });
    }

    return synthetic.reverse();
  })();

  const formatTimestamp = (ts: string) => {
    if (!ts) return 'Data não registrada';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatusInput || newStatusInput === currentStatus) {
      addToast('Selecione um status diferente para atualizar', 'warning');
      return;
    }

    setIsUpdating(true);
    try {
      const currentUserEmail = auth.currentUser?.email || auth.currentUser?.displayName || 'Admin';
      const nowIso = new Date().toISOString();
      const todayStr = `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

      const newAuditEntry: AuditHistoryEntry = {
        timestamp: nowIso,
        updatedBy: currentUserEmail,
        userRole: 'admin',
        previousStatus: currentStatus,
        newStatus: newStatusInput,
        note: adminNote.trim() || `Status alterado de "${currentStatus}" para "${newStatusInput}" via tela de detalhes`
      };

      const nowDate = new Date();
      const currentMonthStr = `${String(nowDate.getMonth() + 1).padStart(2, '0')}/${nowDate.getFullYear()}`;
      const isConfirmedPaid = (newStatusInput === 'validado' || newStatusInput === 'Pago' || newStatusInput === 'approved');
      const isSyntheticPayment = !payment.id || payment.id.startsWith('payment_');

      // 1. Atualiza o documento principal do pagamento (ou cria se for registro sintético sem doc no banco)
      if (!isSyntheticPayment) {
        await updateDoc(doc(db, collectionTarget, payment.id), {
          status: newStatusInput,
          paymentStatus: newStatusInput,
          validatedDate: todayStr,
          validatedAt: serverTimestamp(),
          homologatedBy: currentUserEmail,
          history: arrayUnion(newAuditEntry)
        });
      } else if (isConfirmedPaid) {
        await addDoc(collection(db, 'payments'), {
          userId: payment.userId || payment.memberId || '',
          memberName: displayName,
          phone: payment.phone || '',
          amount: Number(payment.amount || payment.value || 20),
          month: payment.month || currentMonthStr,
          status: newStatusInput,
          validatedDate: todayStr,
          createdAt: serverTimestamp(),
          homologatedBy: currentUserEmail,
          history: [newAuditEntry]
        });
      }

      // 2. Se houver membro associado, atualiza também o status do membro
      const memberDocId = payment.memberId || payment.userId;
      if (memberDocId) {
        const memberStatus = isConfirmedPaid ? 'Pago' : 'Pendente';

        await updateDoc(doc(db, 'members', memberDocId), {
          paymentStatus: memberStatus,
          lastPaymentDate: todayStr,
          ...(isConfirmedPaid ? { lastPaidMonth: payment.month || currentMonthStr } : {})
        }).catch(() => {});

        await updateDoc(doc(db, 'users', memberDocId), {
          paymentStatus: memberStatus,
          lastPaymentDate: todayStr,
          ...(isConfirmedPaid ? { lastPaidMonth: payment.month || currentMonthStr } : {})
        }).catch(() => {});
      }

      addToast(`Status do pagamento alterado para "${newStatusInput}" com sucesso!`, 'success');
      setAdminNote('');

      if (isConfirmedPaid) {
        const cleanPhone = normalizeBrazilianPhoneDigits(payment.phone || '');
        const matchedMember = members.find(m =>
          (memberDocId && (m.id === memberDocId || m.uid === memberDocId)) ||
          (cleanPhone && normalizeBrazilianPhoneDigits(m.phone || '') === cleanPhone)
        );
        const resolvedMember = matchedMember || {
          id: memberDocId || payment.id,
          displayName,
          phone: payment.phone || '',
          quotas: 1
        };
        const quotas = Number(resolvedMember.quotas) > 0 ? Number(resolvedMember.quotas) : 1;
        setThankYouModalData({
          member: resolvedMember,
          confirmedMonth: payment.month || currentMonthStr,
          quotas,
          amount: Number(payment.amount || payment.value) || quotas * 20.0
        });
      } else {
        onStatusUpdated?.();
        onClose();
      }
    } catch (err) {
      console.error('Erro ao atualizar histórico de status:', err);
      addToast('Erro ao atualizar status do pagamento.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeColor = (st: string) => {
    const clean = (st || '').toLowerCase();
    if (clean === 'pago' || clean === 'validado' || clean === 'approved' || clean === 'homologado') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (clean === 'pendente' || clean === 'aguardando_validacao' || clean === 'pending') {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    if (clean === 'rejeitado' || clean === 'cancelled' || clean === 'cancelado') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <PaymentThankYouWhatsAppModal
        data={thankYouModalData}
        payments={payments}
        onClose={() => {
          setThankYouModalData(null);
          onStatusUpdated?.();
          onClose();
        }}
      />
      {/* Modal principal de Detalhes */}
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 my-4 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center text-xl shrink-0">
              🔍
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                Detalhes & Histórico de Rastreabilidade
              </h3>
              <p className="text-[11px] text-indigo-200">
                Transação #{payment.id?.slice(0, 8) || 'N/A'} • {payment.month || 'Mês vigente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white font-black text-lg p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Card de Resumo do Pagamento */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Participante</span>
              <p className="font-black text-slate-900 text-sm mt-0.5">{formatFirstAndLastName(displayName)}</p>
              {payment.phone && <p className="text-xs font-mono text-indigo-700 font-bold">{payment.phone}</p>}
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Valor & Mês</span>
              <p className="font-black text-emerald-700 text-base mt-0.5">
                R$ {(Number(payment.amount || payment.value || 20)).toFixed(2)}
                <span className="text-xs text-slate-600 font-normal ml-2">({payment.month || 'Mês vigente'})</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Status Atual</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${getStatusBadgeColor(currentStatus)}`}>
                  {currentStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Comprovante</span>
              {receiptImg ? (
                <button
                  type="button"
                  onClick={() => setShowEnlargedImage(true)}
                  className="mt-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖼️</span> Visualizar Comprovante PIX
                </button>
              ) : (
                <span className="text-xs text-slate-400 mt-1 block">Nenhum comprovante anexado</span>
              )}
            </div>
          </div>

          {/* Seção de Alteração de Status pelo Admin com Registro Auditável */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <h4 className="font-black text-indigo-950 text-xs sm:text-sm uppercase tracking-wide">
                Alterar Status com Rastreabilidade de Auditoria
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">Novo Status:</label>
                <select
                  value={newStatusInput}
                  onChange={(e) => setNewStatusInput(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-indigo-300 rounded-xl p-2.5 text-gray-800 focus:outline-indigo-500 shadow-2xs"
                >
                  <option value="validado">⚡ Validado (Pago)</option>
                  <option value="Pago">✓ Pago (Homologado)</option>
                  <option value="Pendente">⏳ Pendente (Aguardando)</option>
                  <option value="rejeitado">❌ Rejeitado / Invalido</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">Nota da Alteração (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: Confirmado via extrato bancário do dia"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full text-xs bg-white border border-indigo-300 rounded-xl p-2.5 text-gray-800 focus:outline-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isUpdating || newStatusInput === currentStatus}
              onClick={handleUpdateStatus}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isUpdating ? 'Registrando...' : '📝 Salvar Novo Status & Registrar no Histórico'}</span>
            </button>
          </div>

          {/* Histórico Completo de Ações (Audit Trail) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-black text-slate-800 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <span>📜</span> Histórico de Ações & Rastreabilidade ({historyList.length})
              </h4>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Auditoria 100% Protegida
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="bg-slate-50 border rounded-2xl p-5 text-center text-slate-400 text-xs font-medium">
                Nenhum evento registrado no histórico até o momento.
              </div>
            ) : (
              <div className="relative border-l-2 border-indigo-200 ml-3 pl-4 space-y-4 py-1">
                {historyList.map((entry, idx) => {
                  const isAdminRole = entry.userRole === 'admin' || (entry.updatedBy && entry.updatedBy.includes('@'));
                  return (
                    <div key={entry.id || idx} className="relative group">
                      {/* Ponto na linha do tempo */}
                      <span className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                        isAdminRole ? 'bg-indigo-600' : 'bg-emerald-500'
                      }`} />

                      <div className="bg-slate-50 hover:bg-slate-100 transition p-3 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isAdminRole 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isAdminRole ? '👑 ADMIN' : '👤 MEMBRO'}
                            </span>
                            <span className="font-bold text-slate-800">{entry.updatedBy || 'Usuário'}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            🕒 {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] pt-1">
                          <span className="font-bold text-slate-500">Status:</span>
                          <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">{entry.previousStatus || 'N/A'}</span>
                          <span className="text-indigo-600 font-black">➔</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-black">{entry.newStatus}</span>
                        </div>

                        {entry.note && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200/70 mt-1">
                            "{entry.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Rodapé da Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>

      </div>

      {/* Modal de Imagem Expandida */}
      {showEnlargedImage && receiptImg && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-2xl max-w-lg w-full flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-2 pb-2 border-b">
              <span className="font-bold text-gray-800 text-xs">Comprovante PIX de {displayName}</span>
              <button
                type="button"
                onClick={() => setShowEnlargedImage(false)}
                className="text-gray-500 hover:text-gray-900 font-bold text-sm cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="bg-gray-100 rounded-xl p-2 flex items-center justify-center">
              <img src={receiptImg} alt="Comprovante" className="max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
