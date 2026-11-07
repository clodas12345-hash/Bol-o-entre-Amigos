import { useData } from '../lib/DataContext';
import { usePermissions } from '../lib/PermissionsContext';
import { AlertTriangle, Database, Info } from 'lucide-react';

export default function CloudHistoryLimitBanner() {
  const { games } = useData();
  const { isAdmin } = usePermissions();
  
  if (!isAdmin) return null;

  const MAX_GAMES = 10000;
  const currentCount = games.length;
  const percent = Math.min(100, Math.round((currentCount / MAX_GAMES) * 100));
  const isNearLimit = currentCount >= 9000;
  const isOverLimit = currentCount >= MAX_GAMES;

  if (currentCount < 7000) return null;

  return (
    <div className={`mb-4 rounded-2xl border p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
      isOverLimit ? 'bg-red-50 border-red-200' : isNearLimit ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${
          isOverLimit ? 'bg-red-100 text-red-600' : isNearLimit ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {isOverLimit || isNearLimit ? <AlertTriangle size={24} /> : <Database size={24} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-black uppercase tracking-wide flex items-center gap-2 ${
            isOverLimit ? 'text-red-950' : isNearLimit ? 'text-amber-950' : 'text-blue-950'
          }`}>
            {isOverLimit ? 'Capacidade da Nuvem Esgotada!' : isNearLimit ? 'Nuvem Quase Cheia!' : 'Uso da Nuvem'}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              isOverLimit ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
            }`}>
              {currentCount.toLocaleString()} / {MAX_GAMES.toLocaleString()} jogos
            </span>
          </h4>
          
          <p className={`text-xs mt-1 leading-relaxed ${
            isOverLimit ? 'text-red-800' : isNearLimit ? 'text-amber-800' : 'text-blue-800'
          }`}>
            {isOverLimit 
              ? 'O limite de 10.000 jogos foi atingido. Para cadastrar novas apostas, você precisa apagar jogos antigos no Histórico.' 
              : `Você utilizou ${percent}% da capacidade contratada de 10.000 jogos no histórico. Quando atingir o limite, será necessário liberar espaço apagando jogos antigos.`
            }
          </p>

          <div className="mt-3 w-full bg-black/5 rounded-full h-2 overflow-hidden border border-black/5">
            <div 
              className={`h-full transition-all duration-1000 ${
                isOverLimit ? 'bg-red-600' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('bolao_navigate_to', { detail: { path: '/historico-boloes' } }))}
              className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition shadow-xs uppercase ${
                isOverLimit ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              ⚙️ Gerenciar Histórico
            </button>
            <p className="text-[9px] font-bold text-gray-400 italic">
              * O arquivamento é automático, mas a limpeza definitiva do banco deve ser feita manualmente por aqui.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
