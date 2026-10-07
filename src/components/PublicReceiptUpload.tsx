import { useState } from 'react';
import { useToast } from './NotificationManager';

export default function PublicReceiptUpload() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !phone) {
      addToast('Preencha todos os campos e selecione uma foto.', 'error');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const response = await fetch('/api/public/upload-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            imageBase64: reader.result,
            mimeType: file.type
          })
        });

        const data = await response.json();
        if (data.success) {
          addToast('Comprovante enviado com sucesso!', 'success');
          setName('');
          setPhone('');
          setFile(null);
        } else {
          addToast(data.message || 'Erro ao enviar.', 'error');
        }
      } catch (e) {
        addToast('Erro na conexão.', 'error');
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="min-h-dvh h-full bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-black text-gray-800 mb-4">Enviar Comprovante PIX</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Seu Nome" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg" required />
          <input type="tel" placeholder="Seu Telefone (WhatsApp)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-lg" required />
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full p-2 border rounded-lg" required />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white p-3 rounded-lg font-bold">
            {loading ? 'Enviando...' : 'Enviar Comprovante'}
          </button>
        </form>
      </div>
    </div>
  );
}
