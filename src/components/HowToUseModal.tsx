import React from 'react';

interface HowToUseModalProps {
  onClose: () => void;
}

export default function HowToUseModal({ onClose }: HowToUseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span>📖</span> Como Usar o Bolão
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-2">✕</button>
        </div>
        
        <div className="space-y-4 text-xs sm:text-sm text-gray-700">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <h4 className="font-black text-blue-900 mb-1">1. Apostas</h4>
            <p>Quando uma rodada estiver liberada, selecione seus números nos volantes e envie para validação. Você verá uma notificação de sucesso após o administrador confirmar.</p>
          </div>
          
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <h4 className="font-black text-emerald-900 mb-1">2. Pagamentos</h4>
            <p>Os pagamentos devem ser realizados via PIX conforme as instruções da administração. Mantenha seu cadastro atualizado.</p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
            <h4 className="font-black text-purple-900 mb-1">3. Acompanhar Resultados</h4>
            <p>Na tela principal, você pode conferir o concurso vigente, os números sorteados pela Caixa e o desempenho das apostas do bolão em tempo real.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
