import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

  const handleApprove = async (receipt: any) => {
    try {
      const normalizedReceiptPhone = normalizeBrazilianPhoneDigits(receipt.phone);
      console.log('Receipt Phone:', receipt.phone, 'Normalized Receipt:', normalizedReceiptPhone);
      
      const member = members.find(m => {
        const normalizedMemberPhone = normalizeBrazilianPhoneDigits(m.phone || '');
        console.log('Checking Member:', m.displayName, 'Phone:', m.phone, 'Normalized:', normalizedMemberPhone);
        return normalizedMemberPhone === normalizedReceiptPhone;
      });

      if (member) {
        // Salva comprovante no membro e marca como pago
        await updateDoc(doc(db, 'members', member.id), {
          receipts: arrayUnion({
            imageUrl: receipt.imageBase64, // Nota: no futuro, salvar no Storage e usar URL
            date: receipt.createdAt,
            note: 'Aprovado via Comprovante Público'
          }),
          paymentStatus: 'Pago'
        });
        addToast(`Comprovante de "${member.displayName}" aprovado e registrado!`, 'success');
      } else {
        addToast('Membro não encontrado para este telefone. Comprovante aprovado mas não vinculado.', 'info');
      }

      await deleteDoc(doc(db, 'pending_receipts', receipt.id));
    } catch (e) {
      console.error(e);
      addToast('Erro ao processar comprovante.', 'error');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {receipts.map(r => (
        <div key={r.id} className="bg-white p-4 rounded-xl shadow border flex items-center justify-between">
          <div>
            <p className="font-bold">{r.name}</p>
            <p className="text-xs text-gray-500">{r.phone}</p>
          </div>
          <img src={r.imageBase64} alt="Comprovante" className="w-16 h-16 object-cover rounded" />
          <button onClick={() => handleApprove(r)} className="bg-green-600 text-white px-3 py-1 rounded">Aprovar</button>
        </div>
      ))}
    </div>
  );
}
