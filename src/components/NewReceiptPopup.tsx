import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../lib/PermissionsContext';

export default function NewReceiptPopup() {
  const { isAdmin, isCounselor } = usePermissions();
  const [newReceipt, setNewReceipt] = useState<any | null>(null);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const isMod = isAdmin || isCounselor;

  useEffect(() => {
    if (!isMod) return;

    // Monitora novos comprovantes pendentes em tempo real
    const q = query(
      collection(db, 'pending_receipts'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    let initialLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (initialLoad) {
        initialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const receiptId = change.doc.id;
          
          // Verifica se já não vimos este comprovante nesta sessão
          const seenKey = `bolao_seen_receipt_popup_${receiptId}`;
          if (!sessionStorage.getItem(seenKey)) {
            sessionStorage.setItem(seenKey, '1');
            setNewReceipt({ id: receiptId, ...data });
            setShow(true);
            
            // Toca um som suave de notificação se possível
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.4;
              audio.play().catch(() => {});
            } catch {}
          }
        }
      });
    }, (err) => {
      console.warn('NewReceiptPopup error:', err);
    });

    return () => unsubscribe();
  }, [isMod]);

  if (!show || !newReceipt) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
            💸
          </div>
          <h2 className="text-xl font-black uppercase tracking-wide">Novo Comprovante!</h2>
          <p className="text-xs text-emerald-100 font-semibold mt-1">Um participante acaba de enviar um PIX</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Participante:</p>
            <p className="text-sm font-bold text-gray-800">{newReceipt.name}</p>
            <p className="text-xs font-mono text-emerald-700 mt-1">{newReceipt.phone}</p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShow(false);
                navigate('/contatos?tab=receipts');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>✅</span>
              <span>Validar Agora</span>
            </button>
            <button
              onClick={() => setShow(false)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Depois</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
