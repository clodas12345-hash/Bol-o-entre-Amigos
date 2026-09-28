import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatFirstAndLastName } from '../lib/formatters';
import { downloadOrShareFile } from '../lib/fileDownloadHelper';

export default function ExportButton() {
  const exportToCSV = async () => {
    try {
      const [paymentsSnap, usersSnap, membersSnap] = await Promise.all([
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'members'))
      ]);

      const memberMap: Record<string, string> = {};
      usersSnap.docs.forEach(d => {
        const data = d.data();
        memberMap[d.id] = formatFirstAndLastName(data.displayName || data.email || 'Participante');
      });
      membersSnap.docs.forEach(d => {
        const data = d.data();
        memberMap[d.id] = formatFirstAndLastName(data.displayName || data.email || 'Participante');
      });

      const payments = paymentsSnap.docs.map(doc => doc.data());

      let csvContent = '\uFEFF'; // BOM para o Excel abrir com acentuação correta em PT-BR
      csvContent += 'Mês de Referência,Participante,Valor (R$),Data do Registro\n';

      payments.forEach(p => {
        const memberName = memberMap[p.userId] || p.userId || 'Não identificado';
        const val = Number(p.amount || 0).toFixed(2).replace('.', ',');
        const mes = `"${p.month || '-'}"`;
        let dataStr = '-';
        if (p.createdAt?.toDate) {
          dataStr = `"${p.createdAt.toDate().toLocaleDateString('pt-BR')}"`;
        }
        csvContent += `${mes},"${memberName}",${val},${dataStr}\n`;
      });

      await downloadOrShareFile({
        fileName: `prestacao_contas_bolao_${new Date().toISOString().split('T')[0]}.csv`,
        content: csvContent,
        mimeType: 'text/csv;charset=utf-8;'
      });
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
    }
  };

  return (
    <button
      onClick={exportToCSV}
      title="Baixar planilha para Excel / Google Planilhas"
      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded font-medium shadow-sm transition flex items-center gap-1"
    >
      <span>📊</span> Exportar CSV
    </button>
  );
}
