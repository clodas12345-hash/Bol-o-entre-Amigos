import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { auth, db, isQuotaError } from '../lib/firebase';
import { formatFirstAndLastName } from '../lib/formatters';
import PageHeader from './PageHeader';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { getIsAdmin } from '../lib/authHelpers';
import { usePermissions } from '../lib/PermissionsContext';
import { containsBadWords } from '../lib/profanityFilter';

export default function Chat() {
  const { setIsQuotaExceeded, activePool } = usePool();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [lockedByInfo, setLockedByInfo] = useState<string | null>(null);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [aiLearnings, setAiLearnings] = useState<any[]>([]);
  const [autoAiEnabled, setAutoAiEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bolao_auto_ai_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const processedMsgIdsRef = useRef<Set<string>>(new Set());

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast('Seu dispositivo ou navegador não suporta a escuta nativa de voz. Digite a mensagem manualmente.', 'error');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { console.warn(e); }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        addToast('🎙️ Ouvindo seu áudio... Fale normalmente para converter em mensagem de texto!', 'info');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setNewMessage(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Erro no áudio de voz:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          addToast('Não foi possível compreender o áudio. Tente falar novamente mais perto do microfone.', 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      setIsListening(false);
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
  }, [messages]);

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
        !msg.isAiBot &&
        msg.uid !== 'bot_ai_assistant' &&
        !processedMsgIdsRef.current.has(msg.id)
      ) {
        // Verifica se já existe resposta da IA para esta mensagem
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
          // Aguarda 1.5s para dar tempo de renderizar e responder
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

  const deleteMessage = async (msgId: string) => {
    try {
      const currentUser = getCurrentUser();
      const moderatorTitle = isAdmin ? 'Administrador' : (isCounselor ? 'Conselheiro' : 'Participante');
      const moderatorName = currentUser.displayName || 'Moderador';
      const deletedByFormatted = `${formatFirstAndLastName(moderatorName)} (${moderatorTitle})`;

      await updateDoc(doc(db, 'messages', msgId), {
        deleted: true,
        deletedBy: deletedByFormatted,
        deletedAt: serverTimestamp()
      });
      addToast('Mensagem apagada com sucesso!', 'success');
    } catch (err) {
      console.warn('Erro ao atualizar mensagem, executando exclusao direta:', err);
      try {
        await deleteDoc(doc(db, 'messages', msgId));
        addToast('Mensagem apagada com sucesso!', 'success');
      } catch (deleteErr) {
        console.error('Erro ao apagar mensagem:', deleteErr);
        if (isQuotaError(deleteErr)) setIsQuotaExceeded(true);
        addToast('Erro ao apagar mensagem no chat.', 'error');
      }
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
      addToast('Mensagem rejeitada e removida.', 'info');
    } catch (err) {
      console.error('Erro ao rejeitar mensagem:', err);
      addToast('Erro ao rejeitar mensagem.', 'error');
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
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        status: 'approved'
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
            className={`font-black px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs inline-block my-0.5 mx-0.5 shadow-2xs ${
              isMe 
                ? 'bg-white/30 text-white border border-white/40' 
                : 'bg-blue-100 text-blue-900 border border-blue-200 font-extrabold'
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
    if (!newMessage.trim()) return;
    if (isChatLocked && !canModerate) {
      addToast('O chat está travado pela moderação. Apenas Administradores e Conselheiros podem enviar mensagens.', 'error');
      return;
    }

    setIsSending(true);
    const currentUser = getCurrentUser();
    const badWordsCheck = containsBadWords(newMessage.trim());

    // Se o usuário não for moderador e contiver palavras de baixo calão, necessita aprovação
    const needsApproval = !canModerate && badWordsCheck.hasBadWords;
    const msgStatus = needsApproval ? 'pending_approval' : 'approved';

    const replyData = replyingTo ? {
      id: replyingTo.id,
      displayName: replyingTo.displayName,
      text: replyingTo.text || (replyingTo.imageUrl ? '📷 Foto' : '')
    } : null;

    const sentText = newMessage.trim();

    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        text: sentText,
        imageUrl: null,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        status: msgStatus,
        flaggedWords: badWordsCheck.foundWords || [],
        replyTo: replyData
      });

      // Aprendizado Contínuo da IA: Se um Administrador ou Conselheiro enviou a mensagem, a IA grava o aprendizado
      if (canModerate && sentText.length > 3) {
        try {
          await addDoc(collection(db, 'ai_learnings'), {
            topic: sentText.slice(0, 80),
            question: replyingTo?.text || 'Instrução do Administrador/Conselheiro',
            answer: sentText,
            author: `${currentUser.displayName} (${isAdmin ? 'Administrador' : 'Conselheiro'})`,
            createdAt: serverTimestamp()
          });
        } catch (learnErr) {
          console.warn('Erro ao gravar aprendizado na IA:', learnErr);
        }
      }

      setNewMessage('');
      setReplyingTo(null);

      if (needsApproval) {
        addToast('⚠️ Sua mensagem contém termos de baixo calão e precisa de autorização de um Conselheiro ou Administrador para ser publicada.', 'info');
      } else {
        addToast('Mensagem enviada!', 'success');

        // Se a mensagem contiver @IA, @Assistente ou for uma dúvida explícita
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
      if (isQuotaError(err)) setIsQuotaExceeded(true);
      addToast('Erro ao enviar mensagem.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const pendingApprovalCount = messages.filter(m => m.status === 'pending_approval').length;

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <PageHeader
        title="Chat do Grupo do Bolão"
        subtitle="Conversas, avisos de sorteio e envio de comprovantes em tempo real"
        icon="💬"
      />

      <div className="flex flex-col h-[calc(100vh-190px)] border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
        {/* Barra superior de status do chat */}
        <div className="bg-gray-100 px-3 sm:px-4 py-2 border-b flex justify-between items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full ${isChatLocked ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="text-xs font-bold text-gray-800">
              {isChatLocked 
                ? `🔒 Chat Fechado ${lockedByInfo ? `por ${lockedByInfo}` : '(Modo Ordem)'}` 
                : '🟢 Chat Aberto'}
            </span>

            {/* Badge de Aprendizado Contínuo da IA */}
            <span 
              className="text-[10px] sm:text-xs bg-purple-50 text-purple-800 border border-purple-200 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs"
              title="Respostas do Administrador e Conselheiros registradas que alimentam a IA"
            >
              🧠 {aiLearnings.length} Resposta(s) Aprendida(s)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleAutoAi}
              className={`text-xs px-2.5 py-1 rounded-lg font-extrabold transition cursor-pointer flex items-center gap-1 shadow-2xs border ${
                autoAiEnabled
                  ? 'bg-purple-700 hover:bg-purple-800 text-white border-purple-800'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'
              }`}
              title="Ligar/Desligar resposta automática da IA para perguntas em tempo real"
            >
              <span>{autoAiEnabled ? '🤖 IA Automática ON' : '⏸️ IA Automática OFF'}</span>
            </button>

            {canModerate && (
              <button
                onClick={toggleChatLock}
                className={`text-xs px-2.5 py-1 rounded-lg font-black transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                  isChatLocked 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={isChatLocked ? 'Liberar chat para todos os participantes' : 'Travar chat (apenas moderadores poderão postar)'}
              >
                {isChatLocked ? '🔓 Destravar' : '🔒 Travar'}
              </button>
            )}
          </div>
        </div>

        {/* Alerta de Mensagens Pendentes para Moderadores */}
        {canModerate && pendingApprovalCount > 0 && (
          <div className="bg-amber-500 text-white text-xs px-4 py-2 font-bold flex items-center justify-between border-b border-amber-600 shadow-2xs animate-pulse">
            <span className="flex items-center gap-1.5">
              <span>⚠️</span> {pendingApprovalCount} mensagem(ns) com linguagem sensível aguardando sua análise e aprovação abaixo.
            </span>
          </div>
        )}

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
              Nenhuma mensagem ainda. Seja o primeiro a mandar um olá ou enviar um comprovante!
            </div>
          ) : (
            messages.map(msg => {
              const activeUser = getCurrentUser();
              const isMe = msg.uid === activeUser.uid || (msg.displayName && activeUser.displayName && msg.displayName === activeUser.displayName);
              const canDeleteThisMsg = canModerate || isMe;
              const isPending = msg.status === 'pending_approval';

              // Se a mensagem está pendente e o usuário não for moderador nem autor, oculta a mensagem
              if (isPending && !canModerate && !isMe) {
                return null;
              }

              if (msg.deleted) {
                return (
                  <div key={msg.id} className={`flex flex-col group/msg ${isMe ? 'items-end' : 'items-start'} my-1.5`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1 flex-wrap">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {formatFirstAndLastName(msg.displayName)}
                      </span>
                      <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                        <span>🚫</span> Mensagem apagada por <strong className="font-extrabold">{msg.deletedBy || 'Moderação'}</strong>
                      </span>
                      {canModerate && (
                        <button
                          onClick={() => hardDeleteMessage(msg.id)}
                          className="text-red-600 hover:text-red-800 text-[10px] font-bold cursor-pointer hover:underline"
                          title="Excluir permanentemente do banco de dados"
                        >
                          [Remover Definitivo]
                        </button>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] sm:max-w-md shadow-2xs text-xs sm:text-sm bg-gray-100 border border-gray-300 text-gray-500 italic relative ${
                        isMe ? 'rounded-tr-none' : 'rounded-tl-none'
                      }`}
                    >
                      {msg.text && (
                        <p className="whitespace-pre-wrap leading-relaxed line-through decoration-red-500 decoration-2">
                          {msg.text}
                        </p>
                      )}
                      {msg.imageUrl && (
                        <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-300">
                          <img
                            src={msg.imageUrl}
                            alt="Foto Apagada"
                            className="max-w-full max-h-40 object-contain bg-gray-200 opacity-40 filter grayscale"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-extrabold text-xs">
                            📷 [Imagem Apagada]
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col group/msg relative ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 px-1 flex-wrap">
                    <span className="text-[11px] text-gray-500 font-bold">
                      {formatFirstAndLastName(msg.displayName)}
                    </span>

                    {/* Botões do WhatsApp (Responder, Reagir, Apagar) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                        title="Responder esta mensagem"
                      >
                        <span>↩️</span>
                        <span>Responder</span>
                      </button>

                      {!msg.isAiBot && msg.text && (
                        <button
                          onClick={() => askAiAssistant(msg.text, msg.id, msg.displayName)}
                          className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                          title="Pedir para a IA responder essa dúvida com base nas regras do grupo"
                        >
                          <span>🤖 IA Responde</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                        title="Reagir com emoji"
                      >
                        <span>😀</span>
                      </button>

                      {canDeleteThisMsg && !isPending && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition flex items-center gap-0.5 cursor-pointer"
                          title="Excluir mensagem"
                        >
                          <span>🗑️</span>
                          <span>Apagar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seletor Flutuante de Reações estilo WhatsApp */}
                  {activeReactionMsgId === msg.id && (
                    <div className="z-20 my-1 p-1.5 bg-white border border-gray-200 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in duration-150">
                      {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Card de mensagem pendente de aprovação */}
                  {isPending ? (
                    <div className="p-3 rounded-2xl max-w-[90%] sm:max-w-md bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-1.5">
                        <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                          <span>⏳</span> Aguardando Autorização do Moderador
                        </span>
                        {msg.flaggedWords && msg.flaggedWords.length > 0 && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                            Linguagem detectada
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed font-mono text-xs bg-amber-100/60 p-2 rounded-lg border border-amber-200">{msg.text}</p>
                      
                      {canModerate ? (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200">
                          <button
                            onClick={() => rejectMessage(msg.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <span>❌</span> Rejeitar
                          </button>
                          <button
                            onClick={() => approveMessage(msg.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <span>✅</span> Autorizar Publicação
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-800 italic">
                          Sua mensagem contém termos sensíveis e está em análise por um Conselheiro ou Administrador.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] sm:max-w-md shadow-2xs text-xs sm:text-sm relative group/bubble ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}
                    >
                      {/* Citação de Resposta estilo WhatsApp */}
                      {msg.replyTo && (
                        <div className={`mb-2 p-2 rounded-lg text-xs border-l-4 ${
                          isMe 
                            ? 'bg-blue-700/60 border-amber-300 text-blue-50' 
                            : 'bg-gray-100 border-blue-600 text-gray-700'
                        }`}>
                          <div className={`font-bold text-[11px] ${isMe ? 'text-amber-200' : 'text-blue-700'}`}>
                            ↩️ {formatFirstAndLastName(msg.replyTo.displayName)}
                          </div>
                          <div className="truncate italic text-[11px] opacity-90">{msg.replyTo.text}</div>
                        </div>
                      )}

                      {/* Texto da mensagem com realce de @Menções */}
                      {msg.text && (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {renderMessageTextWithMentions(msg.text, isMe)}
                        </p>
                      )}

                      {/* Imagem */}
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

                      {/* Reações de Emojis estilo WhatsApp */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-2 pt-1 border-t ${isMe ? 'border-white/20' : 'border-gray-100'}`}>
                          {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => {
                            if (!Array.isArray(uids) || uids.length === 0) return null;
                            const hasReacted = uids.includes(activeUser.uid);
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className={`text-[11px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 font-bold cursor-pointer transition ${
                                  hasReacted
                                    ? (isMe ? 'bg-amber-300 text-blue-950 border-white' : 'bg-blue-100 text-blue-800 border-blue-300')
                                    : (isMe ? 'bg-blue-700/60 text-white border-white/20' : 'bg-gray-100 text-gray-700 border-gray-200')
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{uids.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Citação de Resposta Fixa no Teclado */}
        {replyingTo && (
          <div className="bg-blue-50 border-t border-blue-200 px-3 py-2 flex items-center justify-between text-xs text-blue-900 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-base">↩️</span>
              <div className="truncate">
                <span className="font-bold text-blue-900 block">Respondendo para {formatFirstAndLastName(replyingTo.displayName)}</span>
                <span className="text-blue-700 italic truncate block text-[11px]">
                  {replyingTo.text || '📷 Foto'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-blue-200 rounded-full text-blue-800 font-bold transition cursor-pointer"
              title="Cancelar resposta"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dropdown Autocomplete de @Menção estilo WhatsApp */}
        {showMentionDropdown && availableMentions.length > 0 && (
          <div className="bg-white border-t border-b border-blue-200 max-h-40 overflow-y-auto shadow-lg z-30 divide-y divide-gray-100 animate-in fade-in duration-100">
            <div className="px-3 py-1 bg-blue-50 text-[10px] font-black text-blue-800 uppercase tracking-wider flex items-center justify-between">
              <span>Mencionar Membro do Bolão (@)</span>
              <span>Selecione para inserir</span>
            </div>
            {availableMentions.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => insertMention(m.displayName)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition flex items-center justify-between text-xs cursor-pointer group"
              >
                <span className="font-bold text-gray-800 group-hover:text-blue-700">
                  @{m.displayName}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold group-hover:bg-blue-100 group-hover:text-blue-800">
                  {m.role}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Sugestões Automáticas de Dúvida Financeira para Administrador / Conselheiro */}
        {showFinancialSuggestions && (
          <div className="bg-amber-50 border-t border-b border-amber-200 p-2 sm:p-2.5 z-20 animate-in slide-in-from-bottom-2 transition-all">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-950">
                <span className="bg-amber-200 text-amber-900 text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-black uppercase">💡 Resposta Automática Rápida</span>
                <span className="truncate max-w-[200px] sm:max-w-md">
                  {recentFinancialMsg 
                    ? `Dúvida de ${formatFirstAndLastName(recentFinancialMsg.displayName)}: "${recentFinancialMsg.text.slice(0, 35)}..."` 
                    : 'Palavra-chave financeira detectada:'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDismissSmartSuggestions(true)}
                className="text-amber-800 hover:text-amber-950 font-bold text-xs p-1 rounded hover:bg-amber-100 cursor-pointer"
                title="Ocultar sugestões"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
                  className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-2xs whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] text-amber-700 font-bold">→ Usar</span>
                </button>
              ))}

              {recentFinancialMsg && (
                <button
                  type="button"
                  onClick={() => {
                    askAiAssistant(recentFinancialMsg.text, recentFinancialMsg.id, recentFinancialMsg.displayName);
                    setDismissSmartSuggestions(true);
                  }}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-black px-2.5 py-1.5 rounded-lg text-xs shadow-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>🤖 Responder com IA</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Banner de Gravação e Transcrição Ativa */}
        {isListening && (
          <div className="bg-red-500 text-white px-3 py-2 flex items-center justify-between text-xs animate-pulse z-30 shadow-md">
            <div className="flex items-center gap-2 font-black">
              <span className="w-3 h-3 bg-white rounded-full animate-ping" />
              <span>🎙️ Escutando seu áudio... Fale naturalmente para transcrever em mensagem de texto!</span>
            </div>
            <button
              type="button"
              onClick={startVoiceToText}
              className="bg-white text-red-700 hover:bg-red-50 font-black px-2.5 py-1 rounded-md text-[11px] cursor-pointer shadow-2xs"
            >
              Concluir ⏹️
            </button>
          </div>
        )}

        {/* Input de Envio */}
        {isChatLocked && !canModerate ? (
          <div className="p-3.5 bg-amber-50 border-t border-amber-200 text-center text-xs text-amber-900 font-bold flex items-center justify-center gap-2">
            <span>🔒</span> O chat está temporariamente travado pela moderação para manter a ordem do grupo.
          </div>
        ) : (
          <div className="bg-white border-t border-gray-200 p-2 sm:p-3">
            {isChatLocked && canModerate && (
              <div className="mb-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-bold flex items-center justify-between">
                <span>🔒 Chat travado para participantes. Você tem permissão de moderação para enviar mensagens.</span>
              </div>
            )}
            <form onSubmit={sendMessage} className="flex gap-1.5 sm:gap-2 items-center">
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

              {/* Botão para Transcrever Áudio de Voz em Texto */}
              <button
                type="button"
                onClick={startVoiceToText}
                className={`px-2.5 py-2.5 rounded-xl transition border font-black text-xs cursor-pointer flex items-center gap-1 shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white border-red-700 animate-bounce ring-2 ring-red-400 shadow-md'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
                title={isListening ? "Parar escuta de áudio" : "Ouvir seu áudio e converter em mensagem de texto"}
              >
                <span>🎙️</span>
                <span className="hidden xs:inline text-[11px]">{isListening ? 'Gravando...' : 'Voz'}</span>
              </button>

              {/* Botão rápido para inserir @ */}
              <button
                type="button"
                onClick={() => {
                  setNewMessage(prev => prev + '@');
                  setShowMentionDropdown(true);
                }}
                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition border border-blue-200 font-black text-xs cursor-pointer"
                title="Mencionar membro (@)"
              >
                @
              </button>

              {/* Botão rápido para consultar a IA Assistente */}
              <button
                type="button"
                onClick={() => {
                  if (newMessage.trim()) {
                    askAiAssistant(newMessage.trim());
                    setNewMessage('');
                  } else {
                    addToast('Digite sua dúvida na caixa de texto primeiro (ex: Quanto é o valor da cota e o PIX?)', 'info');
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-2 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1 cursor-pointer"
                title="Tirar dúvida diretamente com a IA do Bolão"
              >
                <span>🤖 IA</span>
              </button>

              <input
                value={newMessage}
                onChange={handleInputChange}
                className="flex-1 border border-gray-300 bg-white p-2.5 text-xs sm:text-sm rounded-xl focus:outline-blue-500"
                placeholder={
                  isListening 
                    ? "Fale no microfone... Transcrevendo áudio em texto..." 
                    : (isChatLocked ? "Chat travado. Digite seu comunicado..." : "Digite uma mensagem ou use @ para mencionar...")
                }
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
          </div>
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
