import { useState } from 'react';
import { useToast } from './NotificationManager';
import PageHeader from './PageHeader';

interface BacktestData {
  hasHit15: boolean;
  hit15Details: string | null;
  frequency: {
    '14': number;
    '13': number;
    '12': number;
    '11': number;
  };
  bestRecord: {
    hits: number;
    contest: string;
    date: string;
  };
  financialSummary: {
    totalSpent: number;
    totalWon: number;
    netProfit: number;
  };
}

export default function LotofacilBacktester() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestData | null>(null);
  const { addToast } = useToast();

  const toggleNumber = (n: number) => {
    if (numbers.includes(n)) {
      setNumbers(numbers.filter(num => num !== n));
    } else {
      if (numbers.length >= 20) {
        addToast('O limite é de 20 dezenas.', 'info');
        return;
      }
      setNumbers([...numbers, n].sort((a, b) => a - b));
    }
  };

  const strictVerifyInput = (selectedNumbers: number[]): boolean => {
    if (!Array.isArray(selectedNumbers) || selectedNumbers.length < 15 || selectedNumbers.length > 20) {
      addToast('Verificação Rígida: A quantidade de dezenas deve ser entre 15 e 20.', 'error');
      return false;
    }
    const unique = new Set(selectedNumbers);
    if (unique.size !== selectedNumbers.length) {
      addToast('Verificação Rígida: Dezenas duplicadas rejeitadas.', 'error');
      return false;
    }
    for (const n of selectedNumbers) {
      if (typeof n !== 'number' || isNaN(n) || n < 1 || n > 25 || !Number.isInteger(n)) {
        addToast(`Verificação Rígida: Dezena inválida ou simulada detectada (${n}). Permitido apenas de 01 a 25.`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleBacktest = async () => {
    if (!strictVerifyInput(numbers)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/lotofacil/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers })
      });
      
      const data = await res.json();
      if (data.success) {
        setResult(data.analysis);
        addToast('Backtest concluído com sucesso!', 'success');
      } else {
        addToast(data.message || 'Erro ao realizar simulado.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Erro de conexão ao servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setNumbers([]);
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <PageHeader 
        title="Análise de Conferência Histórica"
        subtitle="Descubra o desempenho real do seu jogo contra todos os concursos da história da Lotofácil!"
        icon="📊"
      />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Seletor de Dezenas */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">
                Selecione suas Dezenas
              </label>
              <h3 className="text-sm font-black text-gray-800">
                {numbers.length} dezenas selecionadas
              </h3>
            </div>
            <button 
              onClick={clearSelection}
              className="text-xs text-purple-700 font-bold hover:underline"
            >
              Limpar Tudo
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => toggleNumber(n)}
                className={`h-11 sm:h-12 rounded-xl font-black text-sm transition-all duration-200 flex items-center justify-center border-2 ${
                  numbers.includes(n)
                    ? 'bg-purple-700 border-purple-800 text-white shadow-md scale-105'
                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-purple-200'
                }`}
              >
                {String(n).padStart(2, '0')}
              </button>
            ))}
          </div>

          <button
            onClick={handleBacktest}
            disabled={loading || numbers.length < 15}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Varrendo Histórico Oficial...
              </>
            ) : (
              <>
                <span>🔎</span> Analisar contra o Histórico Real
              </>
            )}
          </button>
        </div>

        {/* Resultados */}
        {result && (
          <div className="pt-6 border-t border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hit 15 Card */}
            <div className={`p-6 rounded-2xl text-center space-y-2 border-2 ${
              result.hasHit15 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              {result.hasHit15 ? (
                <>
                  <div className="text-4xl">👑</div>
                  <h3 className="text-xl font-black">Este jogo JÁ FOI PREMIADO com 15 pontos!</h3>
                  <p className="text-sm font-bold opacity-80">{result.hit15Details}</p>
                </>
              ) : (
                <>
                  <div className="text-3xl">❌</div>
                  <h3 className="text-lg font-black">Este jogo NUNCA deu 15 pontos.</h3>
                  <p className="text-xs opacity-70">Ele é inédito na premiação máxima até hoje!</p>
                </>
              )}
            </div>

            {/* Grid de Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">14 Pontos</span>
                <span className="text-2xl font-black text-purple-700">{result.frequency['14']}x</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">13 Pontos</span>
                <span className="text-2xl font-black text-indigo-700">{result.frequency['13']}x</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">12 Pontos</span>
                <span className="text-2xl font-black text-blue-700">{result.frequency['12']}x</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">11 Pontos</span>
                <span className="text-2xl font-black text-emerald-700">{result.frequency['11']}x</span>
              </div>
            </div>

            {/* Recorde de Pontos */}
            <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-md flex items-center gap-4">
              <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center text-xl">🏆</div>
              <div>
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Melhor Desempenho</span>
                <h4 className="text-lg font-black">
                  {result.bestRecord.hits} Pontos no {result.bestRecord.contest}
                </h4>
                <p className="text-xs text-indigo-200">Data do sorteio: {result.bestRecord.date}</p>
              </div>
            </div>

            {/* Financeiro */}
            <div className="bg-gray-900 text-white p-6 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <span>💸</span> Resumo de Saldo (Histórico Real de todos os tempos)
              </h4>
              <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">Total Gasto</span>
                  <span className="text-lg font-bold">R$ {result.financialSummary.totalSpent.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">Total Ganho</span>
                  <span className="text-lg font-bold text-emerald-400">R$ {result.financialSummary.totalWon.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">Saldo Líquido:</span>
                <span className={`text-xl font-black ${result.financialSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  R$ {result.financialSummary.netProfit.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
