import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogIn, Package } from 'lucide-react';
import { useCart, useAuth } from '../App';

export default function Navbar() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-shinerayRed text-white p-2 rounded-xl transform group-hover:rotate-12 transition-transform">
            <Package size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900">
            SHINERAY<span className="text-shinerayRed">PARTS</span>
          </span>
        </Link>

        {/* Ações */}
        <div className="flex items-center gap-6">
          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors group">
            <ShoppingCart size={24} className="text-gray-600 group-hover:text-shinerayRed transition-colors" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-shinerayRed text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                {cart.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 hidden md:block">Olá, {user.name.split(' ')[0]}</span>
              <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                Sair
              </button>
              {/* Botão Admin só aparece se for Admin */}
              {(user.role === 'admin' || user.role === 'gerente') && (
                <Link to="/admin" className="bg-darkGrey text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all">
                  Painel
                </Link>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 bg-shinerayRed text-white px-5 py-2.5 rounded-xl font-bold shadow-red-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <LogIn size={18} /> Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}