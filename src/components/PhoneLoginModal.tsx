import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizeBrazilianPhoneDigits } from '../lib/formatters';
import { useToast } from './NotificationManager';

interface PhoneLoginModalProps {
  onPhoneLoginSuccess: (memberData: any) => void;
  onClose?: () => void;
  isInline?: boolean;
}

export default function PhoneLoginModal({ onPhoneLoginSuccess, onClose, isInline = false }: PhoneLoginModalProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizeBrazilianPhoneDigits(phoneInput);
    if (!cleanPhone || cleanPhone.length < 10) {
      addToast('Digite um número de celular válido com DDD (ex: 11953292570).', 'error');
      return;
    }

    setLoading(true);
    try {
      let matchedMember: any = null;

      // 1. Verifica no admin fixo primeiro para login instantâneo sem depender de banco
      if (
        cleanPhone === '5511953292570' || cleanPhone.includes('11953292570') ||
        cleanPhone === '5511983302659' || cleanPhone.includes('11983302659')
      ) {
        matchedMember = {
          uid: 'admin_phone_clodas',
          email: 'clodas12345@gmail.com',
          displayName: 'Clodas (Admin)',
          role: 'admin',
          approved: true,
          phone: cleanPhone
        };
      }

      // 2. Busca nas coleções do Firestore caso não seja o admin principal
      if (!matchedMember) {
        const [usersSnap, membersSnap] = await Promise.all([
          getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'members')).catch(() => ({ docs: [] }))
        ]);

        if (usersSnap && usersSnap.docs) {
          usersSnap.docs.forEach(d => {
            const data = d.data();
            const p = normalizeBrazilianPhoneDigits(data.phone || '');
            if (p && p === cleanPhone) {
              matchedMember = { id: d.id, ...data };
            }
          });
        }

        if (!matchedMember && membersSnap && membersSnap.docs) {
          membersSnap.docs.forEach(d => {
            const data = d.data();
            const p = normalizeBrazilianPhoneDigits(data.phone || '');
            if (p && p === cleanPhone) {
              matchedMember = { id: d.id, ...data };
            }
          });
        }
      }

      if (!matchedMember) {
        addToast('Número de celular não encontrado na lista de participantes. Peça ao administrador para cadastrar seu número.', 'error');
        setLoading(false);
        return;
      }

      addToast(`Bem-vindo(a), ${matchedMember.displayName || matchedMember.email || 'Participante'}!`, 'success');
      onPhoneLoginSuccess(matchedMember);
    } catch (err) {
      console.error('Erro ao autenticar por telefone:', err);
      addToast('Erro ao validar número de celular.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isInline) {
    return (
      <div className="bg-white rounded-2xl p-2 space-y-4">
        <form onSubmit={handlePhoneLogin} className="space-y-4">
          <div className="text-left">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Número do WhatsApp / Celular (com DDD)</label>
            <input
              type="tel"
              placeholder="Ex: 11 95329-2570"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-semibold focus:outline-emerald-600 bg-gray-50"
              required
              autoFocus
            />
            <p className="text-[10px] text-gray-500 mt-1">O número deve estar cadastrado previamente pelo administrador.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verificando...' : 'Entrar no Bolão'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Acesso por Celular</h3>
              <p className="text-[11px] text-gray-500">Entre sem precisar de senha ou Google</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-lg p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handlePhoneLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Número do WhatsApp / Celular (com DDD)</label>
            <input
              type="tel"
              placeholder="Ex: 11 95329-2570"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-semibold focus:outline-emerald-600 bg-gray-50"
              required
              autoFocus
            />
            <p className="text-[10px] text-gray-500 mt-1">O número deve estar cadastrado previamente pelo administrador.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verificando...' : 'Entrar no Bolão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
