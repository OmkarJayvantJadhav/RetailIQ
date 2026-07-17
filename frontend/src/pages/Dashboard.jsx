import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingCart, Users, IndianRupee, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../api';

const formatCompactNum = (num) => {
  if (num >= 10000000) return (num / 10000000).toFixed(2) + 'Cr';
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const StatCard = ({ title, value, prefix = '', trend, icon: Icon, color }) => (
  <div className="glass-panel stat-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="stat-header">
      <div className="stat-info">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value" style={{ whiteSpace: 'nowrap' }}>{prefix}{value}</h3>
      </div>
      <div className="stat-icon-wrapper" style={{ background: color + '18' }}>
        <Icon className="stat-icon" style={{ color }} />
      </div>
    </div>
    <div className="stat-trend">
      {trend >= 0 ? <ArrowUpRight className="trend-icon positive" /> : <ArrowDownRight className="trend-icon negative" />}
      <span className={trend >= 0 ? 'trend-text positive' : 'trend-text negative'}>{Math.abs(trend)}%</span>
      <span className="trend-subtitle">vs previous period</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [interval, setInterval] = useState('30d');

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', interval],
    queryFn: async () => { const r = await api.get(`/dashboard/stats?interval=${interval}`); return r.data; },
    refetchInterval: 60000,
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts', interval],
    queryFn: async () => { const r = await api.get(`/dashboard/charts?interval=${interval}`); return r.data; },
    refetchInterval: 60000,
  });

  const s = stats || {};
  const revenueTrend = charts?.revenueTrend || [];
  const categorySales = charts?.categorySales || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">RetailIQ Platform — Live Data</p>
        </div>
        <div className="header-actions">
          <select 
            className="input-field select-small" 
            value={interval} 
            onChange={(e) => setInterval(e.target.value)}
            style={{ padding: '0.5rem 1rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none' }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="2y">Last 2 Years</option>
          </select>
          <button className="btn" onClick={() => window.print()}>Generate Report</button>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <StatCard title="Total Revenue" value={formatCompactNum(s.total_revenue || 0)} prefix="₹" trend={s.revenue_growth || 0} icon={IndianRupee} color="#818cf8" />
        <StatCard title="Total Profit" value={formatCompactNum(s.total_profit || 0)} prefix="₹" trend={s.profit_growth || 0} icon={Activity} color="#34d399" />
        <StatCard title="Total Orders" value={(s.total_orders || 0).toLocaleString('en-IN')} trend={s.orders_growth || 0} icon={ShoppingCart} color="#f59e0b" />
        <StatCard title="Customers" value={(s.total_customers || 0).toLocaleString('en-IN')} trend={s.customers_growth || 0} icon={Users} color="#60a5fa" />
      </div>

      <div className="charts-grid">
        <div className="glass-panel chart-panel-main">
          <div className="chart-header">
            <h3>Revenue vs Profit Trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis width={80} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `₹${formatCompactNum(v)}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-panel-side">
          <div className="chart-header"><h3>Sales by Category</h3></div>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={categorySales} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" width={90} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(value) => [`₹${formatCompactNum(value)}`, 'Sales']} />
                <Bar dataKey="sales" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
