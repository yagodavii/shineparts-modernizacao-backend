import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

// Componentes
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';

// Admin Components & Pages
import AdminLayout from './components/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Branches from './pages/admin/Branches';
import Settings from './pages/admin/Settings';

// --- CONTEXTOS ---
const CartContext = createContext();
const AuthContext = createContext();

export const useCart = () => useContext(CartContext);
export const useAuth = () => useContext(AuthContext);

// --- LAYOUT ---
function LayoutHandler({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLoginRoute = location.pathname === '/login';
  
  // Define se é tela cheia para o LAYOUT (Sidebar vs Navbar)
  const isFullScreen = isAdminRoute || isLoginRoute;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar Fixa no Topo (Apenas se não for Admin/Login) */}
      {!isFullScreen && <Navbar />}

      {/* CHATBOT SARA */}
      {/* CORREÇÃO: Agora ela aparece em tudo, MENOS no Login */}
      {!isLoginRoute && <ChatBot />}

      {/* Conteúdo Principal */}
      <div className={`flex-1 ${isFullScreen ? '' : 'container mx-auto p-4 md:p-6'}`}>
        {isFullScreen ? (
          <div className="h-full">{children}</div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6 min-h-[calc(100vh-140px)]">
            {children}
          </div>
        )}
      </div>

      {/* Rodapé (Apenas na Loja) */}
      {!isFullScreen && (
        <footer className="bg-gradient-to-r from-darkGrey to-gray-900 text-white mt-12 py-8 border-t border-gray-800">
          <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
            <p>Sistema Integrado v1.0 - Felipe Mendes</p>
          </div>
        </footer>
      )}
    </div>
  );
}

// --- APP ---
export default function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('shineray_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // Funções do Carrinho
  const addToCart = (product) => {
    setCart([...cart, product]);
    toast.success(`${product.name} adicionado!`, { icon: '🛒', style: { background: '#10b981', color: '#fff' } });
  };
  const removeFromCart = (i) => setCart(cart.filter((_, idx) => idx !== i));
  const clearCart = () => setCart([]);

  // Funções de Autenticação
  const login = (u, t) => { 
    setUser(u); 
    localStorage.setItem('shineray_user', JSON.stringify(u)); 
    localStorage.setItem('shineray_token', t); 
  };
  
  const logout = () => { 
    setUser(null); 
    localStorage.removeItem('shineray_user'); 
    localStorage.removeItem('shineray_token'); 
  };

  // Rota Protegida
  const ProtectedRoute = ({ children }) => {
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
        <Router>
          <Toaster position="top-right" />
          <LayoutHandler>
            <Routes>
              {/* Rotas Públicas (Loja) */}
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              
              {/* Rotas Privadas (Admin) */}
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Overview />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="branches" element={<Branches />} />
                <Route path="settings" element={<Settings />} />
                <Route path="customers" element={<div className="p-10 text-center glass rounded-3xl">Módulo em desenvolvimento</div>} />
              </Route>
            </Routes>
          </LayoutHandler>
        </Router>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}