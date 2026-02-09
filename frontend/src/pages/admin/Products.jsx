import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Filter, Download, Tag, AlertCircle, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getProducts, createProduct, updateProduct, deleteProduct, exportProductsCSV, updateProductStock, getBranches } from '../../api';
import ProductModal from '../../components/admin/ProductModal';
import StockModal from '../../components/admin/StockModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [branches, setBranches] = useState([]);

  useEffect(() => { loadData(); }, []);
  const loadData = () => {
    getProducts().then(d => { setProducts(d); setFiltered(d); });
    getBranches().then(setBranches);
  };

  const handleSave = async (data) => {
    try { editingProduct ? await updateProduct(editingProduct.id, data) : await createProduct(data); toast.success("Salvo!"); setIsModalOpen(false); loadData(); } catch { toast.error("Erro"); }
  };
  const handleDelete = async (id) => { if(confirm("Deletar?")) { await deleteProduct(id); loadData(); } };
  const handleUpdateStock = async (pid, bid, qtd) => { await updateProductStock(pid, bid, qtd); toast.success("Estoque atualizado!"); loadData(); setIsStockModalOpen(false); };

  return (
    <div className="glass rounded-3xl p-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-bold text-gray-800 text-2xl">Catálogo ({filtered.length})</h3>
        <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="btn-primary flex gap-2"><Plus size={18}/> Novo Produto</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase"><tr><th className="p-4">Produto</th><th className="p-4">Preço</th><th className="p-4">Estoque</th><th className="p-4">Ações</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{filtered.map(p => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">{p.image_url && <img src={p.image_url} className="w-full h-full object-cover"/>}</div><div><p className="font-bold">{p.name}</p><p className="text-xs text-gray-400">{p.category}</p></div></td>
              <td className="p-4 font-bold">R$ {p.price.toFixed(2)}</td>
              <td className="p-4"><button onClick={() => { setSelectedProduct(p); setIsStockModalOpen(true); }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{p.stock_quantity} un</button></td>
              <td className="p-4 flex gap-2"><button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}><Edit size={16} className="text-blue-500"/></button><button onClick={() => handleDelete(p.id)}><Trash2 size={16} className="text-red-500"/></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <ProductModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} productToEdit={editingProduct} />
      <StockModal isOpen={isStockModalOpen} onClose={()=>setIsStockModalOpen(false)} product={selectedProduct} branches={branches} onUpdateStock={handleUpdateStock} />
    </div>
  );
}