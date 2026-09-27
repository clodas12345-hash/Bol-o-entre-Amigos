import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import bcrypt from 'bcryptjs';
import { Eye, EyeOff } from 'lucide-react';

interface SetPasswordModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  onSignOut?: () => void;
  canSkip?: boolean;
}

export default function SetPasswordModal({ userId, onClose, onSuccess, onSignOut, canSkip = false }: SetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { addToast } = useToast();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      addToast('A senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addToast('As senhas não coincidem.', 'error');
      return;
    }

    setLoading(true);
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Update in both collections just in case
      if (!userId) {
        addToast('Erro: ID do usuário inválido.', 'error');
        return;
      }
      
      let success = false;
      try {
        await updateDoc(doc(db, 'users', userId), { passwordHash, passwordSet: true });
        success = true;
      } catch (err) {
        console.warn('Could not update users collection:', err);
      }

      try {
        await updateDoc(doc(db, 'members', userId), { passwordHash, passwordSet: true });
        success = true;
      } catch (err) {
        console.warn('Could not update members collection:', err);
      }

      if (!success) {
        throw new Error('Não foi possível encontrar o registro do usuário para atualizar a senha.');
      }

      addToast('Senha definida com sucesso!', 'success');
      onSuccess();
    } catch (err) {
      console.error('Error setting password:', err);
      addToast('Erro ao definir senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="font-black text-lg text-emerald-900 flex items-center gap-2">
          <span>🎉</span> Solicitação Aprovada!
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Parabéns! Seu pedido para entrar no grupo foi aprovado pelo administrador. 
          <br /><br />
          Para sua segurança e privacidade, por favor crie uma senha para seus próximos acessos.
        </p>
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nova Senha (mín. 4 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-xl p-3 text-sm pr-10 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirme a Senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border rounded-xl p-3 text-sm pr-10 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Senha'}
          </button>
        </form>

        <div className="pt-2 flex flex-col gap-2">
          {canSkip && (
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition"
            >
              Pular por enquanto
            </button>
          )}
          
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl font-bold text-xs hover:bg-red-100 transition border border-red-100"
            >
              Sair da conta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
