import { jsPDF } from 'jspdf';
import { useToast } from './NotificationManager';

interface Game {
  id: string;
  gameNumbers: number[];
  contest?: string;
}

interface LottoFlyerGeneratorProps {
  games: Game[];
  onClose: () => void;
}

export default function LottoFlyerGenerator({ games, onClose }: LottoFlyerGeneratorProps) {
  const { addToast } = useToast();

  const generatePDF = () => {
    if (games.length === 0) {
      addToast('Nenhum jogo selecionado para impressão.', 'error');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Dimensions for a single Lotofácil flyer (approximate)
    const flyerWidth = 82;
    const flyerHeight = 180;
    const margin = 10;
    
    let currentX = margin;
    let currentY = margin;
    let gamesOnPage = 0;

    games.forEach((game, index) => {
      if (gamesOnPage >= 2) {
        doc.addPage();
        currentY = margin;
        currentX = margin;
        gamesOnPage = 0;
      }

      // Draw Flyer Border
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.1);
      doc.rect(currentX, currentY, flyerWidth, flyerHeight);

      // Header
      doc.setFillColor(128, 0, 128); // Purple
      doc.rect(currentX, currentY, flyerWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LOTOFÁCIL', currentX + flyerWidth / 2, currentY + 10, { align: 'center' });

      // Numbers Grid
      const gridMargin = 8;
      const cellWidth = 12;
      const cellHeight = 10;
      const startX = currentX + gridMargin;
      const startY = currentY + 25;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      for (let i = 0; i < 25; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const x = startX + col * (cellWidth + 2);
        const y = startY + row * (cellHeight + 2);
        const num = i + 1;

        // Draw cell border
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, cellWidth, cellHeight);
        
        // Center number in cell
        doc.text(String(num).padStart(2, '0'), x + cellWidth / 2, y + cellHeight / 2 + 1.5, { align: 'center' });

        // If number is in game, draw a mark (X or fill)
        if (game.gameNumbers.includes(num)) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          // Draw a thick X
          doc.line(x + 2, y + 2, x + cellWidth - 2, y + cellHeight - 2);
          doc.line(x + cellWidth - 2, y + 2, x + 2, y + cellHeight - 2);
          doc.setLineWidth(0.1);
        }
      }

      // Footer info
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Identificador do Jogo: ${game.id.slice(0, 8)}`, currentX + 5, currentY + flyerHeight - 5);
      if (game.contest) {
        doc.text(`Concurso Ref: ${game.contest}`, currentX + flyerWidth - 35, currentY + flyerHeight - 5);
      }

      // Move to next position
      currentY += flyerHeight + 10;
      gamesOnPage++;
    });

    doc.save('volantes_lotofacil.pdf');
    addToast('PDF gerado com sucesso!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-indigo-700 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black text-xl">Impressora de Volantes</h3>
            <p className="text-xs text-indigo-100 opacity-80 uppercase font-bold tracking-widest mt-1">Geração de PDF para A4</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition cursor-pointer">
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4">
            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm">🖨️</div>
            <div className="flex-1">
              <h4 className="font-bold text-indigo-900 text-sm">Pronto para Imprimir</h4>
              <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                O sistema gerará um arquivo PDF com os volantes marcados. Você pode imprimir em qualquer folha A4 e utilizar como referência ou para validação.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase">Resumo da Impressão</span>
              <span className="text-xs font-black text-indigo-700">{games.length} {games.length === 1 ? 'Jogo' : 'Jogos'}</span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {games.map((game, i) => (
                <div key={game.id} className="p-3 flex justify-between items-center bg-gray-50/30">
                  <span className="text-xs font-bold text-gray-600">Volante #{i + 1}</span>
                  <div className="flex gap-1">
                    {game.gameNumbers.slice(0, 5).map(n => (
                      <span key={n} className="text-[10px] bg-white border border-gray-200 w-5 h-5 rounded flex items-center justify-center font-bold text-gray-700">
                        {n}
                      </span>
                    ))}
                    <span className="text-[10px] text-gray-400">...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={generatePDF}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-4 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📥</span> Baixar PDF para Impressão
            </button>
            <p className="text-[10px] text-gray-400 text-center font-medium italic">
              Dica: Na hora de imprimir, selecione "Tamanho Real" ou "Escala 100%" nas configurações da impressora.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
