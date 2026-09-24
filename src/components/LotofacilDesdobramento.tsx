import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from './NotificationManager';
import { DESDOBRAMENTOS_CATALOG, DesdobramentoScheme, sortNumbers } from '../lib/desdobramentos';
import { LOTOFACIL_STATS, getGoldenBalancedNumbers, getTopHotNumbers } from '../lib/lotofacilStats';

interface LotofacilDesdobramentoProps {
  onClose?: () => void;
  onGamesSaved?: () => void;
}

export default function LotofacilDesdobramento({ onClose, onGamesSaved }: LotofacilDesdobramentoProps) {
  const navigate = useNavigate();
  const [selectedScheme, setSelectedScheme] = useState<DesdobramentoScheme>(DESDOBRAMENTOS_CATALOG[0]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
  const [contestNumber, setContestNumber] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const { addToast } = useToast();

  const handleToggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
      setGeneratedGames([]);
    } else {
      if (selectedNumbers.length >= selectedScheme.totalNumbers) {
        addToast(`Você já selecionou o limite de ${selectedScheme.totalNumbers} dezenas para este fechamento.`, 'info');
        return;
      }
      setSelectedNumbers(prev => sortNumbers([...prev, num]));
      setGeneratedGames([]);
    }
  };

  const handleSelectScheme = (scheme: DesdobramentoScheme) => {
    setSelectedScheme(scheme);
    if (selectedNumbers.length > scheme.totalNumbers) {
      setSelectedNumbers(prev => prev.slice(0, scheme.totalNumbers));
    }
    setGeneratedGames([]);
  };

  const handleAutoFillGolden = () => {
    // Pega as dezenas de ouro e completa até a quantidade necessária
    const golden = getGoldenBalancedNumbers();
    const remainingNeeded = selectedScheme.totalNumbers - golden.length;
    let chosen = [...golden];

    if (remainingNeeded > 0) {
      const unused = Array.from({ length: 25 }, (_, i) => i + 1).filter(n => !chosen.includes(n));
      // Embaralha não utilizados e pega o restante
      const shuffled = unused.sort(() => 0.5 - Math.random());
      chosen = sortNumbers([...chosen, ...shuffled.slice(0, remainingNeeded)]);
    } else if (remainingNeeded < 0) {
      chosen = chosen.slice(0, selectedScheme.totalNumbers);
    }

    setSelectedNumbers(sortNumbers(chosen));
    setGeneratedGames([]);
    addToast(`${selectedScheme.totalNumbers} dezenas equilibradas selecionadas!`, 'info');
  };

  const handleAutoFillHot = () => {
    const hot = getTopHotNumbers(selectedScheme.totalNumbers);
    setSelectedNumbers(sortNumbers(hot));
    setGeneratedGames([]);
    addToast(`${selectedScheme.totalNumbers} dezenas mais quentes selecionadas!`, 'info');
  };

  const handleSurpresinha = () => {
    const all = Array.from({ length: 25 }, (_, i) => i + 1);
    const shuffled = all.sort(() => 0.5 - Math.random());
    setSelectedNumbers(sortNumbers(shuffled.slice(0, selectedScheme.totalNumbers)));
    setGeneratedGames([]);
    addToast(`${selectedScheme.totalNumbers} dezenas sorteadas aleatoriamente!`, 'info');
  };

  const handleGenerate = () => {
    if (selectedNumbers.length < selectedScheme.totalNumbers) {
      addToast(`Selecione exatamente ${selectedScheme.totalNumbers} dezenas para gerar o desdobramento (selecionadas: ${selectedNumbers.length}).`, 'error');
      return;
    }

    const games = selectedScheme.generate(selectedNumbers);
    setGeneratedGames(games);
    addToast(`${games.length} jogos gerados com sucesso pelo fechamento matemático!`, 'success');
  };

  const handleCopyGamesText = () => {
    if (generatedGames.length === 0) return;

    let text = `🎰 *DESDOBRAMENTO LOTOFÁCIL (${selectedScheme.name})* 🎰\n`;
    if (contestNumber) text += `📌 Concurso: ${contestNumber}\n`;
    text += `🎯 Dezenas Selecionadas (${selectedNumbers.length}): ${selectedNumbers.map(n => String(n).padStart(2, '0')).join(', ')}\n`;
    text += `🛡️ Garantia: ${selectedScheme.guarantee}\n`;
    text += `💵 Custo Estimado: R$ ${selectedScheme.costEstimate.toFixed(2).replace('.', ',')} (${generatedGames.length} apostas)\n\n`;
    text += `*Jogos Gerados:*\n`;

    generatedGames.forEach((g, idx) => {
      text += `Jogo ${idx + 1}: ${g.map(n => String(n).padStart(2, '0')).join(' - ')}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    addToast('Jogos do desdobramento copiados para o WhatsApp!', 'success');
  };

  const handleSaveToBolao = async () => {
    if (generatedGames.length === 0) {
      addToast('Gere os jogos antes de salvar.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const contestVal = contestNumber.trim() ? Number(contestNumber.trim()) : null;

      for (let i = 0; i < generatedGames.length; i++) {
        await addDoc(collection(db, 'games'), {
          numbers: generatedGames[i],
          contestNumber: contestVal,
          description: `Desdobramento: ${selectedScheme.name} (Jogo ${i + 1}/${generatedGames.length})`,
          createdAt: serverTimestamp(),
          isDesdobramento: true,
          schemeId: selectedScheme.id,
        });
      }

      addToast(`🎉 ${generatedGames.length} jogos do desdobramento foram salvos no bolão!`, 'success');
      if (onGamesSaved) onGamesSaved();
      if (onClose) {
        onClose();
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Erro ao salvar jogos do desdobramento:', err);
      addToast('Erro ao salvar jogos no banco de dados.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Topo do Modal/Painel */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white p-4 sm:p-5">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Matemática Aplicada à Lotofácil
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center gap-2">
              <span>🎯</span> Fechamentos & Desdobramentos
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">
              Cerque mais dezenas pagando muito menos com garantias matemáticas de 13 e 14 pontos
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

      <div className="p-4 sm:p-5 space-y-5">
        {/* Seletor de Esquemas de Fechamento */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
            1. Escolha o Modelo de Fechamento:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {DESDOBRAMENTOS_CATALOG.map((scheme) => {
              const isSelected = selectedScheme.id === scheme.id;
              return (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => handleSelectScheme(scheme)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/90 shadow-sm ring-2 ring-purple-500/20'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-gray-900">{scheme.name}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {scheme.totalGames} jogos
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 font-semibold line-clamp-1">{scheme.guarantee}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500">
                    <span>{scheme.totalNumbers} dezenas</span>
                    <span className="font-bold text-emerald-700">R$ {scheme.costEstimate.toFixed(2).replace('.', ',')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Informações do Esquema Selecionado */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3.5 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-extrabold text-purple-900 block">{selectedScheme.name}</span>
            <p className="text-gray-600 mt-0.5">{selectedScheme.description}</p>
            <p className="text-emerald-800 font-bold mt-1">🛡️ {selectedScheme.guarantee}</p>
          </div>
          <div className="text-right bg-white p-2.5 rounded-lg border border-purple-200 shadow-2xs">
            <span className="text-[10px] text-gray-500 uppercase block font-semibold">Custo Total na Caixa</span>
            <span className="text-base font-black text-emerald-700">
              R$ {selectedScheme.costEstimate.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] text-gray-400 block">({selectedScheme.totalGames} apostas de 15 números)</span>
          </div>
        </div>

        {/* Volante Interativo para Escolher as Dezenas */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                2. Selecione as {selectedScheme.totalNumbers} Dezenas:
              </label>
              <span className={`ml-2 text-xs font-black px-2 py-0.5 rounded-full ${
                selectedNumbers.length === selectedScheme.totalNumbers
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {selectedNumbers.length} de {selectedScheme.totalNumbers} selecionadas
              </span>
            </div>

            {/* Atalhos Rápidos */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleAutoFillGolden}
                className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition cursor-pointer"
              >
                ✨ Padrão Ouro
              </button>
              <button
                type="button"
                onClick={handleAutoFillHot}
                className="px-2.5 py-1 text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg transition cursor-pointer"
              >
                🔥 Mais Quentes
              </button>
              <button
                type="button"
                onClick={handleSurpresinha}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg transition cursor-pointer"
              >
                🎲 Surpresinha
              </button>
              {selectedNumbers.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedNumbers([]); setGeneratedGames([]); }}
                  className="px-2 py-1 text-[11px] text-gray-500 hover:text-red-600 transition cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Grid 5x5 do Volante */}
          <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto sm:max-w-md bg-gray-50 p-3 rounded-2xl border border-gray-200">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => {
              const isSelected = selectedNumbers.includes(n);
              const stat = LOTOFACIL_STATS.find(s => s.number === n);
              const isHot = (stat?.frequency || 0) >= 60;

              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleToggleNumber(n)}
                  className={`h-11 sm:h-12 rounded-xl font-black text-sm flex flex-col items-center justify-center transition-all cursor-pointer select-none shadow-2xs relative ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md scale-102 ring-2 ring-purple-400'
                      : 'bg-white text-gray-800 border border-gray-200 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                >
                  <span>{String(n).padStart(2, '0')}</span>
                  <span className={`text-[8px] font-medium leading-none ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                    {isHot ? '🔥' : `${stat?.frequency || 0}%`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campo Concurso & Botão Gerar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Concurso (Opcional):</label>
            <input
              type="number"
              placeholder="Ex: 3340"
              value={contestNumber}
              onChange={e => setContestNumber(e.target.value)}
              className="w-28 border border-gray-300 rounded-lg p-1.5 text-xs focus:outline-purple-600 font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={selectedNumbers.length !== selectedScheme.totalNumbers}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚡</span> Gerar {selectedScheme.totalGames} Apostas Desdobradas
          </button>
        </div>

        {/* Lista de Jogos Gerados */}
        {generatedGames.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-purple-200 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  📋 Jogos Prontos para Registro ({generatedGames.length} apostas)
                </h3>
                <p className="text-xs text-gray-500">Cada aposta possui exatamente 15 números oficiais</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyGamesText}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{copied ? '✓' : '📋'}</span> {copied ? 'Copiado!' : 'Copiar para WhatsApp'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveToBolao}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <span>💾</span> {isSaving ? 'Salvando...' : 'Salvar no Bolão'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
              {generatedGames.map((game, idx) => (
                <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex flex-col justify-between gap-1.5 hover:bg-purple-50/40 transition">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[11px] text-purple-900">
                      Jogo #{idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-400">15 dezenas</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {game.map(n => (
                      <span
                        key={n}
                        className="w-6 h-6 rounded-full bg-purple-700 text-white text-[11px] font-black flex items-center justify-center shadow-2xs"
                      >
                        {String(n).padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
