import { useState } from 'react';
import { calculateGamePrize } from '../lib/prizes';
import { useToast } from './NotificationManager';

interface ContestHistoryCheckerProps {
  games: any[];
  onClose: () => void;
  onApplyResultAsCurrent?: (result: any) => void;
  onOpenVolantesComparator?: () => void;
}

export default function ContestHistoryChecker({
  games,
  onClose,
  onApplyResultAsCurrent,
  onOpenVolantesComparator
}: ContestHistoryCheckerProps) {
  const [searchContest, setSearchContest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contestData, setContestData] = useState<any | null>(null);
  const { addToast } = useToast();

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = customQuery !== undefined ? customQuery : searchContest.trim();
    if (!query) {
      addToast('Digite o número do concurso da Lotofácil.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/lotofacil/contest/${query}`);
      const data = await res.json();

      if (data.success && data.result) {
        setContestData(data.result);
        addToast(`Concurso ${data.result.contest} carregado com sucesso!`, 'success');
      } else {
        addToast('Concurso não encontrado ou erro na apuração da Caixa.', 'error');
      }
    } catch (err) {
      console.error('Erro ao buscar concurso:', err);
      addToast('Erro de conexão ao buscar concurso.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const drawnNumbers: number[] = Array.isArray(contestData?.numbers)
    ? contestData.numbers.map((n: any) => Number(n))
    : [];

  // Avalia as apostas do bolão contra o concurso pesquisado
  const evaluatedGames = games.map(game => {
    const gameNumbers: number[] = Array.isArray(game.numbers)
      ? game.numbers.map((n: any) => Number(n))
      : [];
    const prizeInfo = calculateGamePrize(gameNumbers, drawnNumbers, game.customPrize);
    return { ...game, gameNumbers, prizeInfo };
  });

  const totalPrize = evaluatedGames.reduce((sum, g) => sum + g.prizeInfo.prizeAmount, 0);
  const winnersCount = evaluatedGames.filter(g => g.prizeInfo.isWinner).length;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 my-4 overflow-hidden animate-in fade-in duration-200">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white p-4 sm:p-5 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-purple-200">
              Loterias Caixa • Consulta Histórica
            </span>
            <h2 className="text-lg sm:text-xl font-black mt-1 flex items-center gap-2">
              <span>🔍</span> Histórico e Consulta de Concursos
            </h2>
            <p className="text-xs text-purple-200">
              Pesquise qualquer concurso oficial e confira o retrospecto das apostas do bolão
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-white/30"
            title="Fechar janela"
          >
            <span>✕</span> <span>Fechar</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {onOpenVolantesComparator && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <div>
                  <strong className="text-emerald-900 block font-black">Auditor Automático de Volantes</strong>
                  <span className="text-emerald-700 text-[11px]">
                    Compara automaticamente cada volante cadastrado com seu respectivo concurso oficial da Lotofácil.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVolantesComparator();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer shadow-2xs self-end sm:self-auto"
              >
                Abrir Auditor ➔
              </button>
            </div>
          )}

          {/* Barra de Busca de Concurso */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">№</span>
              <input
                type="number"
                min="1"
                placeholder="Ex: 3200, 3195, 3000..."
                value={searchContest}
                onChange={e => setSearchContest(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-purple-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin text-xs">⏳</span> Buscando...
                </>
              ) : (
                <>
                  <span>🔎</span> Consultar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSearch(undefined, 'latest')}
              disabled={isLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
              title="Buscar o concurso mais recente apurado pela Caixa"
            >
              Último Sorteio
            </button>
          </form>

          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            💡 Dica: Estamos em Setembro de 2026. Concursos recentes estão entre 3780 e 3800.
          </p>

          {/* Resultado do Concurso Pesquisado */}
          {contestData && (
            <div className="space-y-4">
              {/* Card das Dezenas Sorteadas */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-black text-purple-950 text-base flex items-center gap-1.5">
                      <span>🎰</span> Concurso {contestData.contest}
                    </h3>
                    {contestData.date && (
                      <p className="text-xs text-purple-700 font-medium">
                        Data da Apuração: <strong>{contestData.date}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {contestData.accumulated ? (
                      <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                        ACUMULOU!
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                        PREMIADO
                      </span>
                    )}

                    {onApplyResultAsCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyResultAsCurrent(contestData);
                          onClose();
                        }}
                        className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer"
                        title="Usar este concurso na tela principal para conferência de apostas"
                      >
                        Definir como Atual
                      </button>
                    )}
                  </div>
                </div>

                {/* 15 Dezenas Sorteadas */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                  {drawnNumbers.map(num => (
                    <div
                      key={num}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-900 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md border border-purple-400 ring-2 ring-purple-200"
                    >
                      {String(num).padStart(2, '0')}
                    </div>
                  ))}
                </div>

                {/* Estatísticas de Premiação da Caixa para este Concurso */}
                {(contestData.prize15Winners !== undefined || contestData.nextEstimatedPrize > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-purple-200 text-xs">
                    <div className="bg-white/80 p-2 rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Ganhadores 15 pts</span>
                      <strong className="text-purple-900 font-bold">
                        {contestData.prize15Winners || 0} {contestData.prize15Winners === 1 ? 'aposta' : 'apostas'}
                      </strong>
                    </div>

                    <div className="bg-white/80 p-2 rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Prêmio 15 pts</span>
                      <strong className="text-emerald-700 font-bold">
                        R$ {(contestData.prize15Amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="bg-white/80 p-2 rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Ganhadores 14 pts</span>
                      <strong className="text-gray-800 font-bold">
                        {contestData.prize14Winners || 0} apostas
                      </strong>
                    </div>

                    <div className="bg-white/80 p-2 rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Próx. Estimativa</span>
                      <strong className="text-amber-700 font-bold">
                        R$ {(contestData.nextEstimatedPrize || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo de Desempenho do Bolão no Concurso */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-800">
                    Desempenho das {games.length} Apostas do Bolão
                  </h4>
                  <p className="text-xs text-gray-500">
                    {winnersCount > 0
                      ? `🎉 ${winnersCount} aposta(s) premiada(s) neste concurso!`
                      : 'Nenhuma aposta atingiu 11 ou mais pontos neste concurso.'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Total Ganho</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700">
                    R$ {totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Tabela de Conferência das Apostas */}
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-semibold border-b">
                      <th className="p-2.5 text-left">Aposta</th>
                      <th className="p-2.5 text-left">Dezenas Sorteadas / Acertos</th>
                      <th className="p-2.5 text-center">Acertos</th>
                      <th className="p-2.5 text-right">Premiação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {evaluatedGames.map((game, idx) => (
                      <tr key={game.id || idx} className="hover:bg-gray-50/80">
                        <td className="p-2.5 font-bold text-gray-700 whitespace-nowrap">
                          Jogo #{idx + 1}
                        </td>
                        <td className="p-2.5">
                          <div className="flex flex-wrap gap-1">
                            {game.gameNumbers.map((num: number) => {
                              const isHit = drawnNumbers.includes(num);
                              return (
                                <span
                                  key={num}
                                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                    isHit
                                      ? 'bg-emerald-600 text-white font-black'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {num}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${game.prizeInfo.badgeColor}`}>
                            {game.prizeInfo.hits} pts
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-black text-emerald-700 whitespace-nowrap">
                          {game.prizeInfo.prizeAmount > 0
                            ? `R$ ${game.prizeInfo.prizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
