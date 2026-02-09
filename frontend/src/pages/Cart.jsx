import React, { useState } from 'react';
import { Trash2, ArrowRight, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../App';
import { createOrder } from '../api';
import { toast } from 'react-hot-toast';

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Cria o pedido no backend
      await createOrder({
        totalAmount: total,
        items: cart.map(p => ({ id: p.id, name: p.name, price: p.price })),
        customer_name: "Cliente Site" // Em um app real, pegaria do usuário logado
      });
      toast.success("Pedido realizado com sucesso!");
      clearCart();
    } catch (error) {
      toast.error("Erro ao processar pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return (
    <div className="text-center py-20 animate-fadeIn">
      <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag size={48} className="text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Seu carrinho está vazio</h2>
      <p className="text-gray-500 mb-8">Que tal dar uma olhada nas nossas promoções?</p>
      <a href="/" className="btn-primary">Voltar para Loja</a>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
        <ShoppingBag className="text-shinerayRed"/> Carrinho
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Lista de Itens */}
        <div className="md:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden">
                {item.image_url && <img src={item.image_url} className="w-full h-full object-cover"/>}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <p className="text-gray-500 text-sm">{item.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">R$ {item.price.toFixed(2)}</p>
                <button onClick={() => removeFromCart(index)} className="text-red-400 text-xs hover:text-red-600 flex items-center justify-end gap-1 mt-1">
                  <Trash2 size={12}/> Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="font-bold text-lg mb-6">Resumo do Pedido</h3>
            
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Frete</span><span>Grátis</span></div>
            </div>
            
            <div className="flex justify-between items-end mb-8">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-black text-3xl text-shinerayRed">R$ {total.toFixed(2)}</span>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-500 shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Processando..." : <>Finalizar Compra <ArrowRight size={20}/></>}
            </button>
            
            <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-2">
              <CreditCard size={12}/> Pagamento Seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}