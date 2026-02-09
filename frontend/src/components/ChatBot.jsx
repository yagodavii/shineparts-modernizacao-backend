import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Sparkles, Loader2, ShieldCheck } from 'lucide-react';

export default function ChatBot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isGestorMode = location.pathname.includes('/admin');
  
  const [messages, setMessages] = useState([{ 
      role: 'assistant', 
      content: isGestorMode ? 'Olá Chefe! Modo Gestão ativado.' : 'Olá! Sou a Sara, sua consultora Shineray.' 
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

  useEffect(() => {
    setMessages([{ 
        role: 'assistant', 
        content: isGestorMode ? '🛡️ **Modo Gestão.**\nAuditoria e Estoque.' : '👋 Olá! Voltei para o modo Venda.' 
    }]);
  }, [isGestorMode]);

  useEffect(() => {
    if (isOpen) {
        let contextMsg = "";
        if (location.pathname.includes('/cart')) contextMsg = "Está no **Carrinho**. Quer um cupom?";
        else if (location.pathname.includes('/admin/orders')) contextMsg = "Digite **'pendentes'** para ver atrasos.";
        else if (location.pathname.includes('/admin/products')) contextMsg = "Digite **'baixo'** para ver reposição.";
        
        if (contextMsg && messages[messages.length - 1].content !== contextMsg) {
            setMessages(prev => [...prev, { role: 'assistant', content: contextMsg }]);
        }
    }
  }, [location.pathname, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    let userContext = null;
    const storedUser = localStorage.getItem('shineray_user');
    if (storedUser) try { userContext = JSON.parse(storedUser); } catch (e) {}

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, userContext, currentPath: location.pathname })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sem conexão." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return <React.Fragment key={i}>{parts.map((p, j) => p.startsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p)}<br/></React.Fragment>;
    });
  };

  const headerColor = isGestorMode ? "bg-gray-900" : "bg-gradient-to-r from-shinerayRed to-red-700";

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl flex flex-col animate-fadeIn overflow-hidden">
          <div className={`${headerColor} p-4 flex justify-between items-center text-white shadow-md transition-colors duration-500`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">{isGestorMode ? <ShieldCheck size={24} /> : <Bot size={24} />}</div>
              <div><h3 className="font-bold text-sm">{isGestorMode ? "Sara Gestora" : "Sara Vendedora"}</h3><p className="text-[10px] opacity-90 flex items-center gap-1"><Sparkles size={10}/> {isGestorMode ? "BI & Auditoria" : "Peças Shineray"}</p></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? (isGestorMode?'bg-gray-800':'bg-shinerayRed')+' text-white rounded-br-none' : 'bg-white text-gray-700 rounded-bl-none'}`}>{renderMessage(m.content)}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl flex items-center gap-2"><Loader2 size={16} className="animate-spin text-gray-400"/><span className="text-xs text-gray-500">Processando...</span></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isGestorMode ? "Comando..." : "Busque peças..."} className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-gray-200 outline-none"/>
            <button type="submit" disabled={loading || !input.trim()} className={`${isGestorMode ? 'bg-gray-900' : 'bg-shinerayRed'} text-white p-2.5 rounded-xl`}><Send size={18} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 ${isOpen ? 'bg-gray-800 text-white rotate-90' : (isGestorMode?'bg-gray-900':'bg-shinerayRed')+' text-white'}`}>{isOpen ? <X size={24} /> : (isGestorMode ? <ShieldCheck size={28}/> : <MessageCircle size={28} />)}</button>
    </div>
  );
}