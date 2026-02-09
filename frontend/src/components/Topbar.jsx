import React from 'react';
import { Bell, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../App';

export default function Topbar({ title }) {
  const { user } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10 transition-all">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      
      <div className="flex items-center gap-6">
        {/* Barra de Busca Global */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-shinerayRed transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar pedido, cliente..." 
            className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-shinerayRed/20 w-64 transition-all focus:w-80" 
          />
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-700">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 uppercase">{user?.role || 'Gerente'}</p>
            </div>
            <div className="w-10 h-10 bg-darkGrey text-white rounded-full flex items-center justify-center shadow-lg">
               <ShieldCheck size={20} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}