import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TrendingUp, Package, ShoppingBag, Settings, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '../../App';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };
  
  // Função para checar se o link está ativo
  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.includes(path)) return true;
    return false;
  };
  
  const menuGroups = [
    { title: "Principal", items: [{ path: '/admin', label: 'Visão Geral', icon: LayoutDashboard }] },
    { title: "Operação", items: [
        { path: '/admin/orders', label: 'Pedidos', icon: ShoppingBag }, 
        { path: '/admin/products', label: 'Produtos', icon: Package }, 
        { path: '/admin/branches', label: 'Filiais', icon: Store }
      ] 
    },
    { title: "Sistema", items: [{ path: '/admin/settings', label: 'Configurações', icon: Settings }] }
  ];

  return (
    <aside className="w-64 bg-[#1a1a1a] text-white hidden md:flex flex-col fixed left-0 top-0 h-full z-20 shadow-2xl">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-gray-800">
        <h2 className="text-xl font-black tracking-tighter text-white">
          SHINERAY<span className="text-shinerayRed">ADMIN</span>
        </h2>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-8 overflow-y-auto scrollbar-hide">
        {menuGroups.map((group, i) => (
          <div key={i}>
            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-3 px-2">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive(item.path) 
                      ? 'bg-shinerayRed text-white shadow-lg shadow-red-900/20' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className={isActive(item.path) ? 'animate-pulse' : ''} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition-colors text-sm w-full px-4 py-3 rounded-xl font-bold"
        >
          <LogOut size={18} /> Sair do Sistema
        </button>
      </div>
    </aside>
  );
}