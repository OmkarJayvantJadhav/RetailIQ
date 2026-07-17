import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { AlertTriangle, Archive, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const ABC_COLORS = { 'A': '#34d399', 'B': '#f59e0b', 'C': '#f87171' };
const CLASS_LABELS = { 'A': '⭐ Star', 'B': '📈 Steady', 'C': '🐢 Slow' };

export default function InventoryAnalytics() {
  const [activeTab, setActiveTab] = useState('stockout');
  const [abcPage, setAbcPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-inventory'],
    queryFn: async () => {
      const r = await api.get('/analytics/inventory');
      return r.data;
    }
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />)}
    </div>
  );

  const summary = data?.summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Inventory Analytics</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Stockout risk, ABC analysis, and inventory health.</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total SKUs', value: summary.total_items, icon: Archive, color: '#818cf8' },
          { label: 'Out of Stock', value: summary.out_of_stock, icon: XCircle, color: '#f87171' },
          { label: 'Low Stock', value: summary.low_stock, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Overstocked', value: summary.overstock, icon: CheckCircle, color: '#34d399' },
        ].map((card, i) => (
          <div key={i} className="glass-panel stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.25rem' }}>{card.value?.toLocaleString('en-IN') || 0}</h3>
              </div>
              <card.icon size={32} color={card.color} style={{ opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[
          { id: 'stockout', label: '⚠️ Stockout Risk' },
          { id: 'abc', label: '⭐ Top Performers Analysis' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setAbcPage(1); }}
            className={activeTab === tab.id ? 'btn' : 'btn-secondary'}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'stockout' && (
        <div className="glass-panel" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#f87171" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Products at Stockout Risk</h3>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {(data?.stockout_risk || []).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '600' }}>{row.product}</td>
                    <td><span className="badge badge-info">{row.category}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.warehouse}</td>
                    <td style={{ fontWeight: '700', color: row.stock === 0 ? '#f87171' : '#f59e0b' }}>
                      {row.stock}
                    </td>
                    <td>{row.reorder_level}</td>
                    <td>
                      <span className={`badge ${row.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {row.stock === 0 ? 'OUT OF STOCK' : `${row.stock_pct}% stocked`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'abc' && (
        <>
          <div className="glass-panel">
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
              {[
                { label: 'Star Products (Top 80% Revenue)', color: '#34d399', desc: 'High priority — keep well stocked' },
                { label: 'Steady Sellers (Next 15% Revenue)', color: '#f59e0b', desc: 'Medium priority — monitor regularly' },
                { label: 'Slow Movers (Bottom 5% Revenue)', color: '#f87171', desc: 'Low priority — reduce holdings' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color, marginTop: '3px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.label}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 0 }}>
            <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Product Importance Classification (All Products)</h3>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Revenue</th>
                    <th>Cumulative %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.abc_analysis?.slice((abcPage - 1) * 15, abcPage * 15) || []).map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{row.category}</td>
                      <td style={{ color: '#818cf8', fontWeight: '600' }}>
                        ₹{row.revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td>{row.cumulative_pct}%</td>
                      <td>
                        <span style={{
                          background: ABC_COLORS[row.class] + '22',
                          color: ABC_COLORS[row.class],
                          padding: '0.2rem 0.75rem', borderRadius: '99px',
                          fontWeight: '700', fontSize: '0.9rem'
                        }}>{CLASS_LABELS[row.class]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Showing {(abcPage - 1) * 15 + 1} to {Math.min(abcPage * 15, data?.abc_analysis?.length || 0)} of {data?.abc_analysis?.length || 0} products
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setAbcPage(p => Math.max(1, p - 1))} disabled={abcPage === 1} className="btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
                <button onClick={() => setAbcPage(p => Math.min(Math.ceil((data?.abc_analysis?.length || 0) / 15), p + 1))} disabled={abcPage >= Math.ceil((data?.abc_analysis?.length || 0) / 15)} className="btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
