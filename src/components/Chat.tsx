import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, setDoc, limit } from 'firebase/firestore';
import { auth, db, isQuotaError } from '../lib/firebase';
import { formatFirstAndLastName } from '../lib/formatters';
import PageHeader from './PageHeader';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';

export default function Chat() {
  const { setIsQuotaExceeded } = usePool();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { addToast } = useToast();
  const isAdmin = auth.currentUser?.email === 'clodas12345@gmail.com';

  useEffect(() => {
    // Limitamos as últimas 100 mensagens para economizar cota e melhorar performance
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Revertemos para exibir em ordem cronológica (asc)
      setMessages(list.reverse());
    }, err => {
      console.warn('Messages snapshot error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'chatStatus'), (docSnap) => {
      if (docSnap.exists()) {
        setIsChatLocked(!!docSnap.data().locked);
      }
    }, err => {
      console.warn('ChatStatus snapshot error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChatLock = async () => {
    try {
      const newStatus = !isChatLocked;
      await setDoc(doc(db, 'settings', 'chatStatus'), { locked: newStatus }, { merge: true });
      setIsChatLocked(newStatus);
      addToast(newStatus ? 'Chat trancado pelo administrador.' : 'Chat aberto para todos.', 'info');
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao alterar status do chat.', 'error');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('A imagem é muito grande. Escolha uma imagem de até 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      if (base64String) {
        sendImageMessage(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const sendImageMessage = async (base64Url: string) => {
    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: '',
        imageUrl: base64Url,
        createdAt: serverTimestamp(),
        uid: auth.currentUser?.uid,
        displayName: auth.currentUser?.displayName || auth.currentUser?.email || 'Membro'
      });
      addToast('Foto enviada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao enviar foto no chat.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (isChatLocked && !isAdmin) {
      addToast('O chat está temporariamente fechado pelo administrador para manter a ordem.', 'error');
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim(),
        imageUrl: null,
        createdAt: serverTimestamp(),
        uid: auth.currentUser?.uid,
        displayName: auth.currentUser?.displayName || auth.currentUser?.email || 'Membro'
      });
      setNewMessage('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao enviar mensagem.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <PageHeader
        title="Chat do Grupo do Bolão"
        subtitle="Conversas, avisos de sorteio e envio de comprovantes em tempo real"
        icon="💬"
      />

      <div className="flex flex-col h-[calc(100vh-190px)] border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
        {/* Barra superior de status do chat */}
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isChatLocked ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="text-xs font-bold text-gray-700">
              {isChatLocked ? 'Chat Fechado (Modo Ordem Ativo)' : 'Chat Aberto'}
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={toggleChatLock}
              className={`text-xs px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                isChatLocked ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isChatLocked ? '🔓 Abrir Chat' : '🔒 Fechar Chat'}
            </button>
          )}
        </div>

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
              Nenhuma mensagem ainda. Seja o primeiro a mandar um olá ou enviar um comprovante!
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.uid === auth.currentUser?.uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-gray-500 mb-0.5 px-1 font-medium">
                    {formatFirstAndLastName(msg.displayName)}
                  </span>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] sm:max-w-md shadow-2xs text-xs sm:text-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
                    {msg.imageUrl && (
                      <div className="mt-2 cursor-pointer group relative" onClick={() => setActiveZoomImage(msg.imageUrl)}>
                        <img
                          src={msg.imageUrl}
                          alt="Comprovante / Foto"
                          className="max-w-full rounded-lg border border-black/10 max-h-60 object-contain bg-black/5 transition group-hover:opacity-95"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-lg text-white text-xs font-bold gap-1">
                          <span>🔍</span> Clique para ampliar
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Envio */}
        {isChatLocked && !isAdmin ? (
          <div className="p-3 bg-amber-50 border-t border-amber-200 text-center text-xs text-amber-800 font-semibold">
            🔒 O chat está temporariamente fechado pelo administrador para manter a ordem.
          </div>
        ) : (
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="chatFileInput"
            />
            <label
              htmlFor="chatFileInput"
              className="cursor-pointer p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border border-gray-200"
              title="Enviar foto ou comprovante"
            >
              📷
            </label>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border border-gray-300 bg-white p-2.5 text-xs sm:text-sm rounded-xl focus:outline-blue-500"
              placeholder="Digite sua mensagem ou envie uma foto..."
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSending ? '...' : 'Enviar'}
            </button>
          </form>
        )}
      </div>

      {/* Modal de Zoom da Imagem */}
      {activeZoomImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setActiveZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActiveZoomImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white font-black px-3 py-1.5 rounded-full text-sm transition cursor-pointer"
            >
              ✕ Fechar
            </button>
            <img
              src={activeZoomImage}
              alt="Imagem ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-black border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
