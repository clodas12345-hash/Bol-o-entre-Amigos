import { useState } from 'react';
import { formatFirstAndLastName } from '../lib/formatters';

interface PrizeSplitModalProps {
  totalPrize: number;
  members: any[];
  contestName?: string;
  onClose: () => void;
}

export default function PrizeSplitModal({
  totalPrize,
  members,
  contestName,
  onClose,
}: PrizeSplitModalProps) {
  // Filtro de elegibilidade: apenas membros com cota ativa / pagamento "Pago" ou todos
  const [onlyPaid, setOnlyPaid] = useState(true);

  const eligibleMembers = onlyPaid
    ? members.filter(m => m.paymentStatus === 'Pago')
    : members;

  // Soma de todas as cotas dos participantes elegíveis
  const totalEligibleQuotas = eligibleMembers.reduce((sum, m) => sum + (Number(m.quotas) > 0 ? Number(m.quotas) : 1), 0);
  
  // Valor de 1 cota unitária
  const prizePerSingleQuota = totalEligibleQuotas > 0 ? totalPrize / totalEligibleQuotas : 0;

  const handleCopySummary = () => {
    let text = `🎰 *RATEIO OFICIAL DE PRÊMIO DO BOLÃO* 🎰\n`;
    if (contestName) text += `📌 Concurso: ${contestName}\n`;
    text += `💰 Prêmio Total: R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `👥 Total de Participantes: ${eligibleMembers.length}\n`;
    text += `🎟️ Total de Cotas Ativas: ${totalEligibleQuotas}\n`;
    text += `💵 *Valor por 1 Cota: R$ ${prizePerSingleQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
    text += `*Divisão Proporcional por Participante:*\n`;
    
    eligibleMembers.forEach((m, idx) => {
      const q = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
      const memberShare = q * prizePerSingleQuota;
      text += `${idx + 1}. ${formatFirstAndLastName(m.displayName || m.email)} (${q} cota${q > 1 ? 's' : ''}): R$ ${memberShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    });

    navigator.clipboard.writeText(text);
    alert('Resumo do rateio proporcional copiado para a área de transferência! Pronto para colar no WhatsApp.');
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 my-4 animate-in fade-in duration-200">
        {/* Topo Dourado / Celebração */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                Divisão Proporcional por Cotas
              </span>
              <h2 className="text-xl font-black mt-1 flex items-center gap-2">
                <span>🏆</span> Rateio de Prêmios
              </h2>
              {contestName && (
                <p className="text-xs text-amber-100 font-medium">{contestName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl font-bold p-1 transition"
            >
              ✕
            </button>
          </div>

          {/* Cards de Valores */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3 border border-white/30">
              <span className="text-[11px] font-medium text-amber-100 uppercase">Prêmio Total</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                R$ {totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 shadow-md border border-amber-200 text-amber-950">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Por 1 Cota ({totalEligibleQuotas} cotas)</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                R$ {prizePerSingleQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Opção de Filtro */}
          <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
            <span className="font-medium text-gray-700">Critério de Elegibilidade:</span>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={onlyPaid}
                onChange={e => setOnlyPaid(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              Apenas quem pagou ({members.filter(m => m.paymentStatus === 'Pago').length} de {members.length})
            </label>
          </div>

          {/* Lista de Cotas */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Participantes Contemplados ({eligibleMembers.length} pessoas • {totalEligibleQuotas} cotas)
              </h3>
              <button
                onClick={handleCopySummary}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer"
              >
                <span>📋</span> Copiar para WhatsApp
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {eligibleMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  Nenhum membro elegível com os critérios selecionados.
                </div>
              ) : (
                eligibleMembers.map((m, idx) => {
                  const q = Number(m.quotas) > 0 ? Number(m.quotas) : 1;
                  const memberTotalShare = q * prizePerSingleQuota;

                  return (
                    <div key={m.id || idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-gray-50/70 transition">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-800">
                            {formatFirstAndLastName(m.displayName || m.email)}
                          </span>
                          <span className="ml-2 inline-block text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                            {q} {q > 1 ? 'cotas' : 'cota'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-emerald-700 block">
                          R$ {memberTotalShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {q > 1 && (
                          <span className="text-[9px] text-gray-400 block">
                            ({q}x R$ {prizePerSingleQuota.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
