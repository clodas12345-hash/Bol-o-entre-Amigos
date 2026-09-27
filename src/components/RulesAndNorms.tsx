import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import PageHeader from './PageHeader';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { getIsAdmin } from '../lib/authHelpers';

const DEFAULT_RULES_TEXT = `📜 REGULAMENTO INTERNO DO BOLÃO DE AMIGOS

1. AUTORIZAÇÃO DE ENTRADA E CONTROLE DE ACESSO
• Todo novo participante que se cadastrar receberá o status provisório de "Pendente".
• É expressamente necessária a autorização direta do Administrador para que o membro seja aprovado, garantindo um ambiente seguro e controlado.
• Membros sem autorização aprovada não participam dos sorteios, cotas, estatísticas ou discussões no chat.

2. CONTRIBUIÇÃO, COTAS E VALORES
• A cota mensal de participação padrão possui o valor predefinido de R$ 20,00 por cota.
• Qualquer pedido de alteração ou solicitação de novas cotas de um integrante deve ser submetido pelo aplicativo e aguardará aprovação da administração.
• Os pagamentos devem ser efetuados via Pix oficial cadastrado no aplicativo, enviando o respectivo comprovante para compensação do caixa.

3. DIVISÃO PROPORCIONAL DE PRÊMIOS
• Todos os prêmios apurados e confirmados serão rateados de forma estritamente proporcional ao número de cotas ativas e pagas que cada participante possuir.
• Integrantes em situação de inadimplência (com cotas marcadas como "Pendente de Pagamento") no momento da extração oficial não farão jus ao rateio daquele sorteio correspondente.

4. TRANSPARÊNCIA E CONFERÊNCIA
• Todos os jogos registrados, dezenas escolhidas e teimosinhas ficam visíveis para todos os membros ativos na aba "Jogos".
• O sistema realiza a conferência automatizada em tempo real com os resultados oficiais da Caixa Econômica Federal.
• Os balanços, comprovantes e prestação de contas do Caixa do bolão ficam acessíveis de forma transparente no painel financeiro.`;

export default function RulesAndNorms() {
  const { setIsQuotaExceeded } = usePool();
  const [rules, setRules] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { addToast } = useToast();
  const isAdmin = getIsAdmin();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'rules'), (docSnap) => {
      if (docSnap.exists()) {
        setRules(docSnap.data().text || '');
      }
    }, err => {
      console.warn('Rules settings snapshot error:', err);
      if (isQuotaError(err)) setIsQuotaExceeded(true);
    });
    return unsub;
  }, []);

  const saveRules = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'rules'), { text: rules }, { merge: true });
      setIsEditing(false);
      addToast('Regras e normas salvas com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar regras:', err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        addToast('Limite de cota atingido no banco.', 'error');
      } else {
        addToast('Erro ao salvar regras.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Botões de Voltar e Fechar */}
      <PageHeader
        title="Regras e Normas do Bolão"
        subtitle="Regulamento, datas de rateio, prazos de pagamento e critérios de divisão"
        icon="📜"
      />

      <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full h-80 border border-gray-300 rounded-lg p-3 text-sm focus:outline-blue-500 font-mono"
              placeholder="Escreva aqui as regras do bolão..."
              value={rules}
              onChange={(e) => setRules(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveRules}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Regras'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
              {rules || DEFAULT_RULES_TEXT}
            </div>

            {isAdmin && (
              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <span>✎</span> Editar Regras
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
