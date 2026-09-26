import React, { useState } from 'react';
import { usePermissions } from '../lib/PermissionsContext';
import {
  PERMISSION_CATEGORIES,
  PERMISSION_DEFINITIONS,
  PermissionKey,
  PermissionDefinition
} from '../lib/permissions';
import { useToast } from './NotificationManager';

interface PermissionsSettingsProps {
  embedded?: boolean;
}

export default function PermissionsSettings({ embedded = false }: PermissionsSettingsProps) {
  const {
    realRole,
    effectiveRole,
    simulatedRole,
    setSimulatedRole,
    isSimulating,
    permissions,
    updatePermission,
    savePermissions,
    resetToDefaults,
    can
  } = usePermissions();

  const { addToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isRealAdmin = realRole === 'admin';

  const handleToggle = async (role: 'counselor' | 'participant', key: PermissionKey, currentVal: boolean) => {
    if (!isRealAdmin) {
      addToast('Apenas o Gestor pode alterar as permissões de acesso.', 'error');
      return;
    }
    try {
      await updatePermission(role, key, !currentVal);
      addToast(`Permissão atualizada para ${role === 'counselor' ? 'Conselheiro' : 'Participante'}.`, 'info');
    } catch {
      addToast('Erro ao atualizar permissão.', 'error');
    }
  };

  const handleReset = async () => {
    if (!isRealAdmin) return;
    if (!confirm('Deseja restaurar as permissões padrão recomendadas pelo sistema?')) return;
    setIsResetting(true);
    try {
      await resetToDefaults();
      addToast('Permissões restauradas para os padrões recomendados!', 'success');
    } catch {
      addToast('Erro ao restaurar permissões.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredDefinitions = PERMISSION_DEFINITIONS.filter(def => {
    const matchesCategory = selectedCategory === 'all' || def.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' ||
      def.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`space-y-5 ${embedded ? '' : 'max-w-4xl mx-auto'}`}>
      {/* Barra de Simulação Exclusiva do Gestor */}
      {isRealAdmin && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-4 rounded-2xl shadow-md border border-purple-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">👁️</span>
                <h3 className="font-black text-sm uppercase tracking-wide">
                  Simulador de Visualização em Tempo Real
                </h3>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Escolha um perfil para testar como o app é exibido para cada usuário:
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSimulatedRole(null)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  !isSimulating
                    ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>👑</span> Gestor (Real)
              </button>

              <button
                type="button"
                onClick={() => setSimulatedRole('counselor')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  simulatedRole === 'counselor'
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🛡️</span> Conselheiro
              </button>

              <button
                type="button"
                onClick={() => setSimulatedRole('participant')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  simulatedRole === 'participant'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>👥</span> Participante
              </button>
            </div>
          </div>

          {isSimulating && (
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-amber-300">
              <span className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Você está simulando o papel de <strong>{simulatedRole === 'counselor' ? 'Conselheiro' : 'Participante'}</strong>. Os botões no aplicativo já estão reagindo às permissões configuradas!
              </span>
              <button
                type="button"
                onClick={() => setSimulatedRole(null)}
                className="text-[11px] underline font-bold hover:text-white cursor-pointer ml-2"
              >
                Voltar para Gestor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cabeçalho do Painel de Permissões */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <span>🛡️</span> O que cada um pode fazer (Controle de Ferramentas)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ative ou desative as ferramentas de edição, adição, exclusão e visualização para Conselheiros e Participantes.
            </p>
          </div>

          {isRealAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-gray-300 flex items-center gap-1.5"
                title="Voltar para as permissões padrões recomendadas"
              >
                <span>🔄</span> Restaurar Padrões
              </button>
            </div>
          )}
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-gray-150">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar ferramenta ou permissão..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 font-medium focus:outline-blue-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas ({PERMISSION_DEFINITIONS.length})
            </button>
            {PERMISSION_CATEGORIES.map(cat => {
              const count = PERMISSION_DEFINITIONS.filter(d => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Matriz de Permissões */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Cabeçalho da Tabela */}
        <div className="grid grid-cols-12 bg-gray-100/80 px-4 py-3 border-b border-gray-200 text-xs font-black text-gray-700 uppercase tracking-wider">
          <div className="col-span-12 sm:col-span-6">Ferramenta & Ação</div>
          <div className="hidden sm:block sm:col-span-2 text-center text-purple-800">👑 Gestor</div>
          <div className="col-span-6 sm:col-span-2 text-center text-blue-800">🛡️ Conselheiro</div>
          <div className="col-span-6 sm:col-span-2 text-center text-emerald-800">👥 Participante</div>
        </div>

        {/* Linhas de Permissões */}
        <div className="divide-y divide-gray-100">
          {filteredDefinitions.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              Nenhuma ferramenta encontrada com o termo "{searchQuery}".
            </div>
          ) : (
            filteredDefinitions.map((def) => {
              const isCounselorAllowed = permissions.counselor[def.key] ?? false;
              const isParticipantAllowed = permissions.participant[def.key] ?? false;

              return (
                <div
                  key={def.key}
                  className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-gray-50/80 transition gap-y-2 sm:gap-y-0"
                >
                  {/* Detalhes da Ferramenta */}
                  <div className="col-span-12 sm:col-span-6 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs sm:text-sm">
                        {def.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      {def.description}
                    </p>
                  </div>

                  {/* Coluna Gestor: Sempre Total */}
                  <div className="hidden sm:flex sm:col-span-2 justify-center items-center">
                    <span className="bg-purple-100 text-purple-900 font-black text-[10px] px-2.5 py-1 rounded-full border border-purple-200 uppercase flex items-center gap-1 shadow-2xs">
                      <span>✓</span> Permitido
                    </span>
                  </div>

                  {/* Coluna Conselheiro */}
                  <div className="col-span-6 sm:col-span-2 flex flex-col items-center justify-center">
                    <span className="sm:hidden text-[10px] font-bold text-blue-700 mb-1">Conselheiro</span>
                    <button
                      type="button"
                      disabled={!isRealAdmin}
                      onClick={() => handleToggle('counselor', def.key, isCounselorAllowed)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                        isCounselorAllowed ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      title={isRealAdmin ? (isCounselorAllowed ? 'Desativar para Conselheiro' : 'Ativar para Conselheiro') : 'Apenas o Gestor pode alterar'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isCounselorAllowed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-black mt-1 uppercase ${isCounselorAllowed ? 'text-blue-700' : 'text-gray-400'}`}>
                      {isCounselorAllowed ? 'Liberado' : 'Bloqueado'}
                    </span>
                  </div>

                  {/* Coluna Participante */}
                  <div className="col-span-6 sm:col-span-2 flex flex-col items-center justify-center">
                    <span className="sm:hidden text-[10px] font-bold text-emerald-700 mb-1">Participante</span>
                    <button
                      type="button"
                      disabled={!isRealAdmin}
                      onClick={() => handleToggle('participant', def.key, isParticipantAllowed)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                        isParticipantAllowed ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                      title={isRealAdmin ? (isParticipantAllowed ? 'Desativar para Participante' : 'Ativar para Participante') : 'Apenas o Gestor pode alterar'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isParticipantAllowed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-black mt-1 uppercase ${isParticipantAllowed ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {isParticipantAllowed ? 'Liberado' : 'Bloqueado'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Nota Explicativa */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <span className="text-base shrink-0">💡</span>
        <div className="space-y-1">
          <p className="font-bold">Como funciona o controle de permissões?</p>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Todas as alterações são salvas automaticamente no banco de dados e sincronizadas em tempo real. Se você desativar uma ação (por exemplo, "Excluir Apostas" ou "Adicionar Membros"), os respectivos botões desaparecerão imediatamente das telas dos Conselheiros e Participantes, garantindo total segurança e controle.
          </p>
        </div>
      </div>
    </div>
  );
}
