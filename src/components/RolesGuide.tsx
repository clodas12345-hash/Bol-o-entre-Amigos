import PageHeader from './PageHeader';

export default function RolesGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Manual de Permissões e Perfis"
        subtitle="Entenda o que Administradores, Conselheiros e Participantes podem realizar no aplicativo"
        icon="🛡️"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Administrador */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Gestão Total
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Administradores</h3>
              <p className="text-[11px] text-purple-700 font-semibold">Você + até 2 Administradores</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600 border-t pt-3">
            <p className="font-semibold text-gray-800 mb-1">O que o Administrador faz:</p>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Aprova ou rejeita novos cadastros no grupo.</li>
              <li>Cadastra, edita e gerencia os jogos e apostas da Lotofácil.</li>
              <li>Atualiza os resultados oficiais dos concursos da Caixa.</li>
              <li>Confirma e gerencia pagamentos mensais e comprovantes PIX.</li>
              <li>Abre ou fecha o Chat do grupo para manter a ordem.</li>
              <li>Edita as regras, datas e eventos da Agenda.</li>
              <li>Dispara comunicados automáticos via WhatsApp Hub.</li>
            </ul>
          </div>
        </div>

        {/* Conselheiros */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Moderação
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Conselheiros</h3>
              <p className="text-[11px] text-blue-700 font-semibold">Membros com permissões especiais</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600 border-t pt-3">
            <p className="font-semibold text-gray-800 mb-1">O que os Conselheiros fazem:</p>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Auxiliam na conferência de comprovantes enviados pelos participantes.</li>
              <li>Ajudam a fiscalizar o registro de bilhetes e conferência de acertos.</li>
              <li>Colaboram na moderação do chat do grupo.</li>
              <li>Dão suporte aos novos membros na entrada do app.</li>
              <li>Participam ativamente das votações estratégicas.</li>
            </ul>
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Membros
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Participantes</h3>
              <p className="text-[11px] text-emerald-700 font-semibold">Cotistas do Bolão</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600 border-t pt-3">
            <p className="font-semibold text-gray-800 mb-1">O que os Participantes fazem:</p>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Entram rapidamente via celular ou conta Google.</li>
              <li>Visualizam extrato financeiro, cotas ativas e saldo acumulado.</li>
              <li>Enviam comprovantes de PIX direto pelo app ou chat com foto.</li>
              <li>Acompanham os jogos cadastrados e o histórico de prêmios.</li>
              <li>Participam do chat e votam nas enquetes do grupo.</li>
              <li>Utilizam o Simulador de Prêmios e geram cards.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
