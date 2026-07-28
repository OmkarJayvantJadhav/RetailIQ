/*
 * RetailIQ Frontend Application
 * File: Dashboard.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingCart, Users, IndianRupee, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Treemap, ComposedChart, Line } from 'recharts';
import api from '../api';

const formatCompactNum = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(num).replace('$', '').trim();
};

const formatFullCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f43f5e', '#a78bfa'];

// Custom Treemap Content
const CustomizedContent = (props) => {
  const { root, depth, x, y, width, height, index, name, value } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{
        fill: depth < 2 ? COLORS[index % COLORS.length] : 'none',
        stroke: '#1e293b',
        strokeWidth: 2,
        strokeOpacity: 1,
      }} />
      {width > 30 && height > 30 ? (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            <span style={{
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}>
              {name}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
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

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats', interval],
    queryFn: async () => { const r = await api.get(`/dashboard/stats?interval=${interval}`); return r.data; },
    refetchInterval: 60000,
  });

  const { data: charts, isLoading: chartsLoading, error: chartsError } = useQuery({
    queryKey: ['dashboard-charts', interval],
    queryFn: async () => { const r = await api.get(`/dashboard/charts?interval=${interval}`); return r.data; },
    refetchInterval: 60000,
  });

  if (statsLoading || chartsLoading) return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '16px' }} />
        ))}
      </div>
    </div>
  );

  if (statsError || chartsError) return (
    <div className="dashboard-container">
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
        Failed to load dashboard data. Please check your connection and try again.
      </div>
    </div>
  );

  const s = stats || {};
  const revenueTrend = charts?.revenueTrend || [];
  const categorySales = charts?.categorySales || [];
  const paymentMethods = charts?.paymentMethods || [];
  const regionalSales = charts?.regionalSales || [];

  const funnelOrder = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const funnelData = [...(charts?.orderStatus || [])].sort((a, b) => funnelOrder.indexOf(a.name) - funnelOrder.indexOf(b.name));

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
            <option value="all">All Time</option>
          </select>
          <button className="btn" onClick={() => window.print()}>Generate Report</button>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <StatCard title="Total Revenue" value={formatCompactNum(s.total_revenue || 0)} prefix="₹" trend={s.revenue_growth || 0} icon={IndianRupee} color="#818cf8" />
        <StatCard title="Total Profit" value={formatCompactNum(s.total_profit || 0)} prefix="₹" trend={s.profit_growth || 0} icon={Activity} color="#34d399" />
        <StatCard title="Total Orders" value={(s.total_orders || 0).toLocaleString('en-US')} trend={s.orders_growth || 0} icon={ShoppingCart} color="#f59e0b" />
        <StatCard title="Customers" value={(s.total_customers || 0).toLocaleString('en-US')} trend={s.customers_growth || 0} icon={Users} color="#60a5fa" />
      </div>

      <div className="charts-grid">
        <div className="glass-panel chart-panel-main">
          <div className="chart-header">
            <h3>Revenue vs Profit Trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer>
              <ComposedChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis width={80} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `₹${formatCompactNum(v)}`} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                  formatter={(value) => [formatFullCurrency(value), '']} />
                <Bar dataKey="revenue" name="Revenue" fill="url(#colorRev)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#34d399" strokeWidth={4} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399', style: { filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.8))' } }} />
              </ComposedChart>
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
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                  formatter={(value) => [formatFullCurrency(value), 'Sales']} />
                <Bar dataKey="sales" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-panel-main">
          <div className="chart-header">
            <h3>Top 10 Global Regions</h3>
          </div>
          <div className="chart-container" style={{ minHeight: '350px' }}>
            <ResponsiveContainer>
              <BarChart data={regionalSales.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                  formatter={(value) => [formatFullCurrency(value), 'Revenue']} />
                <Bar dataKey="size" radius={[0, 4, 4, 0]} barSize={24}>
                  {regionalSales.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-panel-side">
          <div className="chart-header"><h3>Payment Methods</h3></div>
          <div className="chart-container">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                  formatter={(value) => formatFullCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            {paymentMethods.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                <span style={{ color: '#cbd5e1' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Pipeline Funnel */}
        <div className="glass-panel chart-panel-main" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-header">
            <h3>Fulfillment Pipeline</h3>
          </div>
          <div className="chart-container" style={{ minHeight: '350px' }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                         formatter={(v) => [v.toLocaleString(), 'Orders']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={40}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Cancelled' ? '#f43f5e' : COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
