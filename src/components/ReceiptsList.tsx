import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { normalizeBrazilianPhoneDigits } from '../lib/formatters';

export default function ReceiptsList() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const unsubReceipts = onSnapshot(collection(db, 'pending_receipts'), (snapshot) => {
      setReceipts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    // Fetch members to allow matching
    getDocs(collection(db, 'members')).then(snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
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

  const handleApprove = async (receipt: any) => {
    try {
      const normalizedReceiptPhone = normalizeBrazilianPhoneDigits(receipt.phone);
      
      const member = members.find(m => {
        const normalizedMemberPhone = normalizeBrazilianPhoneDigits(m.phone || '');
        return normalizedMemberPhone === normalizedReceiptPhone;
      });

      const approvalTimestamp = new Date();

      // 1. Salva no histórico homologado permanente (Auditoria / Homologação de Envio)
      await addDoc(collection(db, 'approved_receipts'), {
        name: receipt.name,
        phone: receipt.phone,
        imageBase64: receipt.imageBase64,
        submittedAt: receipt.createdAt || serverTimestamp(),
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.email || 'Administrador',
        matchedMemberName: member ? member.displayName : 'Não vinculado',
        status: 'homologated'
      });

      if (member) {
        // Salva comprovante no membro e marca como pago com dados de homologação
        await updateDoc(doc(db, 'members', member.id), {
          receipts: arrayUnion({
            imageUrl: receipt.imageBase64,
            date: receipt.createdAt || serverTimestamp(),
            approvedAt: approvalTimestamp,
            approvedBy: auth.currentUser?.email || 'Admin',
            note: 'Homologado e Aprovado via Comprovante do App'
          }),
          paymentStatus: 'Pago'
        });
        addToast(`Comprovante de "${member.displayName}" homologado e registrado!`, 'success');
      } else {
        addToast('Comprovante homologado com sucesso (Membro não vinculado automaticamente pelo telefone).', 'success');
      }

      await deleteDoc(doc(db, 'pending_receipts', receipt.id));
    } catch (e) {
      console.error(e);
      addToast('Erro ao homologar comprovante.', 'error');
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
      <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <span>🧾</span> Comprovantes Pendentes de Homologação
        </h3>
        <p className="text-[11px] text-blue-200 mt-1">
          Gerencie, verifique a data de envio e homologue os comprovantes de pagamento enviados pelos participantes.
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-xs font-bold shadow-xs border">
          Nenhum comprovante pendente no momento.
        </div>
      ) : (
        receipts.map(r => (
          <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <a href={r.imageBase64} target="_blank" rel="noopener noreferrer" title="Ampliar imagem">
                <img src={r.imageBase64} alt="Comprovante" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-200 hover:scale-105 transition cursor-pointer shadow-xs shrink-0" />
              </a>
              <div className="min-w-0">
                <p className="font-black text-sm text-gray-900 truncate">{r.name}</p>
                <p className="text-xs font-mono font-bold text-indigo-700">{r.phone}</p>
                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  <span>📅</span> Enviado em: <strong className="text-gray-700">{formatDate(r.createdAt)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={() => handleApprove(r)} 
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>✓</span> Homologar / Aprovar
              </button>
              <button 
                onClick={() => handleDelete(r.id)} 
                className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer border border-red-200"
                title="Excluir/Rejeitar comprovante"
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
