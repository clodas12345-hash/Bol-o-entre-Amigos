import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { PixConfig, DEFAULT_PIX_CONFIG, generatePixPayload, generatePixQrCode } from '../lib/pix';
import { useToast } from './NotificationManager';

interface PixPaymentAreaProps {
  customAmount?: number;
  showAdminEdit?: boolean;
  onClose?: () => void;
  title?: string;
}

export default function PixPaymentArea({
  customAmount,
  showAdminEdit = true,
  onClose,
  title = 'Pagamento via PIX'
}: PixPaymentAreaProps) {
  const [config, setConfig] = useState<PixConfig>(DEFAULT_PIX_CONFIG);
  const [selectedAmount, setSelectedAmount] = useState<number>(customAmount || 20.00);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixPayload, setPixPayload] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const { addToast } = useToast();
  const isAdmin = auth.currentUser?.email === 'clodas12345@gmail.com';

  // Formulário de edição da chave pelo Admin
  const [editForm, setEditForm] = useState<PixConfig>(DEFAULT_PIX_CONFIG);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'pix'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PixConfig;
        setConfig(data);
        setEditForm(data);
        if (!customAmount) {
          setSelectedAmount(data.defaultAmount || 20.00);
        }
      }
    }, (err) => {
      console.warn('Pix settings snapshot error:', err);
    });
    return unsub;
  }, [customAmount]);

  // Atualiza Payload e QR Code sempre que o valor ou configuração mudar
  useEffect(() => {
    const payload = generatePixPayload(config, selectedAmount);
    setPixPayload(payload);
    generatePixQrCode(payload).then(url => setQrCodeUrl(url));
  }, [config, selectedAmount]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(config.pixKey);
    setCopiedKey(true);
    addToast('Chave PIX copiada com sucesso!', 'success');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    addToast('Código PIX Copia-e-Cola copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.pixKey.trim()) {
      addToast('A chave PIX não pode estar vazia.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pix'), editForm, { merge: true });
      setConfig(editForm);
      setIsEditing(false);
      addToast('Configurações da Chave PIX salvas com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar chave PIX:', err);
      addToast('Erro ao salvar dados do PIX.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📱</span>
          <div>
            <h3 className="font-bold text-base leading-tight">{title}</h3>
            <p className="text-xs text-emerald-100">Pague sua cota com QR Code ou Copia-e-Cola</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && showAdminEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1 rounded-md font-semibold transition"
              title="Configurar chave PIX do administrador"
            >
              ⚙️ Editar Chave
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-lg font-bold p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {isEditing ? (
          /* Formulário de Configuração da Chave PIX (Admin) */
          <form onSubmit={handleSaveConfig} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <span>⚙️</span> Configurar Chave PIX do Bolão
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Chave</label>
                <select
                  value={editForm.keyType}
                  onChange={e => setEditForm({ ...editForm, keyType: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-emerald-500"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="phone">Telefone / Celular</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                  <option value="cnpj">CNPJ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chave PIX *</label>
                <input
                  type="text"
                  value={editForm.pixKey}
                  onChange={e => setEditForm({ ...editForm, pixKey: e.target.value })}
                  placeholder="ex: clodas12345@gmail.com ou 11999999999"
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome do Titular *</label>
                <input
                  type="text"
                  value={editForm.receiverName}
                  onChange={e => setEditForm({ ...editForm, receiverName: e.target.value })}
                  placeholder="Nome completo ou Razão Social"
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade do Titular</label>
                <input
                  type="text"
                  value={editForm.receiverCity}
                  onChange={e => setEditForm({ ...editForm, receiverCity: e.target.value })}
                  placeholder="ex: SAO PAULO"
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Valor Padrão da Cota (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.defaultAmount}
                  onChange={e => setEditForm({ ...editForm, defaultAmount: parseFloat(e.target.value) || 20.00 })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mensagem / Identificação</label>
                <input
                  type="text"
                  value={editForm.infoMessage || ''}
                  onChange={e => setEditForm({ ...editForm, infoMessage: e.target.value })}
                  placeholder="ex: Cota Bolao Lotofacil"
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Chave'}
              </button>
            </div>
          </form>
        ) : (
          /* Área Visual do PIX com QR Code e Copia-e-Cola */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* Coluna 1: QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-emerald-50/40 rounded-xl border border-emerald-100">
              <div className="bg-white p-2.5 rounded-xl shadow-xs border border-gray-200">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-xs text-gray-400">
                    Gerando QR Code...
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 mt-2 flex items-center gap-1">
                <span>📷</span> Aponte a câmera no app do seu banco
              </span>
            </div>

            {/* Coluna 2: Dados e Botões de Cópia */}
            <div className="space-y-3.5">
              {/* Seletor de Cotas / Valor */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">Valor do PIX:</span>
                  <span className="text-base font-black text-emerald-700">
                    R$ {selectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[20, 40, 60, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelectedAmount(val)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                        selectedAmount === val
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {val === 20 ? '1 Cota (R$ 20)' : `${val / 20} Cotas (R$ ${val})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Informações do Titular */}
              <div className="text-xs space-y-1 bg-white p-2.5 rounded-lg border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Titular da Conta:</span>
                  <span className="font-semibold text-gray-800">{config.receiverName || 'Administrador'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chave PIX:</span>
                  <span className="font-mono font-bold text-gray-800">{config.pixKey}</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    copiedPayload
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <span>{copiedPayload ? '✓' : '📋'}</span>
                  {copiedPayload ? 'Código Copia-e-Cola Copiado!' : 'Copiar Código PIX Copia-e-Cola'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🔑</span> {copiedKey ? 'Chave Copiada!' : `Copiar apenas a Chave (${config.pixKey})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
