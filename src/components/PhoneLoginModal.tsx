import { useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
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
  const [passwordInput, setPasswordInput] = useState('');
  const [isAdminPrompt, setIsAdminPrompt] = useState(false);
  
  // Solicitação de Cadastro de Novo Membro
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizeBrazilianPhoneDigits(phoneInput);
    if (!cleanPhone || cleanPhone.length < 10) {
      addToast('Digite um número de celular válido com DDD (ex: 11953292570).', 'error');
      return;
    }

    const isAdminNumber = cleanPhone === '5511953292570' || cleanPhone.includes('11953292570');

    if (isAdminNumber && !isAdminPrompt) {
      setIsAdminPrompt(true);
      addToast('Este número pertence ao Administrador. Por favor, digite a senha de blindagem para prosseguir.', 'info');
      return;
    }

    if (isAdminNumber && isAdminPrompt) {
      if (passwordInput.trim() !== '192506') {
        addToast('Senha de blindagem incorreta!', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      let matchedMember: any = null;

      // 1. Verifica no admin fixo primeiro para login instantâneo sem depender de banco
      if (isAdminNumber) {
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

      // 3. Busca nos membros locais caso o banco esteja fora de cota ou offline
      if (!matchedMember) {
        try {
          const localSaved = localStorage.getItem('bolao_local_members');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            const found = parsed.find((m: any) => normalizeBrazilianPhoneDigits(m.phone || '') === cleanPhone);
            if (found) {
              matchedMember = { ...found };
            }
          }
        } catch (err) {
          console.warn('Error reading local members in login:', err);
        }
      }

      // Se não encontrou o celular cadastrado, abrimos o formulário para digitar o Nome
      if (!matchedMember) {
        if (!showRegisterPrompt) {
          setShowRegisterPrompt(true);
          setLoading(false);
          addToast('Celular não cadastrado. Insira seu Nome Completo para enviar uma solicitação de entrada ao bolão!', 'info');
          return;
        }

        if (!newDisplayName.trim()) {
          addToast('Por favor, preencha seu nome completo para prosseguir.', 'error');
          setLoading(false);
          return;
        }

        // Cadastra como solicitação pendente (approved: false)
        let docId = 'local_' + Date.now();
        let wasSavedLocally = false;

        try {
          const docRef = await addDoc(collection(db, 'users'), {
            displayName: newDisplayName.trim(),
            phone: cleanPhone,
            approved: true,
            role: 'participant',
            quotas: 1,
            paymentStatus: 'Pendente',
            createdAt: new Date().toISOString()
          });
          docId = docRef.id;
          addToast('Cadastro realizado com sucesso!', 'success');
        } catch (dbErr) {
          console.warn('DB error, saving registration locally', dbErr);
          wasSavedLocally = true;
          
          const localMember = {
            id: docId,
            displayName: newDisplayName.trim(),
            phone: cleanPhone,
            approved: true,
            role: 'participant',
            quotas: 1,
            paymentStatus: 'Pendente',
            createdAt: new Date().toISOString(),
            isLocalOnly: true,
            collectionName: 'members'
          };
          
          try {
            const currentLocal = localStorage.getItem('bolao_local_members');
            const parsed = currentLocal ? JSON.parse(currentLocal) : [];
            parsed.push(localMember);
            localStorage.setItem('bolao_local_members', JSON.stringify(parsed));
          } catch (e) {
            console.error('Failed to save registration in local storage:', e);
          }
          
          addToast('Cadastro realizado com sucesso!', 'success');
        }

        matchedMember = {
          id: docId,
          uid: docId,
          displayName: newDisplayName.trim(),
          phone: cleanPhone,
          approved: true,
          role: 'participant',
          quotas: 1,
          paymentStatus: 'Pendente',
          isLocalOnly: wasSavedLocally
        };
      }

      if (matchedMember) {
        if (matchedMember.approved) {
          addToast(`Bem-vindo(a) de volta, ${matchedMember.displayName || 'Participante'}!`, 'success');
        }
        onPhoneLoginSuccess(matchedMember);
      }
    } catch (err) {
      console.error('Erro ao autenticar por telefone:', err);
      addToast('Erro ao validar número de celular ou cadastrar solicitação.', 'error');
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
              onChange={e => {
                setPhoneInput(e.target.value);
                if (isAdminPrompt) {
                  setIsAdminPrompt(false);
                  setPasswordInput('');
                }
                if (showRegisterPrompt) {
                  setShowRegisterPrompt(false);
                  setNewDisplayName('');
                }
              }}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-semibold focus:outline-emerald-600 bg-gray-50"
              required
              autoFocus
            />
            <p className="text-[10px] text-gray-500 mt-1">O número deve estar cadastrado previamente pelo administrador.</p>
          </div>

          {isAdminPrompt && (
            <div className="text-left animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-bold text-red-600 mb-1.5">🔒 Senha de Blindagem Administrativa</label>
              <input
                type="password"
                placeholder="Digite a senha de 6 dígitos"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full border border-red-300 rounded-xl p-3 text-sm font-semibold focus:outline-red-600 bg-red-50/50"
                required
                autoFocus
              />
            </div>
          )}

          {showRegisterPrompt && (
            <div className="text-left animate-in fade-in slide-in-from-top-1 duration-200 space-y-2 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
              <h4 className="text-xs font-black text-emerald-950">📋 Solicitar Entrada no Bolão</h4>
              <p className="text-[10px] text-emerald-700 leading-normal">Seu celular ainda não está cadastrado. Insira seu nome completo abaixo para que o administrador aprove o seu acesso.</p>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Nome e Sobrenome"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold focus:outline-emerald-600 bg-white"
                  required
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verificando...' : isAdminPrompt ? 'Confirmar Blindagem' : showRegisterPrompt ? 'Enviar Solicitação de Entrada' : 'Entrar no Bolão'}
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
              onChange={e => {
                setPhoneInput(e.target.value);
                if (isAdminPrompt) {
                  setIsAdminPrompt(false);
                  setPasswordInput('');
                }
                if (showRegisterPrompt) {
                  setShowRegisterPrompt(false);
                  setNewDisplayName('');
                }
              }}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-semibold focus:outline-emerald-600 bg-gray-50"
              required
              autoFocus
            />
            <p className="text-[10px] text-gray-500 mt-1">O número deve estar cadastrado previamente pelo administrador.</p>
          </div>

          {isAdminPrompt && (
            <div className="text-left animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-bold text-red-600 mb-1.5">🔒 Senha de Blindagem Administrativa</label>
              <input
                type="password"
                placeholder="Digite a senha de 6 dígitos"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full border border-red-300 rounded-xl p-3 text-sm font-semibold focus:outline-red-600 bg-red-50/50"
                required
                autoFocus
              />
            </div>
          )}

          {showRegisterPrompt && (
            <div className="text-left animate-in fade-in slide-in-from-top-1 duration-200 space-y-2 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
              <h4 className="text-xs font-black text-emerald-950">📋 Solicitar Entrada no Bolão</h4>
              <p className="text-[10px] text-emerald-700 leading-normal">Seu celular ainda não está cadastrado. Insira seu nome completo abaixo para que o administrador aprove o seu acesso.</p>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Nome e Sobrenome"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold focus:outline-emerald-600 bg-white"
                  required
                  autoFocus
                />
              </div>
            </div>
          )}

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
              {loading ? 'Verificando...' : isAdminPrompt ? 'Confirmar' : showRegisterPrompt ? 'Solicitar Entrada' : 'Entrar no Bolão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
