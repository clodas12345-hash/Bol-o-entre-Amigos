import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { normalizeBrazilianPhoneDigits } from '../lib/formatters';

export default function AddMemberForm({ onMemberAdded }: { onMemberAdded: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSubmitting(true);
    try {
      const normalizedPhone = phone.trim() ? normalizeBrazilianPhoneDigits(phone) : '';
      await addDoc(collection(db, 'users'), {
        displayName: displayName.trim(),
        phone: normalizedPhone,
        createdAt: new Date(),
        paymentStatus: 'Pendente',
        approved: true,
        role: 'participant'
      });
      setDisplayName('');
      setPhone('');
      onMemberAdded();
      addToast('Membro adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Error adding member: ', error);
      addToast('Erro ao adicionar membro.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t mt-4">
      <h3 className="font-bold text-sm text-gray-700 mb-2">Cadastrar Novo Membro no Bolão</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Nome completo"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="border p-2 rounded text-sm w-full"
          required
        />
        <div className="flex">
          <span className="inline-flex items-center px-2.5 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-xs font-semibold text-gray-700 select-none">
            🇧🇷 +55
          </span>
          <input
            type="tel"
            placeholder="DDD + Telefone (ex: 11 99999-8888)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-gray-300 bg-white p-2 rounded-r text-sm w-full"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-2 rounded text-sm w-full disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : '+ Adicionar Membro'}
        </button>
      </div>
    </form>
  );
}
