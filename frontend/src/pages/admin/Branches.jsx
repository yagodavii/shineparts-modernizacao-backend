import React, { useState, useEffect } from 'react';
import { Store, Trash2, Plus, MapPin, Users } from 'lucide-react';
import { getBranches, createBranch, deleteBranch } from '../../api';
import { toast } from 'react-hot-toast';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', manager: '', phone: '' });

  useEffect(() => { loadBranches(); }, []);
  const loadBranches = () => getBranches().then(setBranches);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createBranch(newBranch);
    toast.success("Criada!");
    setNewBranch({ name: '', address: '', manager: '', phone: '' });
    loadBranches();
  };

  return (
    <div className="glass rounded-3xl p-8 animate-fadeIn">
      <form onSubmit={handleCreate} className="bg-white/50 p-6 rounded-2xl border border-gray-100 mb-8 flex gap-4">
        <input required className="input-glass flex-1" placeholder="Nome da Filial" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
        <input className="input-glass flex-1" placeholder="Gerente" value={newBranch.manager} onChange={e => setNewBranch({...newBranch, manager: e.target.value})} />
        <button type="submit" className="btn-primary"><Plus size={18}/> Adicionar</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {branches.map(b => (
          <div key={b.id} className="bg-white p-6 rounded-2xl border border-gray-100 relative group hover:shadow-md transition">
            <button onClick={() => deleteBranch(b.id).then(loadBranches)} className="absolute top-4 right-4 text-red-300 hover:text-red-600"><Trash2 size={18}/></button>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 font-bold">{b.name.charAt(0)}</div><h4 className="font-bold text-gray-800">{b.name}</h4></div>
            <p className="text-sm text-gray-500 flex gap-2"><Users size={14}/> {b.manager}</p>
          </div>
        ))}
      </div>
    </div>
  );
}