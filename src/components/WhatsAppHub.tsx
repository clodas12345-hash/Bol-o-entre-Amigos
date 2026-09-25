import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { formatFirstAndLastName, normalizeBrazilianPhoneDigits } from '../lib/formatters';
import { calculateGamePrize } from '../lib/prizes';
import { DEFAULT_PIX_CONFIG } from '../lib/pix';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';

interface WhatsAppHubProps {
  onClose?: () => void;
}

export default function WhatsAppHub({ onClose }: WhatsAppHubProps) {
  const { setIsQuotaExceeded } = usePool();
  const [activeTemplate, setActiveTemplate] = useState<string>('pix_reminder');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any | null>(null);
  const [latestPoll, setLatestPoll] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedMemberPhone, setSelectedMemberPhone] = useState<string>('');

  const { addToast } = useToast();

  useEffect(() => {
    // Carrega todos os dados necessários uma vez
    const loadAllData = async () => {
      try {
        const [usersSnap, membersSnap, gamesSnap, resultSnap, pollSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'members')),
          getDocs(collection(db, 'games')),
          getDocs(query(collection(db, 'lotofacil_results'), orderBy('createdAt', 'desc'), limit(1))),
          getDocs(query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(1)))
        ]);

        // Processa Membros
        const uList: any[] = usersSnap.docs.map(d => ({ id: d.id, quotas: 1, ...d.data() }));
        const mList: any[] = membersSnap.docs.map(d => ({ id: d.id, quotas: 1, ...d.data() }));
        const combined = [...uList];
        for (const m of mList) {
          if (!combined.some(u => u.id === m.id || (u.email && m.email && u.email === m.email))) {
            combined.push(m);
          }
        }
        setMembers(combined);

        // Processa outros dados
        setGames(gamesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        if (!resultSnap.empty) setLatestResult(resultSnap.docs[0].data());
        if (!pollSnap.empty) setLatestPoll({ id: pollSnap.docs[0].id, ...pollSnap.docs[0].data() });

      } catch (e) {
        console.error('WhatsAppHub load error:', e);
        if (isQuotaError(e)) setIsQuotaExceeded(true);
      }
    };

    loadAllData();
    // Removendo onSnapshots para economizar cota.
  }, []);

  // Cálculos do Bolão
  const totalPaidMembers = members.filter(m => m.paymentStatus === 'Pago');
  const totalPaidQuotas = totalPaidMembers.reduce((sum, m) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);
  const totalArrecadado = totalPaidQuotas * 20.00;

  const drawnNumbers: number[] = Array.isArray(latestResult?.numbers)
    ? latestResult.numbers.map((n: any) => Number(n))
    : [];

  const prizeSummary = games.map(g => {
    const nums = Array.isArray(g.numbers) ? g.numbers.map((n: any) => Number(n)) : [];
    return calculateGamePrize(nums, drawnNumbers, g.customPrize);
  });

  const totalPrize = prizeSummary.reduce((sum, p) => sum + p.prizeAmount, 0);
  const hits11 = prizeSummary.filter(p => p.hits === 11).length;
  const hits12 = prizeSummary.filter(p => p.hits === 12).length;
  const hits13 = prizeSummary.filter(p => p.hits === 13).length;
  const hits14 = prizeSummary.filter(p => p.hits === 14).length;
  const hits15 = prizeSummary.filter(p => p.hits === 15).length;
  const prizePerQuota = totalPaidQuotas > 0 ? totalPrize / totalPaidQuotas : 0;

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const appUrl = window.location.origin;
  const pixKey = DEFAULT_PIX_CONFIG.pixKey; // 11953292570

  // Gerador dinâmico de texto por template
  const getGeneratedMessage = () => {
    switch (activeTemplate) {
      case 'pix_reminder':
        return `🍀 *BOLÃO DA LOTOFÁCIL - LEMBRETE DE CONTRIBUIÇÃO* 🍀
📅 *Mês de Referência:* ${currentMonth.toUpperCase()}

Olá a todos do grupo! Passando para lembrar da contribuição deste mês para o nosso bolão.

💰 *Valor por 1 Cota:* R$ 20,00
*(Se você possui mais cotas, o valor é proporcional)*

📱 *Chave PIX (Telefone):* ${pixKey}
👤 *Titular:* Bolão da Lotofácil

📲 *Acesse o aplicativo para registrar comprovantes e acompanhar os jogos:*
${appUrl}

Vamos juntos rumo aos 15 pontos! 🍀🤞`;

      case 'games_registered':
        return `🎰 *APOSTAS REGISTRADAS NO BOLÃO!* 🎰
${latestResult?.concurso ? `📌 *Concurso Alvo:* #${latestResult.concurso + 1}` : ''}
🎟️ *Total de Jogos Registrados:* ${games.length} apostas
👥 *Cotas Participantes:* ${totalPaidQuotas} cotas ativas

Todos os volantes e fechamentos matemáticos já foram gerados e cadastrados no nosso sistema.

📲 *Confira todos os bilhetes em tempo real:*
${appUrl}

Boa sorte a todos nós! 🍀💰✨`;

      case 'result_award':
        return `🏆 *RESULTADO OFICIAL DA LOTOFÁCIL* 🏆
${latestResult?.concurso ? `📌 *Concurso:* #${latestResult.concurso}` : ''}
🎯 *Dezenas Sorteadas:*
${drawnNumbers.map(n => String(n).padStart(2, '0')).join(' - ')}

📊 *Desempenho dos Nossos Jogos:*
${hits15 > 0 ? `🔥 *15 PONTOS:* ${hits15} aposta(s)!\n` : ''}${hits14 > 0 ? `✨ *14 PONTOS:* ${hits14} aposta(s)!\n` : ''}${hits13 > 0 ? `🎯 *13 Pontos:* ${hits13} aposta(s)\n` : ''}${hits12 > 0 ? `✅ *12 Pontos:* ${hits12} aposta(s)\n` : ''}${hits11 > 0 ? `👍 *11 Pontos:* ${hits11} aposta(s)\n` : ''}
💰 *Premiação Total do Bolão:* R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
🎟️ *Valor por 1 Cota:* R$ ${prizePerQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

📲 *Confira o espelho completo das apostas:*
${appUrl}`;

      case 'financial_report':
        return `📊 *PRESTAÇÃO DE CONTAS - BOLÃO LOTOFÁCIL* 📊
📅 *Período:* ${currentMonth.toUpperCase()}

👥 *Total de Membros:* ${members.length}
🎟️ *Cotas Adimplentes:* ${totalPaidQuotas}
💵 *Arrecadação do Mês:* R$ ${totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
🏆 *Prêmios Apurados:* R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Transparência total para todos os participantes!
Acesse o demonstrativo individual no app:
${appUrl}`;

      case 'poll_invite':
        return `🗳️ *VOTAÇÃO ABERTA NO GRUPO DO BOLÃO!* 🗳️

${latestPoll ? `❓ *Pergunta:* ${latestPoll.title}\n${latestPoll.options?.map((opt: any, i: number) => `   ${i + 1}️⃣ ${opt.text}`).join('\n')}` : 'Temos uma nova decisão em aberto para definir as estratégias do próximo concurso!'}

Sua opinião é fundamental! Clique no link abaixo para votar:
${appUrl}

Participe! 🤝🍀`;

      case 'custom':
        return customMessage || `Olá pessoal! Comunicado importante do Bolão da Lotofácil: ...\n\nChave PIX: ${pixKey}\n${appUrl}`;

      default:
        return '';
    }
  };

  const messageToSend = getGeneratedMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageToSend);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    addToast('Mensagem copiada para a área de transferência!', 'success');
  };

  const handleShareGeneralGroup = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(messageToSend)}`;
    window.open(url, '_blank');
  };

  const handleSendToSpecificMember = (phone: string) => {
    const normalized = normalizeBrazilianPhoneDigits(phone);
    if (!normalized) {
      addToast('Telefone inválido ou não cadastrado.', 'error');
      return;
    }
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(messageToSend)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Topo do Modal/Painel */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white p-4 sm:p-5">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Comunicação & Transparência
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center gap-2">
              <span>📢</span> Central de Mensagens do WhatsApp
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Envie comunicados oficiais, lembretes de PIX e resultados com 1 clique para o grupo ou membros
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl font-bold p-1 cursor-pointer transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Seletor de Modelos Prontos */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
            Escolha o Tipo de Comunicado:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTemplate('pix_reminder')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTemplate === 'pix_reminder'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-base">💰</span>
              <span>Lembrete de PIX</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplate('games_registered')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTemplate === 'games_registered'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-base">🎰</span>
              <span>Apostas Registradas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplate('result_award')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTemplate === 'result_award'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-base">🏆</span>
              <span>Resultado Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplate('financial_report')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTemplate === 'financial_report'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-base">📊</span>
              <span>Prestação de Contas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplate('poll_invite')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTemplate === 'poll_invite'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-base">🗳️</span>
              <span>Chamada para Voto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplate('custom')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTemplate === 'custom'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-base">✍️</span>
              <span>Texto Livre</span>
            </button>
          </div>
        </div>

        {/* Editor de Texto Livre se custom */}
        {activeTemplate === 'custom' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">Digite sua Mensagem Personalizada:</label>
            <textarea
              rows={4}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Digite seu comunicado personalizado aqui..."
              className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:outline-emerald-600"
            />
          </div>
        )}

        {/* Prévia do Balão do WhatsApp */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
              <span>💬</span> Prévia da Mensagem (Formatação WhatsApp):
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Chave PIX: {pixKey}</span>
          </div>

          <div className="bg-[#e5ddd5] p-3 sm:p-4 rounded-2xl border border-gray-300 shadow-inner">
            <div className="bg-white rounded-xl p-3.5 shadow-sm max-w-lg border-l-4 border-emerald-500 whitespace-pre-wrap font-sans text-xs sm:text-sm text-gray-800 leading-relaxed">
              {messageToSend}
            </div>
          </div>
        </div>

        {/* Ações de Compartilhamento */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copiado!' : 'Copiar Mensagem'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareGeneralGroup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📲</span>
              <span>Compartilhar no Grupo do WhatsApp</span>
            </button>
          </div>

          {/* Envio Individual Rápido */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              value={selectedMemberPhone}
              onChange={e => {
                setSelectedMemberPhone(e.target.value);
                if (e.target.value) {
                  handleSendToSpecificMember(e.target.value);
                }
              }}
              className="border border-gray-300 rounded-lg p-1.5 text-xs bg-white text-gray-700 font-medium focus:outline-emerald-600 flex-1 sm:w-48"
            >
              <option value="">👤 Enviar para membro específico...</option>
              {members.filter(m => m.phone).map(m => (
                <option key={m.id} value={m.phone}>
                  {formatFirstAndLastName(m.displayName || m.email)} ({m.phone})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
