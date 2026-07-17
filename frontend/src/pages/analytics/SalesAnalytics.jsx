import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Package, ShoppingBag } from 'lucide-react';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa'];

const formatCr = (num) => {
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + ' L';
  if (num >= 1000) return '₹' + (num / 1000).toFixed(0) + 'K';
  return '₹' + num;
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
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                formatter={(v) => [formatCr(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={3} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Category Sales */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <ShoppingBag size={20} color="#34d399" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Revenue by Category</h3>
          </div>
          <div style={{ height: '360px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.category_sales || []} dataKey="revenue" nameKey="category"
                  cx="50%" cy="45%" outerRadius={100}>
                  {(data?.category_sales || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [formatCr(v), 'Revenue']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Package size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Top 10 Products by Revenue</h3>
          </div>
          <div style={{ height: '360px' }}>
            <ResponsiveContainer>
              <BarChart data={data?.top_products || []} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" hide tickFormatter={formatCr} />
                <YAxis dataKey="name" type="category" width={320} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  formatter={(v) => [formatCr(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} />
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
                    <td>{row.units?.toLocaleString('en-IN')}</td>
                    <td>{row.orders?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subcategory Table */}
        <div className="glass-panel" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Subcategory Summary</h3>
          </div>
          <div className="table-container custom-scrollbar" style={{ border: 'none', borderRadius: '0 0 12px 12px', height: '400px', overflowY: 'auto' }}>
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
                    <td>{row.units?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
