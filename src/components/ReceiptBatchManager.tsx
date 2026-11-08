import React, { useState, useMemo } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useData } from '../lib/DataContext';
import { useToast } from './NotificationManager';
import { formatAnyDateBR } from '../lib/formatters';

interface MonthReceiptGroup {
  monthKey: string;     // YYYY-MM
  monthLabel: string;   // MM/YYYY
  dateObj: Date;
  isOlderThan6Months: boolean;
  items: any[];
  totalAmount: number;
}

export default function ReceiptBatchManager() {
  const { payments } = useData();
  const { addToast } = useToast();

  const [selectedMonthToDelete, setSelectedMonthToDelete] = useState<MonthReceiptGroup | null>(null);
  const [selectedMonthForView, setSelectedMonthForView] = useState<MonthReceiptGroup | null>(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<any | null>(null);
  const [isDeleting6Months, setIsDeleting6Months] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // Calcula a data limite de 6 meses atrás
  const sixMonthsAgoLimit = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Agrupa todos os comprovantes/pagamentos por Mês/Ano (MM/YYYY)
  const monthGroups = useMemo<MonthReceiptGroup[]>(() => {
    const map = new Map<string, MonthReceiptGroup>();

    payments.forEach(p => {
      let pDate: Date | null = null;
      let m = '';
      let y = 0;
      let monthKey = '';
      let monthLabel = '';

      // Prioridade: mês de referência do pagamento/comprovante (ex: '10/2026' ou '11/2026')
      const pMonthStr = String(p.month || p.referenceMonth || '').trim();
      if (/^\d{1,2}\/\d{4}$/.test(pMonthStr)) {
        const parts = pMonthStr.split('/');
        m = parts[0].padStart(2, '0');
        y = Number(parts[1]);
        monthKey = `${y}-${m}`;
        monthLabel = `${m}/${y}`;
        pDate = new Date(y, Number(m) - 1, 1);
      } else {
        if (p.createdAt?.toDate && typeof p.createdAt.toDate === 'function') {
          pDate = p.createdAt.toDate();
        } else if (p.createdAt?.seconds) {
          pDate = new Date(p.createdAt.seconds * 1000);
        } else if (p.date) {
          pDate = new Date(p.date);
        }

        if (!pDate || isNaN(pDate.getTime())) {
          pDate = new Date(2025, 0, 1);
        }

        m = String(pDate.getMonth() + 1).padStart(2, '0');
        y = pDate.getFullYear();
        monthKey = `${y}-${m}`;
        monthLabel = `${m}/${y}`;
      }

      if (!map.has(monthKey)) {
        // Mês considerado > 6 meses se o início do mês for anterior ao limite de 6 meses atrás
        const startOfMonth = new Date(y, pDate.getMonth(), 1, 0, 0, 0);
        const isOlderThan6Months = startOfMonth < sixMonthsAgoLimit;

        map.set(monthKey, {
          monthKey,
          monthLabel,
          dateObj: pDate,
          isOlderThan6Months,
          items: [],
          totalAmount: 0
        });
      }

      const grp = map.get(monthKey)!;
      grp.items.push(p);
      grp.totalAmount += Number(p.amount || 0);
    });

    const list = Array.from(map.values());
    // Ordena do mês mais recente para o mais antigo
    list.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    return list;
  }, [payments, sixMonthsAgoLimit]);

  // Lista de grupos com mais de 6 meses de antiguidade
  const olderThan6MonthsGroups = useMemo(() => {
    return monthGroups.filter(g => g.isOlderThan6Months);
  }, [monthGroups]);

  // Total de comprovantes e valor acumulado com mais de 6 meses
  const totalOlderPaymentsCount = useMemo(() => {
    return olderThan6MonthsGroups.reduce((sum, g) => sum + g.items.length, 0);
  }, [olderThan6MonthsGroups]);

  const totalOlderAmount = useMemo(() => {
    return olderThan6MonthsGroups.reduce((sum, g) => sum + g.totalAmount, 0);
  }, [olderThan6MonthsGroups]);

  // Função auxiliar de exclusão em lotes via writeBatch
  const executeBatchDelete = async (paymentIds: string[]) => {
    if (paymentIds.length === 0) return;

    const BATCH_SIZE = 450;
    for (let i = 0; i < paymentIds.length; i += BATCH_SIZE) {
      const chunk = paymentIds.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(id => {
        batch.delete(doc(db, 'payments', id));
      });
      await batch.commit();
    }
  };

  // Excluir lote de um mês específico
  const handleDeleteMonthBatch = async () => {
    if (!selectedMonthToDelete) return;

    setIsDeletingBatch(true);
    addToast(`🧹 Excluindo ${selectedMonthToDelete.items.length} comprovantes do mês ${selectedMonthToDelete.monthLabel}...`, 'info');

    try {
      const idsToDelete = selectedMonthToDelete.items.map(p => p.id).filter(Boolean);
      await executeBatchDelete(idsToDelete);

      // Atualiza cache local
      try {
        const cached = localStorage.getItem('bolao_cache_payments');
        if (cached) {
          const list = JSON.parse(cached);
          const updated = list.filter((p: any) => !idsToDelete.includes(p.id));
          localStorage.setItem('bolao_cache_payments', JSON.stringify(updated));
        }
      } catch {}

      addToast(`🎉 ${idsToDelete.length} comprovantes do mês ${selectedMonthToDelete.monthLabel} excluídos com sucesso!`, 'success');
      setSelectedMonthToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir comprovantes em lote:', err);
      addToast('Erro ao excluir comprovantes do mês.', 'error');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Excluir todos os comprovantes antigos com mais de 6 meses
  const handleDeleteAllOlderThan6Months = async () => {
    if (totalOlderPaymentsCount === 0) return;

    setIsDeleting6Months(true);
    addToast(`🧹 Excluindo todos os ${totalOlderPaymentsCount} comprovantes com mais de 6 meses...`, 'info');

    try {
      const idsToDelete: string[] = [];
      olderThan6MonthsGroups.forEach(grp => {
        grp.items.forEach(p => {
          if (p.id) idsToDelete.push(p.id);
        });
      });

      await executeBatchDelete(idsToDelete);

      // Atualiza cache local
      try {
        const cached = localStorage.getItem('bolao_cache_payments');
        if (cached) {
          const list = JSON.parse(cached);
          const updated = list.filter((p: any) => !idsToDelete.includes(p.id));
          localStorage.setItem('bolao_cache_payments', JSON.stringify(updated));
        }
      } catch {}

      addToast(`🎉 Sucesso! ${idsToDelete.length} comprovantes antigos com mais de 6 meses foram removidos.`, 'success');
    } catch (err) {
      console.error('Erro ao limpar comprovantes antigos:', err);
      addToast('Erro ao apagar comprovantes antigos com mais de 6 meses.', 'error');
    } finally {
      setIsDeleting6Months(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 text-white rounded-xl text-xs shadow-3xs">🧾</span>
            Exclusão de Comprovantes em Lote por Mês
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Gerencie e apague comprovantes antigos para otimizar o banco de dados e manter o aplicativo super leve.
          </p>
        </div>
        <span className="text-[10px] bg-indigo-100 text-indigo-900 border border-indigo-300 font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
          {payments.length} comprovantes salvos
        </span>
      </div>

      {/* LEMBRETE AUTOMÁTICO DE LIMPEZA (> 6 MESES ATRÁS) */}
      {totalOlderPaymentsCount > 0 ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl p-1.5 bg-amber-100 rounded-xl shrink-0">🔔</span>
            <div className="space-y-1">
              <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
                Lembrete de Manutenção: Comprovantes Antigos Detectados
                <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {totalOlderPaymentsCount} arquivo(s) &gt; 6 meses
                </span>
              </h5>
              <p className="text-xs text-amber-900 leading-relaxed">
                Você possui <strong>{totalOlderPaymentsCount} comprovantes antigos</strong> cadastrados há mais de 6 meses (anteriores a {formatAnyDateBR(sixMonthsAgoLimit)}). Apagar comprovantes antigos mantém a nuvem limpa sem alterar os pagamentos homologados dos membros.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/80">
            <div className="text-[11px] font-bold text-amber-800">
              Meses antigos: {olderThan6MonthsGroups.map(g => g.monthLabel).join(', ')} (Total: R$ {totalOlderAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </div>
            <button
              onClick={handleDeleteAllOlderThan6Months}
              disabled={isDeleting6Months}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isDeleting6Months ? (
                <>
                  <span className="animate-spin text-sm">⚙️</span> Apagando...
                </>
              ) : (
                <>
                  <span>🧹</span> Limpar Todos com Mais de 6 Meses ({totalOlderPaymentsCount})
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-900 font-semibold">
          <span className="text-lg shrink-0">🟢</span>
          <span>
            <strong>Comprovantes em dia:</strong> Nenhum comprovante com mais de 6 meses de antiguidade encontrado no banco.
          </span>
        </div>
      )}

      {/* LISTAGEM DOS LOTES POR MÊS */}
      <div className="space-y-2 pt-1">
        <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>📅 Lotes de Comprovantes Organizados por Mês:</span>
          <span className="text-[10px] text-slate-500 font-bold">{monthGroups.length} mês(es) cadastrado(s)</span>
        </h5>

        {monthGroups.length === 0 ? (
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
            Nenhum comprovante arquivado no histórico no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {monthGroups.map(grp => (
              <React.Fragment key={grp.monthKey}>
                <div
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 shadow-3xs ${
                    grp.isOlderThan6Months
                      ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900">
                        Mês {grp.monthLabel}
                      </span>
                      {grp.isOlderThan6Months && (
                        <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md uppercase">
                          &gt; 6 Meses
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {grp.items.length} {grp.items.length === 1 ? 'comprovante' : 'comprovantes'} • R$ {grp.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedMonthForView(grp)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-black transition cursor-pointer shrink-0 active:scale-95 flex items-center gap-1"
                      title={`Visualizar comprovantes de ${grp.monthLabel}`}
                    >
                      <span>👁️</span> Visualizar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMonthToDelete(grp)}
                      disabled={isDeletingBatch || isDeleting6Months}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-black transition cursor-pointer shrink-0 disabled:opacity-50 active:scale-95 flex items-center gap-1"
                      title={`Excluir todos os comprovantes de ${grp.monthLabel}`}
                    >
                      <span>🗑️</span> Excluir Mês
                    </button>
                  </div>
                </div>

                {/* MODAL DE VISUALIZAÇÃO DOS COMPROVANTES DO MÊS */}
                {selectedMonthForView && selectedMonthForView.monthKey === grp.monthKey && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
                      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-4 text-white flex justify-between items-center">
                        <h3 className="font-black text-sm">Comprovantes: {grp.monthLabel}</h3>
                        <button onClick={() => setSelectedMonthForView(null)} className="text-white/80 hover:text-white transition text-xl cursor-pointer">✕</button>
                      </div>
                      <div className="p-4 overflow-y-auto flex-1 space-y-3">
                        {grp.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900">{item.memberName || item.name || 'Sem nome'}</p>
                              <p className="text-[10px] text-gray-500 font-medium">R$ {Number(item.amount || 0).toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => setSelectedReceiptForView(item)}
                              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold cursor-pointer hover:bg-blue-700"
                            >
                              Ver
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL DE VISUALIZAÇÃO DE IMAGEM ÚNICA */}
                {selectedReceiptForView && (
                  <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4" onClick={() => setSelectedReceiptForView(null)}>
                    <div className="bg-white p-2 rounded-2xl max-w-lg w-full flex flex-col shadow-2xl">
                      <img src={selectedReceiptForView.receiptURL || selectedReceiptForView.imageBase64} alt="Comprovante" className="max-h-[75vh] object-contain rounded-xl" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DO MÊS */}
      {selectedMonthToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-black text-base flex items-center gap-2">
                <span>⚠️</span> Excluir Comprovantes de {selectedMonthToDelete.monthLabel}
              </h3>
              <button
                onClick={() => setSelectedMonthToDelete(null)}
                className="text-white/70 hover:text-white transition cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-950 space-y-1">
                <p className="font-bold">Aviso de Exclusão em Lote:</p>
                <p>
                  Você está prestes a excluir permanentemente <strong>{selectedMonthToDelete.items.length} comprovantes</strong> referentes ao mês de <strong>{selectedMonthToDelete.monthLabel}</strong> (Total: R$ {selectedMonthToDelete.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
                </p>
                <p className="text-[11px] text-red-800 pt-1 font-semibold">
                  * Os status de participantes que já pagaram não serão alterados, apenas os arquivos de comprovante desse mês serão apagados.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedMonthToDelete(null)}
                  disabled={isDeletingBatch}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMonthBatch}
                  disabled={isDeletingBatch}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {isDeletingBatch ? (
                    <>
                      <span className="animate-spin text-sm">⚙️</span> Excluindo...
                    </>
                  ) : (
                    <>
                      <span>🗑️</span> Confirmar Exclusão do Lote
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
