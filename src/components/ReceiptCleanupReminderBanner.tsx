import { useState, useEffect, useMemo } from 'react';
import { useData } from '../lib/DataContext';
import { usePermissions } from '../lib/PermissionsContext';
import { Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { formatAnyDateBR } from '../lib/formatters';

export default function ReceiptCleanupReminderBanner() {
  const { payments } = useData();
  const { isAdmin } = usePermissions();
  
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('bolao_receipt_cleanup_dismissed') === new Date().toISOString().slice(0, 7);
  });

  const sixMonthsAgoLimit = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const olderPayments = useMemo(() => {
    return payments.filter(p => {
      let pDate: Date | null = null;
      if (p.createdAt?.toDate) pDate = p.createdAt.toDate();
      else if (p.createdAt?.seconds) pDate = new Date(p.createdAt.seconds * 1000);
      else if (p.date) pDate = new Date(p.date);
      
      return pDate && pDate < sixMonthsAgoLimit;
    });
  }, [payments, sixMonthsAgoLimit]);

  if (!isAdmin || dismissed || olderPayments.length === 0) return null;

  return (
    <div className="mb-4 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white p-4 rounded-2xl shadow-lg border border-amber-400/40 animate-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🧹
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
              Limpeza de Comprovantes Antigos
              <span className="bg-white text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                {olderPayments.length} arquivos &gt; 6 meses
              </span>
            </h4>
            <p className="text-[11px] text-amber-100 mt-0.5 leading-relaxed">
              Existem comprovantes cadastrados há mais de 6 meses (anteriores a {formatAnyDateBR(sixMonthsAgoLimit)}). 
              Recomendamos apagar os arquivos antigos para otimizar o armazenamento da nuvem.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('bolao_navigate_to', { detail: { path: '/contatos' } }));
              // Small delay to let navigation happen, then maybe we can trigger a state but let's just go there
            }}
            className="flex-1 sm:flex-initial bg-white hover:bg-amber-50 text-amber-950 font-black text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 size={14} />
            <span>Limpar Agora</span>
          </button>
          
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem('bolao_receipt_cleanup_dismissed', new Date().toISOString().slice(0, 7));
            }}
            className="text-amber-100/80 hover:text-white text-xs px-2 py-1 rounded-lg transition cursor-pointer"
          >
            Ignorar este mês
          </button>
        </div>
      </div>
    </div>
  );
}
