import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const location = useLocation();
  const getTitle = () => {
    const path = location.pathname.split('/').pop();
    switch(path) {
      case 'orders': return 'Gestão de Pedidos';
      case 'products': return 'Catálogo de Produtos';
      case 'branches': return 'Filiais & Lojas';
      case 'settings': return 'Configurações & Equipe';
      default: return 'Visão Geral';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Topbar title={getTitle()} />
        <main className="flex-1 p-8 overflow-y-auto relative z-0">
           <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-gray-200 to-transparent -z-10 opacity-50"></div>
           <Outlet />
        </main>
      </div>
    </div>
  );
}