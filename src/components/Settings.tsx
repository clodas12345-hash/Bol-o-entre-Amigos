import React, { useState } from 'react';
import BetReleaseManager from './BetReleaseManager';
import BackupManager from './BackupManager';
import HowToUseModal from './HowToUseModal';
import { usePermissions } from '../lib/PermissionsContext';

export default function Settings() {
  const { can } = usePermissions();
  const [showHowTo, setShowHowTo] = useState(false);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <h1 className="text-xl font-black text-gray-900">⚙️ Configurações do Sistema</h1>
      
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
