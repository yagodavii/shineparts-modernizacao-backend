import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, getBranches } from '../../api';
import { toast } from 'react-hot-toast';
import { Eye, MapPin, Calendar } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    getOrders().then(setOrders);
    getBranches().then(setBranches).catch(console.error);
  }, []);

  const handleStatus = async (id, status) => { await updateOrderStatus(id, status); toast.success("Status atualizado!"); getOrders().then(setOrders); };

  return (
    <div className="glass rounded-3xl p-8 animate-fadeIn">
      <h3 className="font-bold text-gray-800 text-2xl mb-8">Pedidos</h3>
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase"><tr><th className="p-4">ID</th><th className="p-4">Cliente</th><th className="p-4">Total</th><th className="p-4">Filial</th><th className="p-4">Status</th><th className="p-4">Ações</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{orders.map(o => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="p-4 font-mono">#{o.id}</td>
              <td className="p-4">{o.customer_name}</td>
              <td className="p-4 font-bold">R$ {o.total_amount.toFixed(2)}</td>
              <td className="p-4 text-xs">{o.branch_id ? branches.find(b=>b.id===o.branch_id)?.name || 'Filial' : 'Online'}</td>
              <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{o.status}</span></td>
              <td className="p-4 flex gap-2">
                <button onClick={() => setSelectedOrder(o)} className="text-gray-500"><Eye size={18}/></button>
                <select className="bg-gray-50 border rounded text-xs" value={o.status} onChange={(e)=>handleStatus(o.id, e.target.value)}><option>Pendente</option><option>Pago</option><option>Enviado</option><option>Concluído</option></select>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full"><h3 className="font-bold text-xl mb-4">Detalhes #{selectedOrder.id}</h3><p>Cliente: {selectedOrder.customer_name}</p><p>Total: R$ {selectedOrder.total_amount.toFixed(2)}</p><button onClick={()=>setSelectedOrder(null)} className="mt-6 btn-primary w-full">Fechar</button></div>
        </div>
      )}
    </div>
  );
}