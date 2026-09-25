import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isQuotaError } from '../lib/firebase';
import PageHeader from './PageHeader';
import { useToast } from './NotificationManager';
import { usePool } from '../lib/PoolContext';
import { getIsAdmin } from '../lib/authHelpers';

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
              {rules || (
                <div className="text-gray-400 italic py-4">
                  Nenhuma regra cadastrada ainda.
                </div>
              )}
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
