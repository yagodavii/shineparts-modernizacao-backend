import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Users, DollarSign, ShoppingBag, TrendingDown } from 'lucide-react';
import { getAdminStats, getSalesByBranch, getTopProducts } from '../../api';

export default function Overview() {
  const [stats, setStats] = useState({ revenue: 0, orders_count: 0, products_count: 0, customers_count: 0, revenue_growth: 0, average_ticket: 0 });
  const [timeRange, setTimeRange] = useState('week');
  const [salesByBranch, setSalesByBranch] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    getAdminStats(timeRange).then(d => {
        setStats(prev => ({ ...prev, ...d }));
        const safeRevenue = d.revenue || 0;
        setChartData([
            { name: 'Seg', online: safeRevenue * 0.1, physical: safeRevenue * 0.05 },
            { name: 'Ter', online: safeRevenue * 0.15, physical: safeRevenue * 0.08 },
            { name: 'Qua', online: safeRevenue * 0.12, physical: safeRevenue * 0.06 },
            { name: 'Qui', online: safeRevenue * 0.18, physical: safeRevenue * 0.09 },
            { name: 'Sex', online: safeRevenue * 0.2, physical: safeRevenue * 0.1 },
            { name: 'Sáb', online: safeRevenue * 0.15, physical: safeRevenue * 0.12 },
            { name: 'Dom', online: safeRevenue * 0.1, physical: safeRevenue * 0.05 },
        ]);
    });
    getSalesByBranch(timeRange).then(d => setSalesByBranch(d || []));
    getTopProducts(timeRange).then(d => setTopProducts(d || []));
  }, [timeRange]);

  const branchColors = ['#D92525', '#1a1a1a', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-800">Dashboard</h2><p className="text-gray-500">Visão geral do negócio</p></div>
        <div className="flex gap-2">{['day', 'week', 'month'].map(r => <button key={r} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${timeRange===r ? 'bg-shinerayRed text-white' : 'bg-white text-gray-500'}`} onClick={()=>setTimeRange(r)}>{r==='day'?'Hoje':r==='week'?'Semana':'Mês'}</button>)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Faturamento" value={`R$ ${(stats.revenue||0).toFixed(2)}`} icon={DollarSign} color="red" growth={stats.revenue_growth||0} />
        <KpiCard title="Pedidos" value={stats.orders_count||0} icon={Package} color="blue" growth={12} />
        <KpiCard title="Ticket Médio" value={`R$ ${(stats.average_ticket||0).toFixed(2)}`} icon={ShoppingBag} color="green" growth={5} />
        <KpiCard title="Clientes" value={stats.customers_count||0} icon={Users} color="purple" growth={8} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-3xl p-6 h-96"><h3 className="font-bold text-gray-700 mb-6">Vendas</h3><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" axisLine={false}/><YAxis axisLine={false}/><Tooltip cursor={{fill:'#f3f4f6'}} contentStyle={{borderRadius:'12px',border:'none'}}/><Bar dataKey="online" fill="#D92525" radius={[4,4,0,0]}/><Bar dataKey="physical" fill="#3B82F6" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
        <div className="glass rounded-3xl p-6 h-96"><h3 className="font-bold text-gray-700 mb-6">Por Filial</h3><ResponsiveContainer><PieChart><Pie data={salesByBranch} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" dataKey="value">{salesByBranch.map((e,i)=><Cell key={`cell-${i}`} fill={branchColors[i%branchColors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}
function KpiCard({title, value, icon: Icon, color, growth}) {
  const c = {red:"bg-red-50 text-red-600", blue:"bg-blue-50 text-blue-600", green:"bg-green-50 text-green-600", purple:"bg-purple-50 text-purple-600"};
  return (<div className="glass rounded-3xl p-6 hover:shadow-lg transition-all"><div className="flex justify-between items-start"><div><p className="text-sm font-medium text-gray-500">{title}</p><h3 className="text-2xl font-bold text-gray-800 mt-2">{value}</h3><div className="flex items-center gap-1 mt-2 text-xs font-medium"><TrendingUp size={14} className="text-green-500"/> <span className="text-green-600">{growth}% período</span></div></div><div className={`p-3 rounded-2xl ${c[color]}`}><Icon size={24}/></div></div></div>);
}