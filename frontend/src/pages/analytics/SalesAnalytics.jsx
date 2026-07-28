/*
 * RetailIQ Frontend Application
 * File: SalesAnalytics.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Treemap, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { TrendingUp, Package, ShoppingBag, DollarSign } from 'lucide-react';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa'];

const formatCr = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$ 0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(num).replace('$', '$ ').trim();
};

const CustomizedContent = (props) => {
  const { depth, x, y, width, height, index, name } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{
        fill: depth < 2 ? COLORS[index % COLORS.length] : 'none',
        stroke: '#1e293b', strokeWidth: 2, strokeOpacity: 1,
      }} />
      {width > 30 && height > 20 ? (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', overflow: 'hidden', boxSizing: 'border-box' }}>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {name}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
};

export default function SalesAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-sales'],
    queryFn: async () => {
      const r = await api.get('/analytics/sales');
      return r.data;
    }
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '16px' }} />
      ))}
    </div>
  );

  if (error) return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
      Failed to load sales analytics. Please try again.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Sales Analytics</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Revenue trends, category performance, and top products.</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        {[
          { label: 'Total Revenue', value: formatCr(data?.summary?.total_revenue), icon: DollarSign, color: '#34d399' },
          { label: 'Total Orders', value: (data?.summary?.total_orders || 0).toLocaleString(), icon: ShoppingBag, color: '#818cf8' },
          { label: 'Products Sold', value: (data?.summary?.total_products || 0).toLocaleString(), icon: Package, color: '#f59e0b' },
          { label: 'Avg Margin', value: `${((data?.summary?.avg_profit_margin || 0)*100).toFixed(1)}%`, icon: TrendingUp, color: '#60a5fa' },
        ].map((card, i) => (
          <div key={i} className="glass-panel stat-card" style={{ borderLeft: `4px solid ${card.color}`, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>{card.value}</h3>
              </div>
              <card.icon size={28} color={card.color} style={{ opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <TrendingUp size={20} color="#818cf8" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Monthly Revenue Trend (Last 12 Months)</h3>
        </div>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer>
            <AreaChart data={data?.revenue_trend || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatCr} axisLine={false} tickLine={false} />
              <Tooltip itemStyle={{ color: '#e2e8f0' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass" cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                formatter={(v) => [formatCr(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={3} fill="url(#revGrad)" activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8', style: { filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.8))' } }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profitability Scatter Plot */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <DollarSign size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Profitability by Category (Revenue vs Margin)</h3>
        </div>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" dataKey="revenue" name="Revenue" tickFormatter={formatCr} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="number" dataKey="margin" name="Margin" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <ZAxis type="category" dataKey="category" name="Category" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                formatter={(value, name) => [name === 'Margin' ? `${(value * 100).toFixed(1)}%` : formatCr(value), name]} />
              <Scatter name="Categories" data={data?.profit_by_category || []} fill="#f59e0b">
                {(data?.profit_by_category || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Category Sales */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <ShoppingBag size={20} color="#34d399" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Revenue by Category</h3>
          </div>
          <div style={{ height: '450px' }}>
            <ResponsiveContainer>
              <Treemap
                data={(data?.category_sales || []).map(item => ({ name: item.category, size: item.revenue }))}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomizedContent />}
              >
                <Tooltip formatter={(v) => [formatCr(v), 'Revenue']}
                  contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass" itemStyle={{ color: '#f8fafc' }} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Package size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Top 10 Products by Revenue</h3>
          </div>
          <div style={{ height: '450px' }}>
            <ResponsiveContainer>
              <BarChart data={data?.top_products || []} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatCr} axisLine={false} tickLine={false} domain={[(dataMin) => Math.max(0, dataMin * 0.95), 'auto']} />
                <YAxis dataKey="name" type="category" width={220} tick={{ fill: '#e2e8f0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip itemStyle={{ color: '#e2e8f0' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                  formatter={(v) => [formatCr(v), 'Revenue']} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                  {(data?.top_products || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Category Table */}
        <div className="glass-panel" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Category Summary</h3>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px', height: '400px' }}>
            <div className="table-responsive">
<table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Revenue</th>
                  <th>Units</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {(data?.category_sales || []).map((row, i) => (
                  <tr key={i}>
                    <td><span className="badge badge-info">{row.category}</span></td>
                    <td style={{ fontWeight: '600', color: '#818cf8' }}>{formatCr(row.revenue)}</td>
                    <td>{row.units?.toLocaleString('en-US')}</td>
                    <td>{row.orders?.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>

        {/* Subcategory Table */}
        <div className="glass-panel" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Subcategory Summary</h3>
          </div>
          <div className="table-container custom-scrollbar" style={{ border: 'none', borderRadius: '0 0 12px 12px', height: '400px', overflowY: 'auto' }}>
            <div className="table-responsive">
<table>
              <thead>
                <tr>
                  <th>Subcategory</th>
                  <th>Category</th>
                  <th>Revenue</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {(data?.subcategory_sales || []).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '600' }}>{row.subcategory}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{row.category}</span></td>
                    <td style={{ fontWeight: '600', color: '#34d399' }}>{formatCr(row.revenue)}</td>
                    <td>{row.units?.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}
