import React from 'react';
import BetReleaseManager from './BetReleaseManager';
import BackupManager from './BackupManager';
import { usePermissions } from '../lib/PermissionsContext';

export default function Settings() {
  const { can } = usePermissions();
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <h1 className="text-xl font-black text-gray-900">⚙️ Configurações do Sistema</h1>
      
      {can('games_create') && (
        <BetReleaseManager />
      )}
      
      {can('system_backup_restore') && (
        <BackupManager />
      )}
    </div>
  );
}
