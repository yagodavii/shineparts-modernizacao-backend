import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User } from 'lucide-react';
import { useAuth } from '../App';
import { login as apiLogin } from '../api';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiLogin(username, password);
      login(data.user, data.token);
      toast.success(`Bem-vindo, ${data.user.name}!`);
      
      // Se for admin, manda pro painel, senão pra loja
      if (data.user.role === 'admin' || data.user.role === 'gerente') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error('Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass w-full max-w-md p-10 rounded-[40px] shadow-2xl animate-fadeIn relative overflow-hidden">
        {/* Decorativo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-shinerayRed/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-shinerayRed text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Acesso ao Sistema</h2>
          <p className="text-gray-400 text-sm mt-1">Digite suas credenciais para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-glass w-full pl-12 py-3 bg-gray-50/50"
                placeholder="Ex: admin"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glass w-full pl-12 py-3 bg-gray-50/50"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-shinerayRed to-red-700 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}