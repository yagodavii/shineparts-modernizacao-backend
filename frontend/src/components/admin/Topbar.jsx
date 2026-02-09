import React from 'react';
import { Bell, Search } from 'lucide-react';

export default function Topbar({ title }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-shinerayRed/20 w-64 transition-all" />
        </div>
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition">
          <Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}