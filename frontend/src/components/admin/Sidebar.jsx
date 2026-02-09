import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TrendingUp, Package, ShoppingBag, Users, Settings, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '../../App';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path || (path !== '/admin' && location.pathname.includes(path));
  
  const menuGroups = [
    { title: "Principal", items: [{ path: '/admin', label: 'Visão Geral', icon: LayoutDashboard }] },
    { title: "Gestão", items: [{ path: '/admin/orders', label: 'Pedidos', icon: ShoppingBag }, { path: '/admin/products', label: 'Produtos', icon: Package }, { path: '/admin/branches', label: 'Filiais', icon: Store }] },
    { title: "Sistema", items: [{ path: '/admin/settings', label: 'Configurações', icon: Settings }] }
  ];

  return (
    <aside className="w-64 bg-darkGrey text-white hidden md:flex flex-col fixed left-0 top-[88px] h-[calc(100vh-88px)] z-20 shadow-xl overflow-y-auto">
      <div className="p-6 border-b border-gray-800"><h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Admin</h2><p className="text-sm text-gray-300">Painel de Controle</p></div>
      <nav className="flex-1 py-6 px-4 space-y-8">
        {menuGroups.map((group, i) => (
          <div key={i}><h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-3 px-2">{group.title}</h3>
            <div className="space-y-1">{group.items.map((item) => (
                <Link key={item.path} to={item.path} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path) ? 'bg-shinerayRed text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <item.icon size={18} />{item.label}
                </Link>
              ))}</div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800"><button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm w-full px-4 py-2"><LogOut size={18} /> Sair</button></div>
    </aside>
  );
}