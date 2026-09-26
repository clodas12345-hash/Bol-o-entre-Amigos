import React, { useState, useEffect } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { formatPhoneDisplay, normalizeBrazilianPhoneDigits } from '../lib/formatters';

interface EditProfileModalProps {
  user: any;
  userData: any;
  onClose: () => void;
  onSaved?: (updatedData: any) => void;
}

export default function EditProfileModal({ user, userData, onClose, onSaved }: EditProfileModalProps) {
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState(
    userData?.displayName || user?.displayName || ''
  );
  const [phone, setPhone] = useState(
    userData?.phone || user?.phoneNumber || ''
  );
  const [pixKey, setPixKey] = useState(
    userData?.pixKey || ''
  );
  const [pixType, setPixType] = useState<'cpf' | 'telefone' | 'email' | 'aleatoria'>(
    userData?.pixType || 'telefone'
  );
  const [quotas, setQuotas] = useState<number>(
    Number(userData?.quotas) > 0 ? Number(userData?.quotas) : 1
  );
  const [notes, setNotes] = useState(
    userData?.notes || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = userData?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('Por favor, informe seu nome completo.', 'error');
      return;
    }

    setIsSaving(true);
    const cleanPhone = normalizeBrazilianPhoneDigits(phone);
    const userId = user?.uid;

    const updatedProfileData = {
      displayName: displayName.trim(),
      phone: cleanPhone,
      pixKey: pixKey.trim(),
      pixType,
      quotas: Math.max(1, quotas),
      notes: notes.trim(),
      approved: true,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Atualiza no Firebase Auth se estiver logado via Auth
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: displayName.trim()
          });
        } catch (authErr) {
          console.warn('Erro ao atualizar auth displayName:', authErr);
        }
      }

      // 2. Atualiza no Firestore nas coleções users e members se houver uid
      if (userId) {
        try {
          const userDocRef = doc(db, 'users', userId);
          await setDoc(userDocRef, updatedProfileData, { merge: true });
        } catch (err) {
          console.warn('Erro ao salvar em users:', err);
        }

        try {
          const memberDocRef = doc(db, 'members', userId);
          await setDoc(memberDocRef, updatedProfileData, { merge: true });
        } catch (err) {
          console.warn('Erro ao salvar em members:', err);
        }
      }

      // 3. Atualiza sessão local de login via celular se aplicável
      try {
        const savedPhoneUser = localStorage.getItem('bolao_phone_user');
        if (savedPhoneUser) {
          const parsed = JSON.parse(savedPhoneUser);
          const updated = {
            ...parsed,
            sessionUser: {
              ...parsed.sessionUser,
              displayName: displayName.trim()
            },
            memberData: {
              ...(parsed.memberData || {}),
              ...updatedProfileData
            }
          };
          localStorage.setItem('bolao_phone_user', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Erro ao atualizar cache local:', e);
      }

      addToast('Cadastro atualizado com sucesso!', 'success');
      if (onSaved) {
        onSaved(updatedProfileData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cadastro:', error);
      addToast('Ocorreu um erro ao salvar as alterações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              👤
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Meu Cadastro</h3>
              <p className="text-[11px] text-blue-100">Atualize seus dados pessoais e chave PIX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-black transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulário de Edição */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              WhatsApp / Celular
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11 99999-8888"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
            />
            {phone && (
              <p className="text-[11px] text-gray-500 mt-1">
                Formatado: <strong>{formatPhoneDisplay(phone)}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                Tipo da Chave
              </label>
              <select
                value={pixType}
                onChange={(e) => setPixType(e.target.value as any)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition cursor-pointer"
              >
                <option value="telefone">Celular</option>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Aleatória</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                Chave PIX (Para Recebimento de Prêmios)
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Informe sua chave PIX"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wide">
                  Quantidade de Cotas
                </label>
                <p className="text-[11px] text-blue-700">
                  {isAdmin ? 'Você pode alterar diretamente como administrador' : 'Cotas ativas no bolão'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quotas}
                  disabled={!isAdmin}
                  onChange={(e) => setQuotas(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 bg-white border-2 border-blue-300 rounded-xl px-2 py-1.5 text-center font-black text-sm text-blue-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
                <span className="text-xs font-black text-blue-900">
                  R$ {(quotas * 20).toFixed(2).replace('.', ',')} / mês
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              Observações Pessoais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Preferência por contato no WhatsApp, etc."
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-700 hover:bg-blue-800 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isSaving ? 'Salvando...' : '✓ Salvar Meu Cadastro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
