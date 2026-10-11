import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { DEFAULT_PIX_CONFIG } from '../lib/pix';
import logoImg from '../assets/images/bolao_logo_app.png';

export default function PublicReceiptUpload() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const { addToast } = useToast();

  const pixKey = DEFAULT_PIX_CONFIG.pixKey || '11953292570';

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const preName = params.get('nome') || params.get('name') || '';
      const preTel = params.get('tel') || params.get('phone') || '';
      if (preName) setName(preName);
      if (preTel) setPhone(preTel);
    } catch {}
  }, []);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
    addToast('Chave PIX copiada com sucesso!', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim() || !phone.trim()) {
      addToast('Preencha seu nome, WhatsApp e anexe a foto do comprovante.', 'error');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Data = String(reader.result || '');
        const cleanName = name.trim();
        const cleanPhone = phone.trim();

        // Grava diretamente no Firestore (funciona tanto na Web quanto no APK sem depender de servidor externo)
        await addDoc(collection(db, 'pending_receipts'), {
          name: cleanName,
          phone: cleanPhone,
          imageBase64: base64Data,
          mimeType: file.type || 'image/jpeg',
          createdAt: serverTimestamp(),
          status: 'pending'
        });

        // Notifica os administradores em tempo real
        try {
          const qAdmin = query(collection(db, 'users'), where('role', '==', 'admin'));
          const adminSnap = await getDocs(qAdmin);
          for (const adminDoc of adminSnap.docs) {
            const adminData = adminDoc.data();
            await addDoc(collection(db, 'notifications'), {
              userId: adminData.uid || adminDoc.id,
              title: '💸 Novo Comprovante PIX Enviado',
              message: `${cleanName} (${cleanPhone}) enviou um comprovante de pagamento pelo link!`,
              type: 'payment',
              targetPath: '/contatos',
              read: false,
              createdAt: serverTimestamp()
            });
          }
        } catch {}

        setSubmittedSuccess(true);
        addToast('Comprovante enviado com sucesso para o administrador!', 'success');
        setFile(null);
      } catch (err) {
        console.error('Erro ao salvar comprovante no Firestore, tentando rota alternativa:', err);
        try {
          const response = await fetch('/api/public/upload-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              phone: phone.trim(),
              imageBase64: reader.result,
              mimeType: file.type
            })
          });
          const data = await response.json();
          if (data.success) {
            setSubmittedSuccess(true);
            addToast('Comprovante enviado com sucesso!', 'success');
            setFile(null);
          } else {
            addToast(data.message || 'Erro ao enviar comprovante.', 'error');
          }
        } catch {
          addToast('Erro ao enviar comprovante. Verifique sua conexão.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="min-h-dvh h-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white text-center relative">
          <div className="flex justify-center mb-2">
            <img
              src={logoImg}
              alt="Bolão entre Amigos"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/60 shadow-md"
            />
          </div>
          <h2 className="text-lg font-black tracking-wide">Bolão entre Amigos</h2>
          <p className="text-xs text-emerald-100 font-semibold mt-0.5">
            Envio Rápido de Comprovante PIX
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Card da Chave PIX para facilitar cópia */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 block">
                Chave PIX Oficial (Celular)
              </span>
              <span className="text-sm font-black font-mono text-gray-900">{pixKey}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyPix}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-2 rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              {copiedPix ? '✓ Copiada!' : '📋 Copiar PIX'}
            </button>
          </div>

          {submittedSuccess ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-3 animate-in fade-in">
              <div className="text-4xl">✅</div>
              <h3 className="text-base font-black text-emerald-950">
                Comprovante Recebido com Sucesso!
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Obrigado, <strong>{name}</strong>! Seu comprovante foi encaminhado para a administração homologar sua cota no bolão.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittedSuccess(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer"
                >
                  Enviar Outro Comprovante
                </button>
                <a
                  href="/"
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition block text-center"
                >
                  Ir para o Aplicativo do Bolão →
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Seu Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="Ex: (11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Foto ou PDF do Comprovante PIX *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-2.5 border-2 border-dashed border-emerald-300 rounded-xl text-xs bg-emerald-50/40 font-semibold text-gray-700 cursor-pointer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3.5 rounded-xl font-black text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📤</span>
                <span>{loading ? 'Enviando Comprovante...' : 'Enviar Comprovante PIX'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
