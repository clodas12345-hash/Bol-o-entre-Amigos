import { useState, useEffect, useMemo } from 'react';
import { 
  AlertOctagon, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Camera, 
  Database, 
  Globe, 
  Cpu, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { 
  SystemErrorLog, 
  ErrorCategory, 
  subscribeSystemErrors, 
  clearSystemErrors,
  getLocalErrorLogs
} from '../lib/systemErrorLogger';
import { useToast } from './NotificationManager';
import { usePermissions } from '../lib/PermissionsContext';

export default function SystemErrorsPanel() {
  const { addToast } = useToast();
  const { isAdmin } = usePermissions();
  const [logs, setLogs] = useState<SystemErrorLog[]>(() => getLocalErrorLogs());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(true);

  useEffect(() => {
    const unsub = subscribeSystemErrors((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsub();
  }, []);

  // Filtragem e ordenação garantida em ordem cronológica inversa (mais recentes no topo)
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
          return false;
        }
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchMsg = log.translatedMessage.toLowerCase().includes(term);
          const matchRaw = log.rawMessage.toLowerCase().includes(term);
          const matchCtx = (log.context || '').toLowerCase().includes(term);
          return matchMsg || matchRaw || matchCtx;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, selectedCategory, searchTerm]);

  const handleClearLogs = async () => {
    if (!window.confirm('Deseja realmente limpar todo o histórico de mensagens de erro do sistema?')) return;
    try {
      await clearSystemErrors();
      setLogs([]);
      addToast('Histórico de erros limpo com sucesso.', 'success');
    } catch {
      addToast('Erro ao limpar histórico de registros.', 'error');
    }
  };

  const getCategoryBadge = (cat: ErrorCategory) => {
    switch (cat) {
      case 'API':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <Globe className="w-3 h-3 text-blue-600" /> API Caixa/OCR
          </span>
        );
      case 'Camera':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <Camera className="w-3 h-3 text-amber-600" /> Câmera / Bilhete
          </span>
        );
      case 'Database':
        return (
          <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <Database className="w-3 h-3 text-purple-600" /> Banco de Dados
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <Cpu className="w-3 h-3 text-gray-600" /> Sistema
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-red-150 overflow-hidden my-4">
      {/* Cabeçalho do Painel */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 border-b border-red-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500 text-white rounded-2xl shadow-sm">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">
                Central de Ocorrências & Erros do Sistema
              </h3>
              {logs.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
                  {logs.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              Histórico persistente traduzido em ordem cronológica inversa (mais recentes no topo).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Limpar logs de erro"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar Lista</span>
            </button>
          )}

          <button
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition cursor-pointer"
            title={isPanelExpanded ? 'Ocultar Painel' : 'Expandir Painel'}
          >
            {isPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      {isPanelExpanded && (
        <div className="p-4 space-y-4">
          
          {/* Filtros e Busca */}
          {logs.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200/80">
              {/* Filtro de Categorias */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <Filter className="w-3.5 h-3.5 text-gray-400 ml-1 mr-1 shrink-0" />
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-2.5 py-1 text-xs font-black rounded-xl transition shrink-0 ${
                    selectedCategory === 'ALL'
                      ? 'bg-gray-900 text-white shadow-2xs'
                      : 'bg-white text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos ({logs.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('API')}
                  className={`px-2.5 py-1 text-xs font-black rounded-xl transition shrink-0 ${
                    selectedCategory === 'API'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  API Caixa ({logs.filter(l => l.category === 'API').length})
                </button>
                <button
                  onClick={() => setSelectedCategory('Camera')}
                  className={`px-2.5 py-1 text-xs font-black rounded-xl transition shrink-0 ${
                    selectedCategory === 'Camera'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Câmera ({logs.filter(l => l.category === 'Camera').length})
                </button>
                <button
                  onClick={() => setSelectedCategory('Database')}
                  className={`px-2.5 py-1 text-xs font-black rounded-xl transition shrink-0 ${
                    selectedCategory === 'Database'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Banco ({logs.filter(l => l.category === 'Database').length})
                </button>
              </div>

              {/* Campo de Busca */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar erro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-2 py-1 text-xs font-bold text-gray-800 focus:outline-red-500"
                />
              </div>
            </div>
          )}

          {/* Lista de Registros de Erro */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-60" />
              <p className="text-xs font-bold text-gray-600 uppercase">
                {logs.length === 0
                  ? 'Nenhum erro registrado no sistema'
                  : 'Nenhum erro corresponde ao filtro selecionado'}
              </p>
              <p className="text-[11px] text-gray-400">
                Todas as operações da API, Câmera e Banco estão funcionando normalmente.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;

                return (
                  <div
                    key={log.id}
                    className="bg-white border border-red-100 rounded-2xl p-3 hover:border-red-300 transition shadow-2xs space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(log.category)}
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-md">
                          {log.context || 'Geral'}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-gray-400">
                        ⏱️ {log.timestampFormatted}
                      </span>
                    </div>

                    {/* Mensagem Traduzida em Português */}
                    <p className="text-xs font-black text-red-950 leading-relaxed">
                      {log.translatedMessage}
                    </p>

                    {/* Detalhes Técnicos Expansíveis */}
                    {log.rawMessage && (
                      <div>
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-[10px] font-black text-gray-400 hover:text-gray-700 flex items-center gap-1 transition cursor-pointer"
                        >
                          {isExpanded ? 'Ocultar Detalhes Técnicos ▲' : 'Ver Detalhes Técnicos em Inglês ▼'}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2 bg-gray-900 text-amber-300 rounded-xl text-[10px] font-mono overflow-x-auto border border-gray-800 animate-in fade-in duration-150">
                            <strong>Log Original:</strong>
                            <p className="mt-0.5 whitespace-pre-wrap">{log.rawMessage}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
