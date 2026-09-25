import { useState, useEffect } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import {
  downloadFullBackup,
  getLastBackupDate,
  getBackupReminderSettings,
  saveBackupReminderSettings,
  BackupReminderSettings,
  saveBackupToFirestore,
  getBackupsHistory
} from '../lib/backupService';

interface CollectionStat {
  name: string;
  label: string;
  icon: string;
  count: number;
}

const COLLECTION_METADATA: Record<string, { label: string; icon: string }> = {
  pools: { label: 'Bolões Registrados', icon: '🎱' },
  games: { label: 'Jogos e Apostas', icon: '🎟️' },
  members: { label: 'Participantes Cadastrados', icon: '👥' },
  users: { label: 'Perfis de Usuários', icon: '👤' },
  payments: { label: 'Comprovantes e Pagamentos', icon: '💳' },
  lotofacil_results: { label: 'Resultados da Lotofácil', icon: '🍀' },
  megasena_results: { label: 'Resultados da Mega-Sena', icon: '✨' },
  chats: { label: 'Mensagens do Chat', icon: '💬' },
  polls: { label: 'Enquetes e Votações', icon: '📊' }
};

export default function BackupManager() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewStats, setPreviewStats] = useState<CollectionStat[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [settings, setSettings] = useState<BackupReminderSettings>(getBackupReminderSettings());
  const [backupsHistory, setBackupsHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAutoBackingUp, setIsAutoBackingUp] = useState(false);
  
  const { addToast } = useToast();
  const isAdmin = auth.currentUser?.email === 'clodas12345@gmail.com';

  useEffect(() => {
    setLastBackup(getLastBackupDate());
    loadHistory();
    checkAndRunAutoBackup();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const history = await getBackupsHistory();
    setBackupsHistory(history);
    setIsLoadingHistory(false);
  };

  const checkAndRunAutoBackup = async () => {
    if (!isAdmin) return;
    
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const isLastDay = tomorrow.getMonth() !== today.getMonth();
    
    if (isLastDay) {
      const lastBackupDate = getLastBackupDate();
      if (!lastBackupDate || lastBackupDate.toDateString() !== today.toDateString()) {
        setIsAutoBackingUp(true);
        try {
          await saveBackupToFirestore();
          setLastBackup(new Date());
          addToast('📦 Hoje é o último dia do mês! Backup automático de segurança gerado no histórico.', 'success');
          loadHistory();
        } catch (err) {
          console.error('Auto backup error:', err);
        } finally {
          setIsAutoBackingUp(false);
        }
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    addToast('📦 Gerando backup completo do banco de dados...', 'info');

    try {
      const { totalRecords } = await downloadFullBackup();
      setLastBackup(new Date());
      addToast(`✅ Backup exportado com sucesso! (${totalRecords} registros salvos)`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      addToast('Erro ao exportar backup dos dados.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        const stats: CollectionStat[] = [];
        for (const colKey of Object.keys(data)) {
          if (colKey === '_metadata') continue;
          if (Array.isArray(data[colKey])) {
            const meta = COLLECTION_METADATA[colKey] || { label: colKey, icon: '📁' };
            stats.push({
              name: colKey,
              label: meta.label,
              icon: meta.icon,
              count: data[colKey].length
            });
          }
        }

        const totalItems = stats.reduce((acc, curr) => acc + curr.count, 0);
        if (totalItems === 0) {
          addToast('Nenhum dado legível encontrado neste arquivo JSON.', 'error');
          e.target.value = '';
          return;
        }

        setPreviewData(data);
        setPreviewStats(stats);
        setShowConfirmModal(true);
      } catch (parseErr) {
        console.error(parseErr);
        addToast('O arquivo selecionado não é um arquivo JSON de backup válido.', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (!previewData) return;

    setIsImporting(true);
    setImportProgress(0);
    setShowConfirmModal(false);
    addToast('📤 Restaurando e mesclando registros no banco de dados...', 'info');

    try {
      const collections = Object.keys(previewData).filter(c => c !== '_metadata');
      let totalDocs = 0;
      collections.forEach(col => {
        if (Array.isArray(previewData[col])) {
          totalDocs += previewData[col].length;
        }
      });

      let importedCount = 0;
      for (const colName of collections) {
        const docsList = previewData[colName];
        if (!Array.isArray(docsList)) continue;

        for (const docItem of docsList) {
          if (!docItem.id || !docItem.data) continue;

          const restoredData = { ...docItem.data };
          for (const key in restoredData) {
            if (restoredData[key] && restoredData[key].__type === 'timestamp') {
              const { seconds, nanoseconds } = restoredData[key];
              restoredData[key] = new Timestamp(seconds, nanoseconds);
            } else if (restoredData[key] && restoredData[key].__type === 'date') {
              restoredData[key] = new Date(restoredData[key].value);
            }
          }

          await setDoc(doc(db, colName, docItem.id), restoredData, { merge: true });
          importedCount++;
          setImportProgress(Math.round((importedCount / totalDocs) * 100));
        }
      }

      addToast(`🎉 Backup restaurado com sucesso! ${importedCount} registros foram importados.`, 'success');
      setPreviewData(null);
      setPreviewStats([]);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      addToast('Erro ao importar o arquivo para o Firestore.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSetting = (key: keyof BackupReminderSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveBackupReminderSettings(updated);
    addToast('Preferências de lembrete atualizadas!', 'success');
  };

  const isTodayLastDay = () => {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return tomorrow.getMonth() !== today.getMonth();
  };

  const downloadHistoryBackup = (historyItem: any) => {
    try {
      const data = JSON.parse(historyItem.data);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_historico_${historyItem.monthRef.replace('/', '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(`Backup de ${historyItem.monthRef} baixado com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao processar arquivo de histórico.', 'error');
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 text-lg">💾</span>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight flex items-center gap-2">
                Gestão de Backup e Restauração
                {lastBackup ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    🟢 Ativo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    ⚠️ Pendente
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {lastBackup
                  ? `Último backup salvo: ${lastBackup.toLocaleDateString('pt-BR')} às ${lastBackup.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Nenhum backup baixado neste dispositivo ainda.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Botão Exportar */}
          <button
            onClick={handleExport}
            disabled={isExporting || isImporting}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Gerando Arquivo...
              </>
            ) : (
              <>
                <span>📥</span> Exportar Backup (.json)
              </>
            )}
          </button>

          {/* Botão Importar */}
          <label className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            <span>📤</span> Importar Backup
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isExporting || isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Opções de Backup Automático */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>📅</span> Backup Automático Mensal (Firestore)
            </h4>
            <p className="text-[11px] text-slate-500">
              O sistema gera um snapshot completo dos dados no último dia de cada mês para garantir a prestação de contas.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.remindOnLastDay}
                onChange={() => toggleSetting('remindOnLastDay')}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ms-2 text-[11px] font-bold text-slate-700">Ativado</span>
            </label>
          </div>
        </div>

        {isTodayLastDay() && (
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-amber-900">
              <span className="text-lg">⚡</span>
              <p className="text-[11px] font-black leading-tight">
                HOJE É O ÚLTIMO DIA DO MÊS!<br/>
                <span className="font-normal opacity-80">O backup automático será executado assim que você acessar as configurações.</span>
              </p>
            </div>
            {isAutoBackingUp ? (
              <span className="text-[10px] font-bold text-indigo-700 animate-pulse flex items-center gap-1">
                <span className="animate-spin text-sm">⚙️</span> Processando...
              </span>
            ) : (
              <button
                onClick={checkAndRunAutoBackup}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                FORÇAR AGORA
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lembretes de Dispositivo */}
      <div className="bg-white border border-gray-100 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-4 text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.remindOnOpenIfOld}
              onChange={() => toggleSetting('remindOnOpenIfOld')}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span>Avisar ao abrir o app se o backup local for antigo ({">"}25 dias)</span>
          </label>
        </div>
      </div>

      {/* Histórico de Snapshots Mensais */}
      {backupsHistory.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mt-2">
          <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
            <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
              <span>📜</span> Histórico de Snapshots Mensais (Firestore)
            </h4>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {backupsHistory.length} registros
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
            {backupsHistory.map((item) => (
              <div key={item.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50/50 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                    {item.monthRef}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-800">Backup de {item.monthRef}</p>
                    <p className="text-[10px] text-gray-400">
                      Gerado em {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('pt-BR') : '-'} • {item.totalRecords} registros
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadHistoryBackup(item)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition shadow-2xs group-hover:scale-105"
                  title="Baixar este snapshot"
                >
                  <span className="text-xs">📥</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Progresso durante a Importação */}
      {isImporting && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="animate-spin">⚙️</span> Gravando dados no Firebase Firestore...
            </span>
            <span className="font-black text-emerald-800">{importProgress}%</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden border border-emerald-200">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-700 mt-1.5 font-medium">
            Por favor, mantenha esta página aberta enquanto os registros são atualizados.
          </p>
        </div>
      )}

      {/* Modal de Pré-Visualização e Confirmação de Importação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2">
                  <span>📤</span> Confirmar Importação de Backup
                </h3>
                <p className="text-xs text-emerald-100">
                  Verifique os dados contidos no arquivo antes de restaurar
                </p>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPreviewData(null);
                }}
                className="text-white/70 hover:text-white transition cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-bold mb-0.5">Aviso Importante:</p>
                  <p>
                    A importação irá sincronizar e mesclar os dados contidos neste arquivo com o seu banco de dados atual. Nenhum dado com ID diferente será apagado.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  Itens encontrados no arquivo:
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {previewStats.map(stat => (
                    <div
                      key={stat.name}
                      className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{stat.icon}</span>
                        <span className="text-xs font-bold text-gray-700">{stat.label}</span>
                      </div>
                      <span className="text-xs font-black bg-white px-2 py-0.5 rounded-md border text-gray-800">
                        {stat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPreviewData(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={executeImport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>✅</span> Confirmar e Importar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
