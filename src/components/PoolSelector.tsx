import { usePool } from '../lib/PoolContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PoolSelector() {
  const { pools, activePool, setActivePoolId } = usePool();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg border border-white/20 transition cursor-pointer text-white max-w-[170px] sm:max-w-xs"
        title="Alternar Bolão Ativo"
      >
        <span className="text-[11px] font-black uppercase tracking-wider truncate">
          {activePool?.name || 'Bolão Principal'}
        </span>
        <span className={`text-[9px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-full right-0 sm:left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Bolões Disponíveis
              </span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {pools.length} cadastrado(s)
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {pools.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  Nenhum bolão adicional encontrado.
                </div>
              ) : (
                pools.map(pool => (
                  <button
                    key={pool.id}
                    onClick={() => {
                      setActivePoolId(pool.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3 flex flex-col gap-0.5 hover:bg-gray-50 transition cursor-pointer ${
                      activePool?.id === pool.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${activePool?.id === pool.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {pool.name}
                      </span>
                      {activePool?.id === pool.id && (
                        <span className="text-[10px] font-black text-indigo-600">✓ Ativo</span>
                      )}
                    </div>
                    {pool.description && (
                      <span className="text-[10px] text-gray-500 line-clamp-1">{pool.description}</span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        pool.lotteryType === 'megasena' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {pool.lotteryType === 'megasena' ? 'Mega-Sena' : 'Lotofácil'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        pool.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {pool.active ? 'Ativo' : 'Encerrado'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-2.5 bg-gray-50 border-t text-center">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1"
              >
                <span>⚙️</span> Gerenciar ou Criar Novos Bolões
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
