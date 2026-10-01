import React, { useState } from 'react';
import BetReleaseManager from './BetReleaseManager';
import BackupManager from './BackupManager';
import HowToUseModal from './HowToUseModal';
import PoolSelector from './PoolSelector';
import { usePermissions } from '../lib/PermissionsContext';

export default function Settings() {
  const { can } = usePermissions();
  const [showHowTo, setShowHowTo] = useState(false);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <h1 className="text-xl font-black text-gray-900">⚙️ Configurações do Sistema</h1>
      
      {/* Seção de Seleção do Bolão Principal */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-3xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">
            🎯
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-800">Bolão Principal / Ativo</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Selecione qual bolão deseja visualizar e administrar no aplicativo.</p>
          </div>
        </div>
        <div className="pt-1">
          <PoolSelector variant="light" />
        </div>
      </div>
      
      <button 
        onClick={() => setShowHowTo(true)}
        className="w-full bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-gray-800">📖 Como usar o Bolão</span>
        <span className="text-gray-400">Ver</span>
      </button>

      {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}

      {can('games_create') && (
        <BetReleaseManager />
      )}
      
      {can('system_backup_restore') && (
        <BackupManager />
      )}
    </div>
  );
}
