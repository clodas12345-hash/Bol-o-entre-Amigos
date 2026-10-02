import { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './NotificationManager';

export default function MonthlySnapshotManager() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [snapshotMembers, setSnapshotMembers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    // Carregar Master List de membros
    const membersSnap = await getDocs(collection(db, 'members'));
    setAllMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    // Carregar Snapshot do mês
    const snapRef = doc(db, 'monthly_snapshots', selectedMonth);
    const snap = await getDoc(snapRef);
    if (snap.exists()) {
      setSnapshotMembers(snap.data().members || []);
    } else {
      setSnapshotMembers([]);
    }
    setLoading(false);
  };

  const generateFromCurrent = () => {
    setSnapshotMembers(allMembers);
    addToast('Snapshot gerado a partir da lista atual!', 'info');
  };

  const toggleMember = (member: any) => {
    setSnapshotMembers(prev => 
      prev.some(m => m.id === member.id) 
        ? prev.filter(m => m.id !== member.id)
        : [...prev, member]
    );
  };

  const saveSnapshot = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'monthly_snapshots', selectedMonth), {
        members: snapshotMembers,
        updatedAt: serverTimestamp()
      });
      addToast(`Snapshot de ${selectedMonth} salvo!`, 'success');
    } catch (e) {
      addToast('Erro ao salvar.', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md space-y-4">
      <div className="flex gap-2">
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border rounded" />
        <button onClick={generateFromCurrent} className="bg-blue-600 text-white px-4 py-2 rounded">Gerar do Atual</button>
        <button onClick={saveSnapshot} className="bg-emerald-600 text-white px-4 py-2 rounded">Salvar Snapshot</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allMembers.map(m => (
          <div key={m.id} className={`p-3 border rounded flex justify-between ${snapshotMembers.some(sm => sm.id === m.id) ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50'}`}>
            {m.displayName}
            <button onClick={() => toggleMember(m)} className="text-xs px-2 py-1 bg-gray-200 rounded">
              {snapshotMembers.some(sm => sm.id === m.id) ? 'Remover' : 'Adicionar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
