/*
 * RetailIQ Frontend Application
 * File: ForecastPage.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area
} from 'recharts';
import { Activity, BarChart2, Info, Package, AlertTriangle, Sliders } from 'lucide-react';

const formatCr = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$ 0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(num).replace('$', '$ ').trim();
};

export default function ForecastPage() {
  const [productPage, setProductPage] = useState(1);
  const [scenarioModifier, setScenarioModifier] = useState(1.0);
  const [riskOnly, setRiskOnly] = useState(false);
  const productsPerPage = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['forecast', scenarioModifier, productPage, riskOnly],
    queryFn: async () => {
      const skip = (productPage - 1) * productsPerPage;
      const r = await api.get(`/forecast?scenario_modifier=${scenarioModifier}&risk_only=${riskOnly}&skip=${skip}&limit=${productsPerPage}`);
      return r.data;
    },
    keepPreviousData: true
  });

  const metrics = data?.metrics || {};
  const products = data?.products || [];
  const totalProducts = data?.total_products || 0;
  const totalProductPages = Math.ceil(totalProducts / productsPerPage);
  const paginatedProducts = products;

  // Format data for Recharts Area range
  const chartData = (data?.data || []).map(d => ({
    ...d,
    confidence_band: d.lower_bound !== null ? [d.lower_bound, d.upper_bound] : null
  }));

  if (isLoading && !data) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />
      <div className="skeleton" style={{ height: '360px', borderRadius: '16px' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Demand Forecast</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Actual vs Forecast comparison with error metrics.</p>
      </div>

      {/* Metric Cards */}
      <div className="kpi-grid-3">
        {[
          { 
            label: 'MAE', value: formatCr(metrics.mae), desc: 'Mean Absolute Error', color: '#818cf8',
            what: 'Mean Absolute Error.',
            why: 'Measures the average magnitude of the errors in a set of predictions, without considering their direction.',
            shows: 'The average forecast mistake in exact rupees.'
          },
          { 
            label: 'RMSE', value: formatCr(metrics.rmse), desc: 'Root Mean Squared Error', color: '#f59e0b',
            what: 'Root Mean Squared Error.',
            why: 'Gives a relatively high weight to large errors, penalizing massive miscalculations.',
            shows: 'The average error magnitude, heavily influenced by large outliers.'
          },
          { 
            label: 'MAPE', value: metrics.mape?.toFixed(1) + '%', desc: 'Mean Absolute % Error', color: '#34d399',
            what: 'Mean Absolute Percentage Error.',
            why: 'Measures prediction accuracy in percentage terms, making it easy to understand across different scales.',
            shows: 'The average forecast mistake as a percentage.'
          },
        ].map((m, i) => (
          <div key={i} className="glass-panel" style={{ borderLeft: `4px solid ${m.color}`, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.desc}</p>
              <div className="tooltip-container">
                <Info size={16} color="var(--text-muted)" />
                <div className="tooltip-text">
                  <strong style={{ color: m.color, display: 'block', marginBottom: '2px' }}>What it is:</strong>
                  <span style={{ display: 'block', marginBottom: '8px' }}>{m.what}</span>
                  <strong style={{ color: m.color, display: 'block', marginBottom: '2px' }}>Why it is used:</strong>
                  <span style={{ display: 'block', marginBottom: '8px' }}>{m.why}</span>
                  <strong style={{ color: m.color, display: 'block', marginBottom: '2px' }}>What it displays:</strong>
                  <span style={{ display: 'block' }}>{m.shows}</span>
                </div>
              </div>
            </div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: m.color, margin: '0.25rem 0' }}>{m.value}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{m.label}</p>
          </div>
        ))}
      </div>


      {/* Chart */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Activity size={20} color="#818cf8" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Actual vs Forecast Revenue</h3>
        </div>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatCr} axisLine={false} tickLine={false} />
              <Tooltip 
                itemStyle={{ color: '#e2e8f0' }} 
                contentClassName="custom-tooltip-glass" 
                wrapperClassName="custom-tooltip-glass" 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                formatter={(v, name) => {
                  return [formatCr(v), name];
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="actual" name="Actual Revenue" fill="#818cf8" opacity={0.8} barSize={24} radius={[6, 6, 0, 0]} />
              

              
              <Line 
                type="monotone" 
                dataKey="forecast" 
                name="Forecast" 
                stroke="#34d399" 
                strokeWidth={4} 
                dot={{ fill: '#34d399', r: 5, strokeWidth: 0 }} 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#fff', stroke: '#34d399' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product-wise Forecast Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Package size={20} color="#8b5cf6" />

          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Product-level Forecast & Stockout Alerts ({totalProducts} Products)</h3>
        </div>
        
        <div style={{ padding: '0 1.5rem 1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              checked={riskOnly} 
              onChange={(e) => { setRiskOnly(e.target.checked); setProductPage(1); }}
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '500', color: riskOnly ? '#ef4444' : 'var(--text-main)' }}>Show Stockout Risks Only</span>
          </label>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Forecast Revenue (1 Mo)</th>
                  <th>Forecast Units (1 Mo)</th>
                  <th>Current Stock</th>
                  <th>Months of Stock</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((prod, i) => {
                  const monthsOfStock = prod.forecast_units > 0 
                    ? (prod.current_stock / prod.forecast_units).toFixed(1) 
                    : '> 12';
                    
                  let riskLevel = 'Low Risk';
                  let badgeClass = 'badge-success';
                  let icon = null;
                  
                  if (prod.forecast_units > 0) {
                    if (prod.current_stock / prod.forecast_units < 3) {
                      riskLevel = 'High Risk (< 3 mo)';
                      badgeClass = 'badge-danger';
                      icon = <AlertTriangle size={12} />;
                    } else if (prod.current_stock / prod.forecast_units <= 6) {
                      riskLevel = 'Medium Risk (3-6 mo)';
                      badgeClass = 'badge-warning';
                      icon = <AlertTriangle size={12} />;
                    } else {
                      riskLevel = 'Low Risk (> 6 mo)';
                    }
                  }

                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>{prod.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{prod.category}</td>
                      <td style={{ color: '#8b5cf6', fontWeight: '600' }}>{formatCr(prod.forecast_revenue)}</td>
                      <td style={{ fontWeight: '500' }}>{prod.forecast_units.toFixed(1)}</td>
                      <td style={{ fontWeight: '500' }}>{prod.current_stock.toLocaleString()}</td>
                      <td style={{ fontWeight: '600', color: badgeClass === 'badge-danger' ? '#ef4444' : badgeClass === 'badge-warning' ? '#f59e0b' : '#10b981' }}>{monthsOfStock} mo</td>
                      <td>
                        <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {icon} {riskLevel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {(!data?.products || data.products.length === 0) && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No product forecast data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {totalProductPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Showing {((productPage - 1) * productsPerPage) + (totalProducts > 0 ? 1 : 0)} to {Math.min(productPage * productsPerPage, totalProducts)} of {totalProducts} products
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                disabled={productPage === 1}
                onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', opacity: productPage === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <button
                className="btn-secondary"
                disabled={productPage === totalProductPages}
                onClick={() => setProductPage(prev => Math.min(totalProductPages, prev + 1))}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', opacity: productPage === totalProductPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
