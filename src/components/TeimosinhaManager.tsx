import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';

export default function TeimosinhaManager() {
  const [config, setConfig] = useState({
    startDate: '2026-09-24',
    startContest: 3788,
    quantity: 12,
    numbers: '1,2,3,5,6,10,11,12,13,14,15,20,22,24,25'
  });
  const { addToast } = useToast();

  const saveConfig = async () => {
    try {
      await setDoc(doc(db, 'system_config', 'teimosinha'), {
        ...config,
        numbersArray: config.numbers.split(',').map(Number),
        updatedAt: serverTimestamp()
      });
      addToast('Teimosinha configurada com sucesso!', 'success');
    } catch (e) {
      addToast('Erro ao salvar teimosinha.', 'error');
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
      <h2 className="font-bold mb-4">Configurar Teimosinha</h2>
      <input type="date" value={config.startDate} onChange={e => setConfig({...config, startDate: e.target.value})} className="border p-2 w-full mb-2" />
      <input type="number" value={config.startContest} onChange={e => setConfig({...config, startContest: Number(e.target.value)})} className="border p-2 w-full mb-2" />
      <input type="text" value={config.numbers} onChange={e => setConfig({...config, numbers: e.target.value})} className="border p-2 w-full mb-2" />
      <button onClick={saveConfig} className="bg-blue-600 text-white p-2 rounded w-full">Salvar Configuração</button>
    </div>
  );
}
