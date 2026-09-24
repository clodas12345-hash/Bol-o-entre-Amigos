import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatFirstAndLastName } from '../lib/formatters';
import PixPaymentArea from './PixPaymentArea';

export default function PaymentModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'form' | 'pix'>('form');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  // Valor calculado conforme cotas (default 1 cota = R$ 20,00)
  const [amount, setAmount] = useState('20.00');
  
  // Mês atual como padrão (ex: 09/2026)
  const getCurrentMonth = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${m}/${d.getFullYear()}`;
  };
  const [month, setMonth] = useState(getCurrentMonth());
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const [usersSnap, membersSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members'))
        ]);

        const uList: any[] = usersSnap.docs.map(d => ({ id: d.id, collectionName: 'users', quotas: 1, ...d.data() }));
        const mList: any[] = membersSnap.docs.map(d => ({ id: d.id, collectionName: 'members', quotas: 1, ...d.data() }));

        const combined: any[] = [...uList];
        for (const m of mList) {
          const exists = combined.some(u =>
            u.id === m.id ||
            (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase()) ||
            (m.displayName && u.displayName && u.displayName.toLowerCase() === m.displayName.toLowerCase())
          );
          if (!exists) {
            combined.push(m);
          }
        }

        setUsers(combined);
      } catch (err) {
        console.error('Error fetching users for payment modal:', err);
      }
    };

    fetchAllUsers();
  }, []);

  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    const u = users.find(user => user.id === userId || user.uid === userId);
    if (u) {
      const q = Number(u.quotas) > 0 ? Number(u.quotas) : 1;
      setAmount((q * 20.00).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      addToast('Selecione o membro participante.', 'error');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast('Informe um valor de investimento válido.', 'error');
      return;
    }
    if (!month.trim()) {
      addToast('Informe o mês de referência.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let downloadURL = '';
      if (file) {
        const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        downloadURL = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'payments'), {
        userId: selectedUser,
        amount: parsedAmount,
        month: month.trim(),
        receiptURL: downloadURL || null,
        createdAt: serverTimestamp()
      });

      // Atualiza o status do participante para "Pago"
      const memberObj = users.find(u => u.id === selectedUser || u.uid === selectedUser);
      if (memberObj) {
        const col = memberObj.collectionName || 'users';
        await updateDoc(doc(db, col, memberObj.id), { paymentStatus: 'Pago' });
      }

      addToast(`Pagamento de R$ ${parsedAmount.toFixed(2)} registrado com sucesso!`, 'success');
      onClose();
    } catch (err) {
      console.error('Erro ao salvar pagamento:', err);
      addToast('Erro ao salvar pagamento. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUserObj = users.find(u => u.id === selectedUser || u.uid === selectedUser);
  const selectedUserQuotas = Number(selectedUserObj?.quotas) > 0 ? Number(selectedUserObj?.quotas) : 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 my-4 overflow-hidden animate-in fade-in duration-150">
        
        {/* Abas Superiores */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              📝 Registrar Aporte
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'pix'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              📱 Pagar via PIX ({selectedUserQuotas} cota{selectedUserQuotas > 1 ? 's' : ''})
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 font-bold p-1 text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Aba 1: Formulário de Lançamento */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Registrar Pagamento de Cota</h2>
              <p className="text-xs text-gray-500">Lançamento de depósito mensal ou aporte financeiro</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Participante *
              </label>
              <select
                value={selectedUser}
                onChange={(e) => handleSelectUser(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-blue-500 bg-white font-medium"
                required
              >
                <option value="">Selecione quem realizou o pagamento...</option>
                {users.map(u => {
                  const q = Number(u.quotas) > 0 ? Number(u.quotas) : 1;
                  return (
                    <option key={u.id} value={u.id}>
                      {formatFirstAndLastName(u.displayName || u.email)} ({q} cota{q > 1 ? 's' : ''} - R$ {(q * 20).toFixed(2)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm font-bold text-gray-800 focus:outline-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mês de Referência *
                </label>
                <input
                  type="text"
                  placeholder="MM/AAAA (ex: 09/2026)"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Comprovante PIX / Transferência (Opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Salvando Pagamento...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </form>
        )}

        {/* Aba 2: QR Code e Chave PIX */}
        {activeTab === 'pix' && (
          <div className="p-4 sm:p-5">
            <PixPaymentArea
              customAmount={parseFloat(amount) || (selectedUserQuotas * 20.00)}
              title={`PIX para ${selectedUserQuotas} Cota${selectedUserQuotas > 1 ? 's' : ''} (R$ ${amount})`}
              onClose={onClose}
            />
          </div>
        )}

      </div>
    </div>
  );
}
