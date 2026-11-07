import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { LOTOFACIL_PRICES, MEGASENA_PRICES, getCorrectGameCost } from '../lib/prizes';
import { extractContestNumber } from './GameHistory';

interface EditGameModalProps {
  game: any;
  onClose: () => void;
  onGameUpdated?: () => void;
}

export default function EditGameModal({ game, onClose, onGameUpdated }: EditGameModalProps) {
  const { addToast } = useToast();
  const isMegaSena = game.lotteryType === 'megasena' || game.type === 'megasena';

  const initialContest = extractContestNumber(game.contestNumber || game.contest) || '';
  const initialMonth = game.month || '';
  const initialNumbers: number[] = Array.isArray(game.numbers)
    ? game.numbers.map((n: any) => Number(n)).filter((n: number) => !isNaN(n))
    : [];
  const initialCustomPrize = game.customPrize !== undefined && game.customPrize !== null ? String(game.customPrize) : '';

  const [contestNumber, setContestNumber] = useState<string>(String(initialContest));
  const [month, setMonth] = useState<string>(initialMonth);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialNumbers.sort((a, b) => a - b));
  const [customPrize, setCustomPrize] = useState<string>(initialCustomPrize);
  const [isSaving, setIsSaving] = useState(false);

  const maxNumbers = isMegaSena ? 20 : 20;
  const minNumbers = isMegaSena ? 6 : 15;
  const totalGridNumbers = isMegaSena ? 60 : 25;

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= maxNumbers) {
        addToast(`O limite para esta loteria é de ${maxNumbers} dezenas por jogo.`, 'warning');
        return;
      }
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const calculatedCost = isMegaSena
    ? (MEGASENA_PRICES[selectedNumbers.length] || 5.00)
    : (LOTOFACIL_PRICES[selectedNumbers.length] || 3.50);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game?.id) {
      addToast('ID da aposta inválido.', 'error');
      return;
    }

    const contestNumParsed = Number(contestNumber);
    if (!contestNumber || isNaN(contestNumParsed) || contestNumParsed <= 0) {
      addToast('Informe um número de concurso válido.', 'error');
      return;
    }

    if (selectedNumbers.length < minNumbers) {
      addToast(`Selecione ao menos ${minNumbers} dezenas.`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const numericCustomPrize = customPrize.trim() !== '' ? parseFloat(customPrize.replace(',', '.')) : null;

      const updateData: any = {
        contest: contestNumParsed,
        contestNumber: contestNumParsed,
        numbers: selectedNumbers.sort((a, b) => a - b),
        cost: calculatedCost,
        updatedAt: serverTimestamp()
      };

      if (month.trim()) {
        updateData.month = month.trim();
      }

      if (numericCustomPrize !== null && !isNaN(numericCustomPrize) && numericCustomPrize >= 0) {
        updateData.customPrize = numericCustomPrize;
        updateData.prizeAmount = numericCustomPrize;
      } else if (customPrize.trim() === '') {
        updateData.customPrize = null;
      }

      await updateDoc(doc(db, 'games', game.id), updateData);

      // Atualiza cache local do APK se existir
      try {
        const cached = localStorage.getItem('bolao_cache_games');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) {
            const updated = list.map((g: any) => g.id === game.id ? { ...g, ...updateData } : g);
            localStorage.setItem('bolao_cache_games', JSON.stringify(updated));
          }
        }
      } catch {}

      addToast(`Aposta #${contestNumParsed} editada com sucesso!`, 'success');
      if (onGameUpdated) onGameUpdated();
      onClose();
    } catch (err) {
      console.error('Erro ao editar aposta:', err);
      if (isQuotaError(err)) {
        addToast('Limite de cota atingido no banco de dados.', 'error');
      } else {
        addToast('Erro ao atualizar aposta. Tente novamente.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[150] overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-purple-200 overflow-hidden my-4 animate-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-purple-950 font-black text-xl flex items-center justify-center shadow-sm shrink-0">
              ✏️
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Editar Aposta #{contestNumber || game.contest}
              </h3>
              <p className="text-xs text-purple-200">
                Altere dezenas, concurso ou prêmio salvo (Edição por Duplo-Clique)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white font-bold p-1 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulário de Edição */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Concurso *
              </label>
              <input
                type="number"
                value={contestNumber}
                onChange={e => setContestNumber(e.target.value)}
                placeholder="Ex: 3824"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-black text-purple-950 bg-gray-50 focus:bg-white focus:outline-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mês de Referência (MM/AAAA)
              </label>
              <input
                type="text"
                value={month}
                onChange={e => setMonth(e.target.value)}
                placeholder="Ex: 11/2026"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 bg-gray-50 focus:bg-white focus:outline-purple-600"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-800">
                Dezenas Escolhidas ({selectedNumbers.length} dezenas)
              </label>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Custo: R$ {calculatedCost.toFixed(2)}
              </span>
            </div>

            {/* Painel Numérico Interativo */}
            <div className={`grid gap-1.5 p-3 bg-purple-50/60 rounded-xl border border-purple-100 ${
              isMegaSena ? 'grid-cols-10' : 'grid-cols-5'
            }`}>
              {Array.from({ length: totalGridNumbers }, (_, i) => i + 1).map(num => {
                const isSelected = selectedNumbers.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggleNumber(num)}
                    className={`h-8 sm:h-9 rounded-lg font-black text-xs transition cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? 'bg-purple-700 text-white border-purple-800 shadow-xs scale-105 ring-2 ring-purple-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-100'
                    }`}
                  >
                    {String(num).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Prêmio Customizado Ganho (R$) — Opcional
            </label>
            <input
              type="text"
              value={customPrize}
              onChange={e => setCustomPrize(e.target.value)}
              placeholder="Deixe em branco para cálculo automático oficial"
              className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-emerald-800 bg-emerald-50/30 focus:bg-white focus:outline-emerald-600"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">
              💡 Caso queira forçar um valor de prêmio fixo neste bilhete, digite aqui.
            </span>
          </div>

          <div className="flex gap-2.5 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSaving ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
