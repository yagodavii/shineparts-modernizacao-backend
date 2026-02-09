import React, { useState, useEffect } from 'react';
import { X, Save, Store, Package, RefreshCw } from 'lucide-react';

export default function StockModal({ isOpen, onClose, product, branches, onUpdateStock }) {
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    if (product && branches) {
      const initialData = {};
      branches.forEach(branch => {
        const branchStock = product.branch_stock?.find(bs => bs.branch_id === branch.id);
        initialData[branch.id] = branchStock ? branchStock.quantity : 0;
      });
      setStockData(initialData);
    }
  }, [product, branches, isOpen]);

  if (!isOpen || !product) return null;

  const handleStockChange = (branchId, value) => {
    setStockData(prev => ({ ...prev, [branchId]: parseInt(value) || 0 }));
  };

  const handleSave = async (branchId) => {
    setLoading(branchId);
    await onUpdateStock(product.id, branchId, stockData[branchId]);
    setLoading(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md w-full max-w-lg rounded-3xl shadow-2xl animate-fadeIn border border-white/50">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm"><Package size={22} /></div>
            <div><h3 className="font-bold text-gray-800 text-lg">Gerenciar Estoque</h3><p className="text-sm text-gray-500 font-medium">{product.name}</p></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"><X size={24} /></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {branches.map(branch => (
                <div key={branch.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold">{branch.name.charAt(0)}</div>
                        <div><p className="font-bold text-gray-700 text-sm">{branch.name}</p><p className="text-xs text-gray-400">Atual: {stockData[branch.id] || 0}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="number" min="0" className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-center font-bold" value={stockData[branch.id] || 0} onChange={(e) => handleStockChange(branch.id, e.target.value)}/>
                        <button onClick={() => handleSave(branch.id)} disabled={loading === branch.id} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all">{loading === branch.id ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18} />}</button>
                    </div>
                </div>
            ))}
            {branches.length === 0 && <div className="text-center py-8 text-gray-400"><Store size={48} className="mx-auto mb-2 opacity-20"/><p>Nenhuma filial cadastrada.</p></div>}
        </div>
      </div>
    </div>
  );
}