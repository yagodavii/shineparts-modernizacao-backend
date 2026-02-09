import React, { useState, useEffect } from 'react';
import { Save, Layout, Shield, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSettings, saveSettings, getUsers, createUser, deleteUser } from '../../api';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'vendedor' });

  useEffect(() => { getSettings().then(setSettings); getUsers().then(setUsers); }, []);

  const handleSave = (e) => { e.preventDefault(); saveSettings(settings).then(()=>toast.success("Salvo!")); };
  const handleAddUser = (e) => { e.preventDefault(); createUser(newUser).then(()=>{ toast.success("Criado!"); getUsers().then(setUsers); }); };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass rounded-3xl p-8">
        <h3 className="font-bold flex gap-2 mb-6"><Layout className="text-red-500"/> Site</h3>
        <form onSubmit={handleSave} className="flex gap-4"><input className="input-glass flex-1" placeholder="Nome do Site" value={settings.siteName||''} onChange={e=>setSettings({...settings, siteName:e.target.value})}/><button className="btn-primary">Salvar</button></form>
      </div>
      <div className="glass rounded-3xl p-8">
        <h3 className="font-bold flex gap-2 mb-6"><Shield className="text-blue-500"/> Equipe</h3>
        <form onSubmit={handleAddUser} className="flex gap-4 mb-6"><input className="input-glass flex-1" placeholder="Nome" value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})}/><input className="input-glass flex-1" placeholder="Login" value={newUser.username} onChange={e=>setNewUser({...newUser, username:e.target.value})}/><input className="input-glass flex-1" type="password" placeholder="Senha" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})}/><button className="btn-primary">Add</button></form>
        <div className="space-y-2">{users.map(u=><div key={u.id} className="flex justify-between p-3 bg-white rounded-xl border border-gray-100"><span>{u.name} ({u.role})</span><button onClick={()=>deleteUser(u.id).then(()=>getUsers().then(setUsers))} className="text-red-400"><Trash2 size={16}/></button></div>)}</div>
      </div>
    </div>
  );
}