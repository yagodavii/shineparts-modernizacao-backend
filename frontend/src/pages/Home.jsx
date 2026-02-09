import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingBag } from 'lucide-react';
import { getProducts } from '../api';
import { useCart } from '../App';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    getProducts().then(data => setProducts(data || []));
  }, []);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner Hero */}
      <div className="relative h-64 rounded-3xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 shadow-2xl flex items-center px-10">
        <div className="relative z-10 text-white space-y-2">
          <h1 className="text-4xl md:text-5xl font-black">Peças Originais <span className="text-shinerayRed">Shineray</span></h1>
          <p className="text-gray-300 max-w-lg">Encontre tudo para sua moto com garantia de fábrica e entrega rápida para todo o Brasil.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')] bg-cover opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Busca */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="input-glass w-full pl-12 h-12 text-lg" 
            placeholder="Qual peça você procura?" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-48 bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={48}/></div>
              )}
              {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                <span className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-lg">Poucas Unidades</span>
              )}
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">{product.category}</span>
              <h3 className="font-bold text-gray-800 line-clamp-2 h-12">{product.name}</h3>
              <div className="flex justify-between items-center pt-2">
                <div>
                    <p className="text-xs text-gray-400">À vista</p>
                    <p className="text-2xl font-black text-shinerayRed">R$ {product.price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className="bg-gray-900 text-white p-3 rounded-xl hover:bg-shinerayRed disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  <ShoppingBag size={20}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}