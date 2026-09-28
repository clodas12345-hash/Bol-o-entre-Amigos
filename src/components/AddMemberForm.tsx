import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { normalizeBrazilianPhoneDigits } from '../lib/formatters';
import { Contacts } from '@capacitor-community/contacts';
import { UserPlus, UserSearch } from 'lucide-react';

export default function AddMemberForm({ onMemberAdded }: { onMemberAdded: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handlePickContact = async () => {
    try {
      const win = window as any;
      const isNative = !!(win.Capacitor && win.Capacitor.isNativePlatform());

      console.log('[ContactPicker] isNative:', isNative, 'Window:', !!win.Capacitor);

      if (!isNative) {
        addToast('A busca na agenda só está disponível no aplicativo instalado.', 'info');
        return;
      }

      // Explicitly check if the plugin is available
      if (!Contacts) {
        addToast('Recurso de agenda não disponível.', 'error');
        return;
      }

      const permissions = await Contacts.requestPermissions();
      if (permissions.contacts !== 'granted') {
        addToast('Permissão de acesso à agenda negada.', 'error');
        return;
      }
      
      const result: any = await Contacts.pickContact({ projection: { name: true, phones: true } });
      const contact = result.contact;
      if (contact) {
        if (contact.name?.display) setDisplayName(contact.name.display);
        if (contact.phones && contact.phones.length > 0) {
          // Takes the first phone number found
          setPhone(contact.phones[0].number || '');
        }
      }
    } catch (error: any) {
      console.error('Error picking contact:', error);
      // Handle the specific error if it's "Not implemented on web"
      if (error.message && error.message.includes('Not implemented')) {
        addToast('A busca na agenda só está disponível no aplicativo instalado.', 'info');
      } else {
        addToast('Não foi possível acessar a agenda.', 'error');
      }
    }
  };

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
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm text-gray-700">Cadastrar Novo Membro</h3>
        <button 
          type="button"
          onClick={handlePickContact}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <UserSearch size={14} /> Buscar na Agenda
        </button>
      </div>
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-2 rounded text-sm w-full disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Salvando...' : <><UserPlus size={16} /> Adicionar</>}
        </button>
      </div>
    </form>
  );
}
