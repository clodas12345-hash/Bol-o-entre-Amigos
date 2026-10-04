import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { auth, db, isQuotaError } from '../lib/firebase';
import { formatFirstAndLastName } from '../lib/formatters';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { getIsAdmin } from '../lib/authHelpers';
import { usePermissions } from '../lib/PermissionsContext';
import { containsBadWords } from '../lib/profanityFilter';
import { Camera, Image as ImageIcon, Mic, AtSign, Bot, Send, Reply, Smile, Trash2, Lock, Unlock, Sparkles, X, Check, AlertTriangle, ArrowLeft, EyeOff } from 'lucide-react';

function formatMessageTime(dateVal: any): string {
  if (!dateVal) return '';
  try {
    const d = typeof dateVal.toDate === 'function'
      ? dateVal.toDate()
      : (typeof dateVal.seconds === 'number' ? new Date(dateVal.seconds * 1000) : new Date(dateVal));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getSenderColor(name: string): string {
  const colors = [
    'text-emerald-700',
    'text-blue-700',
    'text-amber-700',
    'text-rose-700',
    'text-teal-700',
    'text-indigo-700',
    'text-cyan-700'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Chat() {
  const navigate = useNavigate();
  const { setIsQuotaExceeded, activePool } = usePool();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [lockedByInfo, setLockedByInfo] = useState<string | null>(null);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [selectedActionMsgId, setSelectedActionMsgId] = useState<string | null>(null);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const galleryUploadInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  const [aiLearnings, setAiLearnings] = useState<any[]>([]);
  const [autoAiEnabled, setAutoAiEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bolao_auto_ai_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const processedMsgIdsRef = useRef<Set<string>>(new Set());

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceBaseTextRef = useRef<string>('');
  const isStoppingVoiceRef = useRef<boolean>(false);

  const stopVoiceRecognitionSafely = () => {
    isStoppingVoiceRef.current = true;
    voiceBaseTextRef.current = '';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort?.();
        recognitionRef.current.stop?.();
      } catch (e) {
        console.warn(e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopVoiceRecognitionSafely();
    };
  }, []);

  const startVoiceToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast('Seu dispositivo ou navegador não suporta ditado por voz. Digite a mensagem ou use o microfone do teclado.', 'error');
      return;
    }

    if (isListening) {
      stopVoiceRecognitionSafely();
      return;
    }

    try {
      stopVoiceRecognitionSafely();
      isStoppingVoiceRef.current = false;
      voiceBaseTextRef.current = newMessage.trim();

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!isStoppingVoiceRef.current) {
          setIsListening(true);
        }
      };

      recognition.onresult = (event: any) => {
        if (isStoppingVoiceRef.current) return;
        if (!event.results || event.results.length === 0) return;

        const transcripts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const t = (event.results[i][0]?.transcript || '').trim();
          if (!t) continue;
          if (transcripts.length > 0) {
            const prev = transcripts[transcripts.length - 1];
            const prevLower = prev.toLowerCase();
            const curLower = t.toLowerCase();
            if (curLower.startsWith(prevLower) || curLower.includes(prevLower)) {
              transcripts[transcripts.length - 1] = t;
              continue;
            }
            if (prevLower.startsWith(curLower)) {
              continue;
            }
          }
          transcripts.push(t);
        }

        const spokenText = transcripts.join(' ').replace(/\s+/g, ' ').trim();
        if (spokenText && !isStoppingVoiceRef.current) {
          const base = voiceBaseTextRef.current;
          setNewMessage(base ? `${base} ${spokenText}` : spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Erro no áudio de voz:', event.error);
        setIsListening(false);
        recognitionRef.current = null;
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          addToast('Não foi possível compreender o áudio. Tente falar novamente.', 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      setIsListening(false);
      recognitionRef.current = null;
      addToast('Erro ao iniciar escuta do microfone.', 'error');
    }
  };

  const { addToast } = useToast();
  const { isAdmin: permissionsIsAdmin, isCounselor, can } = usePermissions();
  const isAdmin = getIsAdmin() || permissionsIsAdmin;
  const canModerate = isAdmin || isCounselor || can('chat_moderate');

  // Monitora a base de conhecimentos aprendidos pela IA no Firestore
  useEffect(() => {
    const q = query(collection(db, 'ai_learnings'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAiLearnings(list);
    }, err => {
      console.warn('ai_learnings snapshot error:', err);
    });
    return unsubscribe;
  }, []);

  const toggleAutoAi = () => {
    const nextVal = !autoAiEnabled;
    setAutoAiEnabled(nextVal);
    localStorage.setItem('bolao_auto_ai_enabled', JSON.stringify(nextVal));
    addToast(
      nextVal 
        ? '🤖 IA Assistente Automática Ativada! Ela responderá dúvidas do chat e aprenderá com suas respostas.' 
        : '⏸️ IA Automática Pausada.', 
      'info'
    );
  };

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const data = docSnap.data();
        setIsChatLocked(!!data.locked);
        setLockedByInfo(data.lockedBy || null);
      }
    }, err => {
      console.warn('ChatStatus snapshot error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Efeito para a IA responder automaticamente perguntas no chat em tempo real
  useEffect(() => {
    if (!autoAiEnabled || messages.length === 0) return;

    const questionKeywords = [
      '?', 'quanto', 'quantos', 'onde', 'como', 'quando', 'qual', 'quais', 'por que', 'porque',
      'quem', 'cota', 'cotas', 'pix', 'pagar', 'pagamento', 'chave', 'regras', 'sorteio',
      'resultado', 'bolao', 'bolão', 'valor', 'custo', 'colaborar', 'ganhou', 'premio',
      'prêmio', 'horario', 'horário', 'dia', 'funciona'
    ];

    const recentMessages = messages.slice(-5);

    recentMessages.forEach((msg) => {
      if (
        msg.id &&
        msg.status === 'approved' &&
        !msg.deleted &&
        !msg.photoHiddenForModeration &&
        !msg.isAiBot &&
        msg.uid !== 'bot_ai_assistant' &&
        !processedMsgIdsRef.current.has(msg.id)
      ) {
        const alreadyAnsweredByAi = messages.some(
          m => m.isAiBot && m.replyTo?.id === msg.id
        );

        if (alreadyAnsweredByAi) {
          processedMsgIdsRef.current.add(msg.id);
          return;
        }

        const lowerText = (msg.text || '').toLowerCase();
        const isQuestion = questionKeywords.some(kw => lowerText.includes(kw));

        if (isQuestion) {
          processedMsgIdsRef.current.add(msg.id);
          setTimeout(() => {
            askAiAssistant(msg.text, msg.id, msg.displayName);
          }, 1500);
        }
      }
    });
  }, [messages, autoAiEnabled, aiLearnings]);

  const toggleChatLock = async () => {
    if (!canModerate) return;
    try {
      const newStatus = !isChatLocked;
      const moderatorTitle = isAdmin ? 'Administrador' : (isCounselor ? 'Conselheiro' : 'Moderador');
      const moderatorName = auth.currentUser?.displayName || moderatorTitle;
      
      await setDoc(doc(db, 'settings', 'chatStatus'), {
        locked: newStatus,
        lockedBy: newStatus ? `${moderatorName} (${moderatorTitle})` : null,
        lockedAt: newStatus ? new Date().toISOString() : null
      }, { merge: true });
      
      setIsChatLocked(newStatus);
      addToast(
        newStatus 
          ? '🔒 Chat trancado pela moderação. Apenas Conselheiros e Administradores podem enviar mensagens.' 
          : '🔓 Chat aberto para todos os participantes!', 
        'info'
      );
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao alterar status do chat.', 'error');
    }
  };

  const deleteMessage = async (msg: any) => {
    const msgId = msg.id;
    const currentUser = getCurrentUser();
    const moderatorTitle = isAdmin ? 'Administrador' : (isCounselor ? 'Conselheiro' : 'Participante');
    const moderatorName = currentUser.displayName || 'Participante';
    const actorFormatted = `${formatFirstAndLastName(moderatorName)} (${moderatorTitle})`;

    // Se for uma FOTO, deixa ela OFF (oculta) para um moderador verificar se há conteúdo inapropriado
    if (msg.imageUrl) {
      try {
        await updateDoc(doc(db, 'messages', msgId), {
          photoHiddenForModeration: true,
          hiddenBy: actorFormatted,
          hiddenAt: serverTimestamp(),
          status: 'pending_photo_moderation'
        });
        setSelectedActionMsgId(null);
        addToast('📷 Foto deixada OFF e encaminhada para verificação de um moderador!', 'info');
      } catch (err) {
        console.error('Erro ao ocultar foto para moderação:', err);
        if (isQuotaError(err)) setIsQuotaExceeded(true);
        addToast('Erro ao sinalizar foto para moderação.', 'error');
      }
      return;
    }

    try {
      await updateDoc(doc(db, 'messages', msgId), {
        deleted: true,
        deletedBy: actorFormatted,
        deletedAt: serverTimestamp()
      });
      setSelectedActionMsgId(null);
      addToast('Mensagem apagada com sucesso!', 'success');
    } catch (err) {
      console.warn('Erro ao atualizar mensagem, executando exclusao direta:', err);
      try {
        await deleteDoc(doc(db, 'messages', msgId));
        setSelectedActionMsgId(null);
        addToast('Mensagem apagada com sucesso!', 'success');
      } catch (deleteErr) {
        console.error('Erro ao apagar mensagem:', deleteErr);
        if (isQuotaError(deleteErr)) setIsQuotaExceeded(true);
        addToast('Erro ao apagar mensagem no chat.', 'error');
      }
    }
  };

  const approveHiddenPhoto = async (msgId: string) => {
    try {
      const currentUser = getCurrentUser();
      await updateDoc(doc(db, 'messages', msgId), {
        photoHiddenForModeration: false,
        status: 'approved',
        approvedBy: currentUser.displayName,
        approvedAt: serverTimestamp()
      });
      addToast('✅ Foto verificada e liberada novamente no chat!', 'success');
    } catch (err) {
      console.error('Erro ao liberar foto:', err);
      addToast('Erro ao liberar foto.', 'error');
    }
  };

  const hardDeleteMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', msgId));
      addToast('Registro removido definitivamente!', 'success');
    } catch (err) {
      console.error('Erro ao remover mensagem definitivamente:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao remover mensagem.', 'error');
    }
  };

  const approveMessage = async (msgId: string) => {
    try {
      const currentUser = getCurrentUser();
      await updateDoc(doc(db, 'messages', msgId), {
        status: 'approved',
        approvedBy: currentUser.displayName,
        approvedAt: serverTimestamp()
      });
      addToast('Mensagem aprovada e publicada no chat!', 'success');
    } catch (err) {
      console.error('Erro ao aprovar mensagem:', err);
      addToast('Erro ao aprovar mensagem.', 'error');
    }
  };

  const rejectMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', msgId));
      addToast('Conteúdo rejeitado e excluído definitivamente.', 'info');
    } catch (err) {
      console.error('Erro ao rejeitar mensagem:', err);
      addToast('Erro ao rejeitar mensagem.', 'error');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setShowCameraOptions(false);
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      addToast('A imagem é muito grande. Escolha uma imagem de até 4MB.', 'error');
      e.target.value = '';
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
    e.target.value = '';
  };

  const getCurrentUser = () => {
    if (auth.currentUser?.uid) {
      return {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || auth.currentUser.email || 'Membro'
      };
    }
    try {
      const savedPhone = localStorage.getItem('bolao_phone_user');
      if (savedPhone) {
        const parsed = JSON.parse(savedPhone);
        return {
          uid: parsed?.sessionUser?.uid || parsed?.memberData?.id || 'admin_phone_clodas',
          displayName: parsed?.sessionUser?.displayName || parsed?.memberData?.displayName || 'Clodas (Admin)'
        };
      }
    } catch {}
    return {
      uid: 'admin_phone_clodas',
      displayName: 'Clodas (Admin)'
    };
  };

  const sendImageMessage = async (base64Url: string) => {
    if (isChatLocked && !canModerate) {
      addToast('O chat está travado pela moderação. Apenas Administradores e Conselheiros podem enviar mensagens.', 'error');
      return;
    }
    setIsSending(true);
    const currentUser = getCurrentUser();
    try {
      await addDoc(collection(db, 'messages'), {
        text: '',
        imageUrl: base64Url,
        createdAt: serverTimestamp(),
        clientTimestampMs: Date.now(),
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        status: 'approved',
        photoHiddenForModeration: false
      });
      addToast('📷 Foto enviada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao enviar foto no chat.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const [membersList, setMembersList] = useState<any[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [dismissSmartSuggestions, setDismissSmartSuggestions] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'members'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembersList(list);
    }, err => console.warn('Members snapshot error:', err));
    return unsub;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);

    const cursorPosition = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1 && (lastAtPos === 0 || textBeforeCursor[lastAtPos - 1] === ' ')) {
      const queryStr = textBeforeCursor.slice(lastAtPos + 1);
      if (!queryStr.includes(' ')) {
        setMentionQuery(queryStr.toLowerCase());
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  const insertMention = (name: string) => {
    const lastAtPos = newMessage.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const prefix = newMessage.slice(0, lastAtPos);
      setNewMessage(`${prefix}@${name} `);
    } else {
      setNewMessage(`${newMessage}@${name} `);
    }
    setShowMentionDropdown(false);
  };

  const availableMentions = [
    { id: 'todos', displayName: 'Todos', role: 'Grupo' },
    { id: 'admins', displayName: 'Administradores', role: 'Moderação' },
    ...membersList.map(m => ({
      id: m.id,
      displayName: m.displayName || m.name || 'Membro',
      role: m.role === 'admin' ? 'Admin' : (m.role === 'counselor' ? 'Conselheiro' : 'Participante')
    }))
  ].filter(m => !mentionQuery || m.displayName.toLowerCase().includes(mentionQuery));

  // Detecção inteligente de dúvidas financeiras para moderadores (Admin/Conselheiro)
  const financialKeywords = ['quanto', 'colaborar', 'custo', 'valor', 'cota', 'pix', 'pagar', 'chave', 'preço', 'contribuição', 'depósito'];
  const hasFinancialInInput = financialKeywords.some(kw => newMessage.toLowerCase().includes(kw));
  const recentFinancialMsg = messages.slice(-10).reverse().find(m => 
    m.status === 'approved' && 
    !m.isAiBot &&
    m.uid !== getCurrentUser().uid && 
    m.text && financialKeywords.some(kw => m.text.toLowerCase().includes(kw))
  );

  const showFinancialSuggestions = canModerate && !dismissSmartSuggestions && (hasFinancialInInput || !!recentFinancialMsg);

  const quickReplyOptions = [
    {
      label: '💳 Cota R$ 5 + PIX',
      text: 'O valor de cada cota é R$ 5,00. Nossa chave PIX é 11953292570 (Nome: Clodas).'
    },
    {
      label: '📊 Como Colaborar',
      text: 'Para colaborar no bolão, envie R$ 5,00 por cota via PIX e compartilhe o comprovante aqui no chat.'
    },
    {
      label: '📌 Cotas Ilimitadas',
      text: 'Você pode adquirir quantas cotas desejar (R$ 5,00 cada). Chave PIX: 11953292570'
    }
  ];

  const toggleReaction = async (msgId: string, emoji: string) => {
    const currentUser = getCurrentUser();
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const currentReactions = msg.reactions || {};
    const usersWithEmoji = currentReactions[emoji] || [];
    let updatedUsers = [];

    if (usersWithEmoji.includes(currentUser.uid)) {
      updatedUsers = usersWithEmoji.filter((u: string) => u !== currentUser.uid);
    } else {
      updatedUsers = [...usersWithEmoji, currentUser.uid];
    }

    const newReactions = { ...currentReactions, [emoji]: updatedUsers };
    if (updatedUsers.length === 0) {
      delete newReactions[emoji];
    }

    try {
      await updateDoc(doc(db, 'messages', msgId), {
        reactions: newReactions
      });
      setActiveReactionMsgId(null);
      setSelectedActionMsgId(null);
    } catch (err) {
      console.error('Erro ao reagir:', err);
    }
  };

  const renderMessageTextWithMentions = (text: string, isMe: boolean) => {
    if (!text) return null;
    const parts = text.split(/(@[\wÁ-ÿ]+(?:\s[\wÁ-ÿ]+)?)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={index} 
            className={`font-black px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs inline-block my-0.5 mx-0.5 ${
              isMe 
                ? 'bg-emerald-900/15 text-emerald-950 font-extrabold' 
                : 'bg-blue-100 text-blue-900 font-extrabold'
            }`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const askAiAssistant = async (questionText: string, targetMsgId?: string, targetDisplayName?: string) => {
    try {
      setSelectedActionMsgId(null);
      addToast('🤖 IA do Bolão analisando e gerando resposta...', 'info');
      const recentHistory = messages.slice(-20).map(m => ({
        displayName: m.displayName,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          chatHistory: recentHistory,
          learnedKnowledge: aiLearnings,
          poolContext: {
            quotaValue: 'R$ 5,00 por cota (ou R$ 10,00 para concursos especiais)',
            pixKey: '11953292570 (Nome: Clodas)',
            details: activePool?.description || activePool?.name || 'Bolão Amigos Lotofácil'
          }
        })
      });

      const data = await res.json();
      if (data.success && data.answer) {
        await addDoc(collection(db, 'messages'), {
          text: data.answer,
          imageUrl: null,
          createdAt: serverTimestamp(),
          uid: 'bot_ai_assistant',
          displayName: '🤖 IA Assistente do Bolão',
          status: 'approved',
          isAiBot: true,
          replyTo: targetMsgId ? {
            id: targetMsgId,
            displayName: targetDisplayName || 'Participante',
            text: questionText
          } : null
        });
        addToast('🤖 A IA do Bolão respondeu no chat!', 'success');
      } else {
        addToast('A IA não encontrou essa informação no histórico.', 'error');
      }
    } catch (err) {
      console.error('Erro ao chamar IA assistente:', err);
      addToast('Erro ao consultar a IA.', 'error');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const sentText = newMessage.trim();
    if (!sentText || isSending) return;

    if (isChatLocked && !canModerate) {
      addToast('O chat está travado pela moderação. Apenas Administradores e Conselheiros podem enviar mensagens.', 'error');
      return;
    }

    // 1. Para o reconhecimento de voz imediatamente e limpa o campo na hora (sem travar a tela!)
    stopVoiceRecognitionSafely();
    setNewMessage('');

    const currentReply = replyingTo;
    setReplyingTo(null);
    setShowMentionDropdown(false);
    setShowCameraOptions(false);

    const currentUser = getCurrentUser();
    const badWordsCheck = containsBadWords(sentText);

    const needsApproval = !canModerate && badWordsCheck.hasBadWords;
    const msgStatus = needsApproval ? 'pending_approval' : 'approved';

    const replyData = currentReply ? {
      id: currentReply.id,
      displayName: currentReply.displayName,
      text: currentReply.text || (currentReply.imageUrl ? '📷 Foto' : ''),
      uid: currentReply.uid || null
    } : null;

    // Detecta se alguém foi marcado (@Nome, @Todos ou @Administradores)
    const lowerSentText = sentText.toLowerCase();
    const hasAtMention = /@[\wÁ-ÿ]+/.test(sentText);
    const mentionEveryone = /@(todos|todo\s*mundo|grupo)\b/i.test(sentText);
    const mentionAdmins = /@(administradores|admins|admin|moderadores)\b/i.test(sentText);

    const mentionedMemberTargets: { id: string; uid?: string; displayName: string }[] = [];
    if (hasAtMention && !mentionEveryone) {
      membersList.forEach(m => {
        const mName = String(m.displayName || m.name || '').trim();
        if (!mName) return;
        const mNameLower = mName.toLowerCase();
        const firstNameLower = mNameLower.split(/\s+/)[0];
        if (
          lowerSentText.includes(`@${mNameLower}`) ||
          (firstNameLower.length >= 2 && new RegExp(`@${firstNameLower}\\b`, 'i').test(sentText))
        ) {
          mentionedMemberTargets.push({
            id: m.id,
            uid: m.uid || m.id,
            displayName: mName
          });
        }
      });
    }

    const mentionedUserIds = Array.from(
      new Set(
        mentionedMemberTargets.flatMap(t => [t.id, t.uid].filter(Boolean) as string[])
      )
    );
    const mentionedNames = mentionedMemberTargets.map(t => t.displayName.toLowerCase());

    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        text: sentText,
        imageUrl: null,
        createdAt: serverTimestamp(),
        clientTimestampMs: Date.now(),
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        status: msgStatus,
        flaggedWords: badWordsCheck.foundWords || [],
        replyTo: replyData,
        hasMentions: hasAtMention,
        mentionEveryone,
        mentionAdmins,
        mentionedUserIds,
        mentionedNames
      });

      // Se houver menção explícita e a mensagem estiver aprovada:
      // - Se for @Todos -> todos recebem notificação
      // - Se for @Pessoa específica -> APENAS a pessoa marcada recebe a notificação
      if (!needsApproval && hasAtMention) {
        if (mentionEveryone) {
          addDoc(collection(db, 'notifications'), {
            userId: 'all',
            title: `📢 ${formatFirstAndLastName(currentUser.displayName)} marcou @Todos no Chat`,
            message: sentText.slice(0, 120),
            type: 'chat',
            read: false,
            createdAt: serverTimestamp()
          }).catch(() => {});
        } else if (mentionedUserIds.length > 0) {
          mentionedUserIds.forEach(targetUid => {
            if (targetUid && targetUid !== currentUser.uid) {
              addDoc(collection(db, 'notifications'), {
                userId: targetUid,
                title: `💬 ${formatFirstAndLastName(currentUser.displayName)} marcou você no Chat`,
                message: sentText.slice(0, 120),
                type: 'chat',
                isDirectMention: true,
                read: false,
                createdAt: serverTimestamp()
              }).catch(() => {});
            }
          });
        }
      }

      // Grava aprendizado em background sem bloquear
      if (canModerate && sentText.length > 3) {
        addDoc(collection(db, 'ai_learnings'), {
          topic: sentText.slice(0, 80),
          question: currentReply?.text || 'Instrução do Administrador/Conselheiro',
          answer: sentText,
          author: `${currentUser.displayName} (${isAdmin ? 'Administrador' : 'Conselheiro'})`,
          createdAt: serverTimestamp()
        }).catch(learnErr => {
          console.warn('Erro ao gravar aprendizado na IA:', learnErr);
        });
      }

      if (needsApproval) {
        addToast('⚠️ Sua mensagem contém termos de baixo calão e precisa de autorização de um Conselheiro ou Administrador para ser publicada.', 'info');
      } else {
        const lowerText = sentText.toLowerCase();
        const isAiQuestion = lowerText.includes('@ia') || lowerText.includes('@assistente') || lowerText.includes('@bot') ||
          (lowerText.includes('?') && (lowerText.includes('quanto') || lowerText.includes('qual') || lowerText.includes('pix') || lowerText.includes('cota') || lowerText.includes('pagar') || lowerText.includes('valor') || lowerText.includes('colaborar')));

        if (isAiQuestion) {
          setTimeout(() => {
            askAiAssistant(sentText, docRef.id, currentUser.displayName);
          }, 800);
        }
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setNewMessage(sentText);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao enviar mensagem.', 'error');
    }
  };

  const pendingApprovalCount = messages.filter(
    m => m.status === 'pending_approval' || m.photoHiddenForModeration || m.status === 'pending_photo_moderation'
  ).length;

  return (
    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0 h-full">
      <div className="flex flex-col flex-1 min-h-0 h-full sm:border border-slate-200/90 sm:rounded-2xl bg-[#efeae2] shadow-lg overflow-hidden relative">
        {/* Header Único do Chat com Botão Voltar Integrado */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-2.5 sm:px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="h-9 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center gap-1 text-xs font-bold transition cursor-pointer shrink-0 border border-white/20"
              title="Voltar para o início"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center text-sm sm:text-base border border-white/20 shadow-inner">
                🍀
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-emerald-950 ${
                  isChatLocked ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                  {activePool?.name || 'Chat do Bolão'}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-200/90 font-medium truncate">
                <span>
                  {isChatLocked
                    ? `Trancado ${lockedByInfo ? `por ${lockedByInfo}` : ''}`
                    : 'Chat aberto'}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 text-emerald-300 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" />
                  {aiLearnings.length} IA
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleAutoAi}
              className={`h-8 px-2.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 border whitespace-nowrap ${
                autoAiEnabled
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border-emerald-400/40'
                  : 'bg-white/10 hover:bg-white/15 text-white/70 border-white/15'
              }`}
              title="Ligar/Desligar resposta automática da IA para dúvidas no chat"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">IA Auto</span>
              <span className={`w-1.5 h-1.5 rounded-full ${autoAiEnabled ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            </button>

            {canModerate && (
              <button
                type="button"
                onClick={toggleChatLock}
                className={`h-8 px-2.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  isChatLocked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30'
                }`}
                title={isChatLocked ? 'Liberar chat para todos os participantes' : 'Travar chat (apenas moderadores poderão postar)'}
              >
                {isChatLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isChatLocked ? 'Destravar' : 'Travar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Alerta de Mensagens/Fotos Pendentes para Moderadores */}
        {canModerate && pendingApprovalCount > 0 && (
          <div className="bg-amber-500 text-white text-xs px-3.5 py-2 font-bold flex items-center justify-between border-b border-amber-600 shadow-xs z-10">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{pendingApprovalCount} item(ns) aguardando verificação da moderação.</span>
            </span>
          </div>
        )}

        {/* Área de Mensagens com fundo suave estilo WhatsApp */}
        <div
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2 relative"
          onClick={() => {
            if (selectedActionMsgId) setSelectedActionMsgId(null);
            if (activeReactionMsgId) setActiveReactionMsgId(null);
            if (showCameraOptions) setShowCameraOptions(false);
          }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="bg-white/90 backdrop-blur-xs px-5 py-4 rounded-2xl shadow-xs border border-black/5 max-w-xs space-y-1.5">
                <div className="text-2xl">💬</div>
                <p className="text-xs font-bold text-slate-700">Nenhuma mensagem ainda</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Envie uma mensagem para o grupo, tire dúvidas ou compartilhe seu comprovante!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const activeUser = getCurrentUser();
              const isMe = msg.uid === activeUser.uid || (msg.displayName && activeUser.displayName && msg.displayName === activeUser.displayName);
              const isAi = !!msg.isAiBot || msg.uid === 'bot_ai_assistant';
              const isPhotoMsg = !!msg.imageUrl;
              const isPhotoHidden = !!msg.photoHiddenForModeration || msg.status === 'pending_photo_moderation';
              // Qualquer participante pode deletar/ocultar fotos para revisão de moderador; mensagens de texto seguem autor ou moderador
              const canDeleteThisMsg = canModerate || isMe || isPhotoMsg;
              const isPending = msg.status === 'pending_approval';
              const isActionOpen = selectedActionMsgId === msg.id;

              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const isSameAuthorAsPrev = prevMsg && !prevMsg.deleted && !prevMsg.photoHiddenForModeration && prevMsg.uid === msg.uid && prevMsg.displayName === msg.displayName;
              const timeStr = formatMessageTime(msg.createdAt);
              const senderName = formatFirstAndLastName(msg.displayName);

              if (isPending && !canModerate && !isMe) {
                return null;
              }

              // Foto que foi deletada/ocultada (OFF) para um moderador verificar conteúdo inapropriado
              if (isPhotoHidden && !msg.deleted) {
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1.5`}>
                    {canModerate ? (
                      <div className="p-3 rounded-2xl max-w-[88%] sm:max-w-md bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-md space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-1.5">
                          <span className="font-black text-amber-900 flex items-center gap-1.5 text-[11px]">
                            <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                            <span>Foto OFF para Verificação de Moderador</span>
                          </span>
                          <span className="text-[10px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full">
                            De: {senderName}
                          </span>
                        </div>

                        {msg.hiddenBy && (
                          <p className="text-[11px] text-amber-800">
                            Sinalizada / ocultada por: <strong>{msg.hiddenBy}</strong>
                          </p>
                        )}

                        {msg.imageUrl && (
                          <div
                            onClick={() => setActiveZoomImage(msg.imageUrl)}
                            className="relative rounded-xl overflow-hidden border border-amber-300 bg-black/5 cursor-pointer group"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Foto em análise pela moderação"
                              className="max-w-full max-h-56 object-contain mx-auto"
                            />
                            <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              🔍 Toque para ampliar
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => hardDeleteMessage(msg.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir Definitivamente
                          </button>
                          <button
                            type="button"
                            onClick={() => approveHiddenPhoto(msg.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Liberar Foto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 rounded-xl max-w-[85%] sm:max-w-md text-[11px] bg-amber-50/90 border border-amber-300/90 text-amber-900 flex items-center gap-2 shadow-2xs">
                        <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          📷 Foto ocultada (OFF) aguardando verificação de um moderador.
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              if (msg.deleted) {
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1`}>
                    <div
                      className={`px-3 py-1.5 rounded-xl max-w-[82%] sm:max-w-md text-[11px] bg-white/75 border border-slate-300/80 text-slate-500 italic flex items-center gap-2 shadow-2xs`}
                    >
                      <span>🚫</span>
                      <span>
                        Mensagem apagada por <strong className="font-semibold not-italic">{msg.deletedBy || 'Moderação'}</strong>
                      </span>
                      {canModerate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            hardDeleteMessage(msg.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-[10px] font-bold not-italic cursor-pointer underline ml-1"
                          title="Excluir permanentemente do banco"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (isPending) {
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1.5`}>
                    <div className="p-3 rounded-2xl max-w-[88%] sm:max-w-md bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-sm space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-1.5">
                        <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                          <span>⏳</span> Aguardando Moderação ({senderName})
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-xs bg-amber-100/70 p-2 rounded-lg border border-amber-200">
                        {msg.text}
                      </p>
                      {canModerate ? (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => rejectMessage(msg.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Rejeitar
                          </button>
                          <button
                            type="button"
                            onClick={() => approveMessage(msg.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Aprovar
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-800 italic">
                          Em análise por um Conselheiro ou Administrador.
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              const hasReactions = msg.reactions && Object.values(msg.reactions).some((arr: any) => Array.isArray(arr) && arr.length > 0);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameAuthorAsPrev ? 'mt-0.5' : 'mt-2.5'} ${hasReactions ? 'mb-3' : ''} relative group/msg`}
                >
                  {/* Barra de Ações Compacta Flutuante (aparece ao tocar na mensagem ou passar o mouse no desktop) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-0.5 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-full px-1.5 py-0.5 shadow-md mb-1 z-20 transition-all duration-150 ${
                      isActionOpen
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none hidden sm:flex sm:group-hover/msg:opacity-100 sm:group-hover/msg:scale-100 sm:group-hover/msg:pointer-events-auto'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(msg);
                        setSelectedActionMsgId(null);
                      }}
                      className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                      title="Responder"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Responder</span>
                    </button>

                    {!isAi && msg.text && (
                      <button
                        type="button"
                        onClick={() => askAiAssistant(msg.text, msg.id, msg.displayName)}
                        className="text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                        title="Pedir para a IA responder"
                      >
                        <Bot className="w-3 h-3" />
                        <span>IA</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                      className="text-amber-600 hover:bg-amber-50 p-1 rounded-full text-[11px] transition flex items-center justify-center cursor-pointer"
                      title="Reagir com emoji"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {canDeleteThisMsg && (
                      <button
                        type="button"
                        onClick={() => deleteMessage(msg)}
                        className="text-red-600 hover:bg-red-50 px-2 py-1 rounded-full text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                        title={isPhotoMsg ? 'Ocultar foto (OFF) para verificação de moderador' : 'Apagar mensagem'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isPhotoMsg && <span>Apagar Foto</span>}
                      </button>
                    )}
                  </div>

                  {/* Seletor Flutuante de Reações */}
                  {activeReactionMsgId === msg.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="z-30 mb-1.5 px-2 py-1 bg-white border border-slate-200 rounded-full shadow-xl flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150"
                    >
                      {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className="text-base hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Balão da Mensagem estilo WhatsApp */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActionMsgId(prev => (prev === msg.id ? null : msg.id));
                    }}
                    className={`relative max-w-[84%] sm:max-w-md px-3 py-2 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.12)] cursor-pointer transition-shadow select-text ${
                      isMe
                        ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-emerald-200/70'
                        : isAi
                        ? 'bg-gradient-to-br from-purple-50 to-indigo-50 text-slate-900 rounded-tl-xs border border-purple-200/80'
                        : 'bg-white text-slate-900 rounded-tl-xs border border-white'
                    }`}
                  >
                    {/* Nome do autor no topo do balão (apenas quando não sou eu e mudou o autor) */}
                    {!isMe && !isSameAuthorAsPrev && (
                      <div className={`text-[11px] font-extrabold leading-tight mb-1 flex items-center gap-1 ${isAi ? 'text-purple-700' : getSenderColor(senderName)}`}>
                        <span>{isAi ? '🤖 IA Assistente do Bolão' : senderName}</span>
                      </div>
                    )}

                    {/* Citação de Resposta */}
                    {msg.replyTo && (
                      <div
                        className={`mb-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border-l-4 ${
                          isMe
                            ? 'bg-emerald-900/10 border-emerald-600 text-slate-800'
                            : 'bg-slate-100 border-teal-600 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-[10px] text-teal-800">
                          {formatFirstAndLastName(msg.replyTo.displayName)}
                        </div>
                        <div className="truncate opacity-85 text-[11px]">{msg.replyTo.text}</div>
                      </div>
                    )}

                    {/* Imagem com botão rápido de ocultar/deletar para revisão de moderador */}
                    {msg.imageUrl && (
                      <div className="mb-1.5 relative rounded-xl overflow-hidden border border-black/10 bg-black/5">
                        <img
                          src={msg.imageUrl}
                          alt="Comprovante / Foto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveZoomImage(msg.imageUrl);
                          }}
                          className="max-w-full max-h-60 object-contain mx-auto cursor-pointer transition hover:opacity-95"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(msg);
                          }}
                          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer backdrop-blur-xs"
                          title="Deletar/ocultar foto para verificação de moderador"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Deletar Foto</span>
                        </button>
                      </div>
                    )}

                    {/* Texto + Horário inline estilo WhatsApp */}
                    <div className="flex items-end justify-between gap-2 flex-wrap">
                      {msg.text ? (
                        <p className="text-[13px] sm:text-sm whitespace-pre-wrap leading-snug break-words text-slate-800">
                          {renderMessageTextWithMentions(msg.text, isMe)}
                        </p>
                      ) : <span />}

                      <span className="text-[10px] text-slate-500/90 font-medium tabular-nums ml-auto shrink-0 leading-none select-none flex items-center gap-0.5 pt-0.5">
                        {timeStr}
                        {isMe && <span className="text-emerald-600 font-bold text-[11px]">✓✓</span>}
                      </span>
                    </div>

                    {/* Pílula compacta de Reações ancorada na borda inferior do balão */}
                    {hasReactions && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute -bottom-2.5 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-0.5 bg-white border border-slate-200/90 rounded-full px-1.5 py-0.5 shadow-sm z-10`}
                      >
                        {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => {
                          if (!Array.isArray(uids) || uids.length === 0) return null;
                          const hasReacted = uids.includes(activeUser.uid);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className={`text-[11px] px-1 rounded-full flex items-center gap-0.5 font-bold cursor-pointer transition ${
                                hasReacted ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>{emoji}</span>
                              {uids.length > 1 && <span className="text-[10px] tabular-nums">{uids.length}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Citação de Resposta Fixa Acima do Input */}
        {replyingTo && (
          <div className="bg-emerald-50/95 border-t border-emerald-200 px-3.5 py-2 flex items-center justify-between text-xs text-emerald-950 animate-in slide-in-from-bottom-2 z-20">
            <div className="flex items-center gap-2 overflow-hidden border-l-3 border-emerald-600 pl-2">
              <div className="truncate">
                <span className="font-bold text-emerald-800 block text-[11px]">
                  Respondendo a {formatFirstAndLastName(replyingTo.displayName)}
                </span>
                <span className="text-slate-600 truncate block text-[11px]">
                  {replyingTo.text || '📷 Foto'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1.5 hover:bg-emerald-200/60 rounded-full text-slate-600 transition cursor-pointer shrink-0"
              title="Cancelar resposta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Menu de Escolha ao Clicar na Câmera: Tirar Foto ou Upload de Imagem */}
        {showCameraOptions && (
          <div className="bg-white border-t border-slate-200 px-3.5 py-2.5 shadow-lg z-30 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => {
                  setShowCameraOptions(false);
                  cameraCaptureInputRef.current?.click();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Tirar Foto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCameraOptions(false);
                  galleryUploadInputRef.current?.click();
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload de Imagem</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCameraOptions(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
              title="Fechar opções"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dropdown Autocomplete de @Menção */}
        {showMentionDropdown && availableMentions.length > 0 && (
          <div className="bg-white border-t border-slate-200 max-h-40 overflow-y-auto shadow-lg z-30 divide-y divide-slate-100">
            <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Mencionar Membro (@)</span>
              <span>Toque para inserir</span>
            </div>
            {availableMentions.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => insertMention(m.displayName)}
                className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 transition flex items-center justify-between text-xs cursor-pointer group"
              >
                <span className="font-bold text-slate-800 group-hover:text-emerald-700">
                  @{m.displayName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {m.role}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Sugestões Automáticas de Dúvida Financeira para Moderadores */}
        {showFinancialSuggestions && (
          <div className="bg-amber-50/95 border-t border-amber-200 px-3 py-2 z-20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 truncate">
                <span>💡 Resposta Rápida:</span>
                <span className="truncate font-normal text-amber-800">
                  {recentFinancialMsg
                    ? `${formatFirstAndLastName(recentFinancialMsg.displayName)}: "${recentFinancialMsg.text.slice(0, 32)}..."`
                    : 'Dúvida financeira'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDismissSmartSuggestions(true)}
                className="text-amber-700 hover:text-amber-950 p-0.5 rounded cursor-pointer"
                title="Ocultar sugestões"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {quickReplyOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewMessage(opt.text);
                    if (recentFinancialMsg) {
                      setReplyingTo(recentFinancialMsg);
                    }
                  }}
                  className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-semibold px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  {opt.label}
                </button>
              ))}

              {recentFinancialMsg && (
                <button
                  type="button"
                  onClick={() => {
                    askAiAssistant(recentFinancialMsg.text, recentFinancialMsg.id, recentFinancialMsg.displayName);
                    setDismissSmartSuggestions(true);
                  }}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Bot className="w-3 h-3" />
                  <span>Responder c/ IA</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Banner de Gravação de Voz */}
        {isListening && (
          <div className="bg-red-600 text-white px-3.5 py-2 flex items-center justify-between text-xs animate-pulse z-30">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
              <span>Ouvindo sua voz... Fale para transcrever</span>
            </div>
            <button
              type="button"
              onClick={stopVoiceRecognitionSafely}
              className="bg-white text-red-700 font-bold px-2.5 py-1 rounded-full text-[11px] cursor-pointer"
            >
              Concluir
            </button>
          </div>
        )}

        {/* Barra Inferior de Digitação (Ergonômica e Limpa no Celular) */}
        {isChatLocked && !canModerate ? (
          <div className="p-3 bg-amber-50 border-t border-amber-200 text-center text-xs text-amber-900 font-semibold flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-700" />
            <span>O chat está temporariamente trancado pela moderação.</span>
          </div>
        ) : (
          <div className="bg-[#f0f2f5] border-t border-slate-200/80 px-2.5 py-2 shrink-0">
            {isChatLocked && canModerate && (
              <div className="mb-1.5 px-2.5 py-1 bg-amber-100/80 border border-amber-300/80 rounded-lg text-[10px] text-amber-900 font-semibold flex items-center gap-1.5">
                <Lock className="w-3 h-3 shrink-0" />
                <span>Chat trancado para participantes. Você pode enviar comunicados como moderador.</span>
              </div>
            )}

            <form onSubmit={sendMessage} className="flex items-center gap-1.5 w-full min-w-0">
              {/* Input oculto para Tirar Foto diretamente pela Câmera */}
              <input
                ref={cameraCaptureInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Input oculto para Upload de Imagem da Galeria/Arquivos */}
              <input
                ref={galleryUploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Container Cápsula Unificado de Mensagem */}
              <div className="flex-1 min-w-0 flex items-center bg-white rounded-full border border-slate-200/90 px-1.5 py-1 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                <button
                  type="button"
                  onClick={() => setShowCameraOptions(prev => !prev)}
                  className={`cursor-pointer w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition shrink-0 ${
                    showCameraOptions
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                  }`}
                  title="Tirar foto ou enviar imagem"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewMessage(prev => prev + '@');
                    setShowMentionDropdown(true);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition cursor-pointer shrink-0"
                  title="Mencionar participante (@)"
                >
                  <AtSign className="w-4 h-4" />
                </button>

                <input
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  className="flex-1 min-w-0 w-full bg-transparent px-1.5 py-1 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  placeholder={
                    isListening
                      ? 'Ouvindo seu áudio...'
                      : isChatLocked
                      ? 'Digite um comunicado...'
                      : 'Mensagem...'
                  }
                />

                {/* Botão de Microfone embutido dentro da cápsula */}
                <button
                  type="button"
                  onClick={startVoiceToText}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-300'
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                  }`}
                  title={isListening ? 'Parar gravação de voz' : 'Gravar mensagem por voz'}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Botão Consultar IA embutido na cápsula */}
                <button
                  type="button"
                  onClick={() => {
                    if (newMessage.trim()) {
                      const qText = newMessage.trim();
                      stopVoiceRecognitionSafely();
                      setNewMessage('');
                      askAiAssistant(qText);
                    } else {
                      addToast('Digite sua dúvida primeiro (ex: Qual é o valor da cota e o PIX?) e toque em IA.', 'info');
                    }
                  }}
                  className="h-7 px-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer shrink-0 ml-0.5"
                  title="Perguntar para a IA do Bolão"
                >
                  <Bot className="w-3 h-3" />
                  <span>IA</span>
                </button>
              </div>

              {/* Botão Enviar Fixo e Sempre Visível na Lateral Direita */}
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition shrink-0 ${
                  newMessage.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white cursor-pointer'
                    : 'bg-emerald-600/50 text-white/80 cursor-not-allowed'
                }`}
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4 translate-x-0.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal de Zoom da Imagem */}
      {activeZoomImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setActiveZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveZoomImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 text-white font-bold px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Fechar
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
