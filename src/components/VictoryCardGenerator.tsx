import { useState } from 'react';
import PageHeader from './PageHeader';
import { useToast } from './NotificationManager';

export default function VictoryCardGenerator() {
  const [concurso, setConcurso] = useState('3340');
  const [premioValor, setPremioValor] = useState('1.500,00');
  const [acertos, setAcertos] = useState('14');
  const [mensagemExtra, setMensagemExtra] = useState('Parabéns a todos os cotistas do bolão! Vamos rumo aos 15 pontos!');
  const [copied, setCopied] = useState(false);

  const { addToast } = useToast();

  const cardText = `🏆 *COMUNICADO OFICIAL DE PREMIAÇÃO!* 🏆
🍀 *BOLÃO DA LOTOFÁCIL*
📌 *Concurso:* #${concurso}
🎯 *Acertos:* Fizemos ${acertos} PONTOS!
💰 *Prêmio Conquistado:* R$ ${premioValor}

"${mensagemExtra}"

📲 Participe você também do nosso bolão oficial!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cardText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    addToast('Card de vitória copiado para o WhatsApp!', 'success');
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(cardText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Gerador de Card de Premiação"
        subtitle="Crie mensagens comemorativas profissionais para postar no grupo do WhatsApp"
        icon="🎨"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Formulário de Configuração */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">⚙️ Personalizar Comunicado</h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Número do Concurso</label>
            <input
              type="text"
              value={concurso}
              onChange={e => setConcurso(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-xs focus:outline-emerald-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Faixa de Acertos</label>
            <select
              value={acertos}
              onChange={e => setAcertos(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-xs focus:outline-emerald-600 font-semibold bg-white"
            >
              <option value="15">🔥 15 PONTOS (PRÊMIO MÁXIMO)</option>
              <option value="14">✨ 14 PONTOS</option>
              <option value="13">🎯 13 PONTOS</option>
              <option value="12">✅ 12 PONTOS</option>
              <option value="11">👍 11 PONTOS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Valor do Prêmio (R$)</label>
            <input
              type="text"
              value={premioValor}
              onChange={e => setPremioValor(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-xs focus:outline-emerald-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mensagem Comemorativa</label>
            <textarea
              rows={3}
              value={mensagemExtra}
              onChange={e => setMensagemExtra(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-xs focus:outline-emerald-600"
            />
          </div>
        </div>

        {/* Prévia do Card Estilo WhatsApp / Imagem */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">📱 Prévia do Card para WhatsApp</h3>
            <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white p-5 rounded-2xl shadow-xl border border-emerald-500/30 space-y-3 font-sans">
              <div className="flex justify-between items-center border-b border-emerald-700/50 pb-2">
                <span className="text-xs font-black tracking-wider uppercase text-emerald-300">🍀 BOLÃO DA LOTOFÁCIL</span>
                <span className="text-xs bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">CONCURSO #{concurso}</span>
              </div>

              <div className="text-center py-3">
                <span className="text-[10px] text-emerald-300 uppercase tracking-widest block font-semibold">PREMIAÇÃO CONQUISTADA</span>
                <h2 className="text-3xl font-black text-white mt-1">✨ {acertos} PONTOS!</h2>
                <p className="text-xl font-bold text-emerald-400 mt-1">R$ {premioValor}</p>
              </div>

              <div className="bg-black/30 p-3 rounded-xl border border-white/10 text-xs italic text-emerald-100 text-center">
                "{mensagemExtra}"
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>📲</span>
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
