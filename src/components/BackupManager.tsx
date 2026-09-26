import { useState, useEffect } from 'react';
import { doc, setDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';
import { getIsAdmin } from '../lib/authHelpers';
import {
  downloadFullBackup,
  getLastBackupDate,
  getBackupReminderSettings,
  saveBackupReminderSettings,
  BackupReminderSettings,
  saveBackupToFirestore,
  saveDailyCloudBackupToFirestore,
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
  const isAdmin = getIsAdmin();

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
    
    setIsAutoBackingUp(true);
    try {
      const res = await saveDailyCloudBackupToFirestore();
      setLastBackup(new Date());
      if (res.isNew) {
        addToast(`☁️ Backup Diário na Nuvem gerado com sucesso para hoje! (${res.totalRecords} registros salvos)`, 'success');
      }
      loadHistory();
    } catch (err) {
      console.error('Auto daily backup error:', err);
    } finally {
      setIsAutoBackingUp(false);
    }
  };

  const handleRunDailyCloudBackup = async () => {
    setIsAutoBackingUp(true);
    addToast('☁️ Sincronizando e gravando backup diário na nuvem (Firebase)...', 'info');
    try {
      const res = await saveDailyCloudBackupToFirestore();
      setLastBackup(new Date());
      if (res.isNew) {
        addToast(`🎉 Backup Diário na Nuvem criado com sucesso! (${res.totalRecords} registros protegidos)`, 'success');
      } else {
        addToast(`🟢 O backup diário de hoje (${new Date().toLocaleDateString('pt-BR')}) já está salvo e atualizado na nuvem!`, 'info');
      }
      loadHistory();
    } catch (err) {
      console.error('Erro no backup diário:', err);
      addToast('Erro ao gravar backup diário na nuvem.', 'error');
    } finally {
      setIsAutoBackingUp(false);
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
      link.download = `backup_bolao_historico_${historyItem.monthRef.replace('/', '_')}.json`;
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

  // Estado para Backup em PDF por Período
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [pdfStartDate, setPdfStartDate] = useState(thirtyDaysAgoStr);
  const [pdfEndDate, setPdfEndDate] = useState(todayStr);
  const [pdfPreset, setPdfPreset] = useState<'30_days' | 'this_month' | 'last_month' | 'all_time' | 'custom'>('30_days');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSections, setPdfSections] = useState({
    financialSummary: true,
    games: true,
    payments: true,
    members: true,
  });

  const applyPdfPreset = (preset: '30_days' | 'this_month' | 'last_month' | 'all_time' | 'custom') => {
    setPdfPreset(preset);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === '30_days') {
      start.setDate(now.getDate() - 30);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'all_time') {
      start = new Date(2020, 0, 1);
    } else {
      return;
    }

    setPdfStartDate(start.toISOString().split('T')[0]);
    setPdfEndDate(end.toISOString().split('T')[0]);
  };

  const generatePdfReport = async () => {
    setIsGeneratingPdf(true);
    addToast('📄 Compilando dados e gerando documento PDF do período...', 'info');

    try {
      const startObj = new Date(pdfStartDate + 'T00:00:00');
      const endObj = new Date(pdfEndDate + 'T23:59:59');

      const [gamesSnap, membersSnap, paymentsSnap] = await Promise.all([
        getDocs(collection(db, 'games')),
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'payments'))
      ]);

      const allGames = gamesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filteredGames = allGames.filter((g: any) => {
        let gDate = g.createdAt?.seconds ? new Date(g.createdAt.seconds * 1000) : null;
        if (!gDate && g.date) gDate = new Date(g.date);
        if (!gDate) return true;
        return gDate >= startObj && gDate <= endObj;
      });

      const allPayments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filteredPayments = allPayments.filter((p: any) => {
        let pDate = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : null;
        if (!pDate && p.date) pDate = new Date(p.date);
        if (!pDate) return true;
        return pDate >= startObj && pDate <= endObj;
      });

      const membersList = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const totalCollected = filteredPayments
        .filter((p: any) => p.status === 'approved' || p.status === 'Pago' || !p.status)
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

      const totalGamesCost = filteredGames
        .reduce((sum: number, g: any) => sum + (Number(g.totalPrice || g.cost) || 0), 0);

      const formattedStart = startObj.toLocaleDateString('pt-BR');
      const formattedEnd = endObj.toLocaleDateString('pt-BR');
      const generatedNow = new Date().toLocaleString('pt-BR');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Backup e Relatório PDF - Bolão Amigos (${formattedStart} a ${formattedEnd})</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 15px; font-size: 11px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 18px; }
            .title { font-size: 18px; font-weight: 800; color: #1e3a8a; margin: 0; }
            .subtitle { font-size: 11px; color: #475569; margin-top: 4px; }
            .badge { background: #dbeafe; color: #1e40af; font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
            
            .grid-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .card-summary { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; }
            .card-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            .card-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; }

            section { margin-bottom: 20px; }
            h2 { font-size: 13px; font-weight: 800; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 9px; }
            td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            tr:nth-child(even) { background: #f8fafc; }
            
            .status-tag { font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block; }
            .status-approved { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }

            .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; pt: 12px; text-align: center; font-size: 9px; color: #94a3b8; }
            .signature-area { margin-top: 35px; display: flex; justify-content: space-around; text-align: center; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .signature-line { width: 180px; border-top: 1px solid #94a3b8; margin-top: 35px; padding-top: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Bolão Amigos — Relatório & Backup em PDF</h1>
              <div class="subtitle">Período: <strong>${formattedStart}</strong> até <strong>${formattedEnd}</strong></div>
            </div>
            <div style="text-align: right;">
              <span class="badge">📄 Backup Oficial em PDF</span>
              <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Gerado em: ${generatedNow}</div>
            </div>
          </div>

          ${pdfSections.financialSummary ? `
          <div class="grid-summary">
            <div class="card-summary">
              <div class="card-label">Arrecadado no Período</div>
              <div class="card-val" style="color: #15803d;">R$ ${totalCollected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card-summary">
              <div class="card-label">Custo Total Apostas</div>
              <div class="card-val" style="color: #1e40af;">R$ ${totalGamesCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card-summary">
              <div class="card-label">Jogos do Período</div>
              <div class="card-val">${filteredGames.length}</div>
            </div>
            <div class="card-summary">
              <div class="card-label">Comprovantes Salvos</div>
              <div class="card-val">${filteredPayments.length}</div>
            </div>
          </div>
          ` : ''}

          ${pdfSections.games ? `
          <section>
            <h2>🎟️ Apostas e Jogos Registrados (${filteredGames.length})</h2>
            ${filteredGames.length === 0 ? '<p style="color:#64748b;">Nenhum jogo cadastrado neste período.</p>' : `
            <table>
              <thead>
                <tr>
                  <th>Concurso</th>
                  <th>Modalidade</th>
                  <th>Dezenas / Apostas</th>
                  <th>Qtd. Jogos</th>
                  <th>Valor Total (R$)</th>
                </tr>
              </thead>
              <tbody>
                ${filteredGames.map((g: any) => `
                  <tr>
                    <td><strong>#${g.contest || 'N/A'}</strong></td>
                    <td>${g.type || g.lotteryType || 'Lotofácil'}</td>
                    <td>${Array.isArray(g.numbers) ? g.numbers.slice(0, 15).join(', ') : (g.description || 'Aposta Especial')}</td>
                    <td>${g.totalGames || 1} jogo(s)</td>
                    <td><strong>R$ ${(Number(g.totalPrice || g.cost) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            `}
          </section>
          ` : ''}

          ${pdfSections.payments ? `
          <section>
            <h2>💳 Comprovantes e Movimentações Financeiras (${filteredPayments.length})</h2>
            ${filteredPayments.length === 0 ? '<p style="color:#64748b;">Nenhum pagamento registrado neste período.</p>' : `
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Participante</th>
                  <th>Valor (R$)</th>
                  <th>Status</th>
                  <th>Método</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPayments.map((p: any) => {
                  const pDateStr = p.createdAt?.seconds 
                    ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('pt-BR') 
                    : (p.date || 'N/A');
                  const isApproved = p.status === 'approved' || p.status === 'Pago' || !p.status;
                  return `
                    <tr>
                      <td>${pDateStr}</td>
                      <td><strong>${p.userName || p.displayName || p.email || 'Participante'}</strong></td>
                      <td>R$ ${(Number(p.amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td><span class="status-tag ${isApproved ? 'status-approved' : 'status-pending'}">${isApproved ? 'Aprovado' : 'Pendente'}</span></td>
                      <td>${p.paymentMethod || 'PIX'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            `}
          </section>
          ` : ''}

          ${pdfSections.members ? `
          <section>
            <h2>👥 Integrantes do Bolão (${membersList.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Nome do Participante</th>
                  <th>Contato</th>
                  <th>Papel</th>
                  <th>Cotas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${membersList.map((m: any) => `
                  <tr>
                    <td><strong>${m.displayName || m.name || 'Participante'}</strong></td>
                    <td>${m.email || m.phone || 'N/A'}</td>
                    <td>${m.role === 'admin' ? 'Administrador' : (m.role === 'counselor' ? 'Conselheiro' : 'Participante')}</td>
                    <td>${m.quotas || 1} cota(s)</td>
                    <td><span class="status-tag ${m.paymentStatus === 'Pago' ? 'status-approved' : 'status-pending'}">${m.paymentStatus || 'Ativo'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
          ` : ''}

          <div class="signature-area">
            <div>
              <div class="signature-line">Administrador Responsável</div>
            </div>
            <div>
              <div class="signature-line">Conselho Fiscal</div>
            </div>
          </div>

          <div class="footer">
            Documento emitido pelo sistema Bolão Amigos Gestor em ${generatedNow}
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `;

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        addToast('🎉 PDF gerado! Selecione "Salvar como PDF" na janela de impressão.', 'success');
      } else {
        addToast('Janela bloqueada pelo navegador. Permita pop-ups para gerar o PDF.', 'error');
      }

    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      addToast('Erro ao compilar dados do período para PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
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
          {/* Botão Exportar JSON (Cópia Física) */}
          <button
            onClick={handleExport}
            disabled={isExporting || isImporting}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Baixar cópia legível de todos os dados do grupo via navegador"
          >
            {isExporting ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Baixando JSON...
              </>
            ) : (
              <>
                <span>📥</span> Exportar JSON (Cópia Física)
              </>
            )}
          </button>

          {/* Botão Importar */}
          <label className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95">
            <span>📤</span> Importar / Restaurar JSON
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

      {/* Informativo de Cópia Física e Download pelo Navegador */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-950">
        <span className="text-lg shrink-0">💻</span>
        <div>
          <span className="font-black text-blue-900 block">Cópia de Segurança Local (Fora da Nuvem)</span>
          <span className="text-[11px] text-blue-800 leading-tight block">
            Utilize o botão principal <strong>📥 Exportar JSON (Cópia Física)</strong> acima para baixar o arquivo completo direto para o seu computador ou celular via navegador.
          </span>
        </div>
      </div>

      {/* Opções de Backup Diário Automático na Nuvem */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>☁️</span> Backup Diário Automático na Nuvem (Firebase)
            </h4>
            <p className="text-[11px] text-slate-600">
              O aplicativo salva automaticamente um snapshot completo de segurança no Firebase Cloud Firestore a cada dia que o grupo interage.
            </p>
          </div>

          <button
            onClick={handleRunDailyCloudBackup}
            disabled={isAutoBackingUp || isExporting || isImporting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            {isAutoBackingUp ? (
              <>
                <span className="animate-spin text-sm">⚙️</span> Salvando na Nuvem...
              </>
            ) : (
              <>
                <span>⚡</span> Gerar Backup Diário na Nuvem
              </>
            )}
          </button>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-base">🟢</span>
            <span>Status: Cópia Diária na Nuvem Ativa e Sincronizada</span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-950 font-black px-2 py-0.5 rounded-full uppercase">
            Data: {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* CARD: BACKUP EM PDF COM ESCOLHA DE PERÍODO */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
          <div>
            <h4 className="text-sm font-black text-blue-950 flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg text-xs">📄</span>
              Backup e Relatório em PDF por Período
            </h4>
            <p className="text-xs text-blue-800 mt-0.5">
              Escolha o período desejado e gere um documento impresso/PDF formatado com extratos, jogos e membros.
            </p>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-300 font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
            Pronto para Impressão
          </span>
        </div>

        {/* Atalhos Rápidos de Período */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-700 block">1. Selecione um Período Rápido:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: '30_days', label: 'Últimos 30 Dias' },
              { id: 'this_month', label: 'Este Mês' },
              { id: 'last_month', label: 'Mês Anterior' },
              { id: 'all_time', label: 'Todo o Histórico (Completo)' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPdfPreset(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  pdfPreset === p.id
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intervalo de Datas Personalizado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-blue-100">
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">📅 Data Inicial:</label>
            <input
              type="date"
              value={pdfStartDate}
              onChange={(e) => {
                setPdfStartDate(e.target.value);
                setPdfPreset('custom');
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800 focus:outline-blue-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">📅 Data Final:</label>
            <input
              type="date"
              value={pdfEndDate}
              onChange={(e) => {
                setPdfEndDate(e.target.value);
                setPdfPreset('custom');
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800 focus:outline-blue-600"
            />
          </div>
        </div>

        {/* Seleção de Conteúdo */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-700 block">2. Conteúdo a incluir no PDF:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer font-bold text-gray-700">
              <input
                type="checkbox"
                checked={pdfSections.financialSummary}
                onChange={(e) => setPdfSections(prev => ({ ...prev, financialSummary: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>📊 Resumo Caixa</span>
            </label>
            <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer font-bold text-gray-700">
              <input
                type="checkbox"
                checked={pdfSections.games}
                onChange={(e) => setPdfSections(prev => ({ ...prev, games: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>🎟️ Jogos & Apostas</span>
            </label>
            <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer font-bold text-gray-700">
              <input
                type="checkbox"
                checked={pdfSections.payments}
                onChange={(e) => setPdfSections(prev => ({ ...prev, payments: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>💳 Comprovantes</span>
            </label>
            <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer font-bold text-gray-700">
              <input
                type="checkbox"
                checked={pdfSections.members}
                onChange={(e) => setPdfSections(prev => ({ ...prev, members: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>👥 Participantes</span>
            </label>
          </div>
        </div>

        {/* Botão de Geração */}
        <div className="pt-2">
          <button
            type="button"
            onClick={generatePdfReport}
            disabled={isGeneratingPdf}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-3 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isGeneratingPdf ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Gerando Documento PDF...
              </>
            ) : (
              <>
                <span>📄</span> Gerar e Baixar Backup em PDF do Período ({new Date(pdfStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} à {new Date(pdfEndDate + 'T00:00:00').toLocaleDateString('pt-BR')})
              </>
            )}
          </button>
        </div>
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
            <span>Avisar se o backup local baixado no computador for antigo ({">"}25 dias)</span>
          </label>
        </div>
      </div>

      {/* Histórico de Snapshots na Nuvem (Diários e Mensais) */}
      {backupsHistory.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mt-2">
          <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
            <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
              <span>📜</span> Histórico de Backups Salvos na Nuvem (Firestore)
            </h4>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {backupsHistory.length} salvamento(s)
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {backupsHistory.map((item) => (
              <div key={item.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50/50 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                    {item.type === 'daily_cloud' ? '☁️' : '📅'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-bold text-gray-800">
                        {item.type === 'daily_cloud' ? `Backup Diário (${item.dateRef || item.monthRef})` : `Backup Mensal (${item.monthRef})`}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase ${
                        item.type === 'daily_cloud' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type === 'daily_cloud' ? 'Diário Nuvem' : 'Mensal'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Gerado em {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'} • {item.totalRecords} registros
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadHistoryBackup(item)}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition shadow-2xs group-hover:scale-105 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  title="Baixar este snapshot para seu computador"
                >
                  <span>📥</span>
                  <span className="hidden xs:inline">Baixar</span>
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
