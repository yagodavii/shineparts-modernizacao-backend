import React, { useState, useEffect } from 'react';
import { X, Upload, Save, FileText, Image as ImageIcon } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, onSave, productToEdit }) {
  const [formData, setFormData] = useState({ name: '', price: '', cost_price: '', stock_quantity: '', category: '', image_url: '', xml_file: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [xmlFile, setXmlFile] = useState(null);

  useEffect(() => {
    if (productToEdit) { setFormData(productToEdit); setImageFile(null); setXmlFile(null); } 
    else { setFormData({ name: '', price: '', cost_price: '', stock_quantity: '', category: '', image_url: '', xml_file: '', description: '' }); }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imageFile) data.append('image', imageFile);
    if (xmlFile) data.append('xml', xmlFile);
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl animate-fadeIn overflow-hidden border border-white/50">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">{productToEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input required className="input-glass w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome da Peça" />
            <select className="input-glass w-full" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">Categoria...</option><option value="Motor">Motor</option><option value="Elétrica">Elétrica</option><option value="Carenagem">Carenagem</option><option value="Rodas">Rodas</option><option value="Acessórios">Acessórios</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <input type="number" step="0.01" className="input-glass w-full" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} placeholder="Custo" />
            <input type="number" step="0.01" required className="input-glass w-full font-bold" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Venda" />
            <input type="number" className="input-glass w-full" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} placeholder="Estoque" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50">
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                <div className="text-gray-500">{imageFile ? imageFile.name : (formData.image_url ? "Trocar Imagem" : "Enviar Imagem")}</div>
            </div>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50">
                <input type="file" accept=".xml,.pdf" onChange={(e) => setXmlFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                <div className="text-gray-500">{xmlFile ? xmlFile.name : "Enviar XML/PDF"}</div>
            </div>
          </div>
          <textarea rows="3" className="input-glass w-full" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descrição"></textarea>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button type="submit" className="bg-shinerayRed text-white px-8 py-2 rounded-xl font-bold hover:shadow-lg flex items-center gap-2"><Save size={18} /> Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}