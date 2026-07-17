import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, BarChart2, Info, Package } from 'lucide-react';

const formatCr = (num) => {
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(1) + 'Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(0) + 'L';
  return '₹' + (num / 1000).toFixed(0) + 'K';
};

export default function ForecastPage() {
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn: async () => {
      const r = await api.get('/forecast');
      return r.data;
    }
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />
      <div className="skeleton" style={{ height: '360px', borderRadius: '16px' }} />
    </div>
  );

  const metrics = data?.metrics || {};
  const products = data?.products || [];
  const top20Products = products.slice(0, 20);
  const totalProductPages = Math.ceil(products.length / productsPerPage);
  const paginatedProducts = products.slice((productPage - 1) * productsPerPage, productPage * productsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Demand Forecast</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Actual vs Forecast comparison with error metrics.</p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Actual vs Forecast Revenue (Monthly)</h3>
        </div>
        <div style={{ height: '360px' }}>
          <ResponsiveContainer>
            <ComposedChart data={data?.data || []} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatCr} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                formatter={(v, n) => [formatCr(v), n]} />
              <Legend />
              <Bar dataKey="actual" name="Actual Revenue" fill="#818cf8" opacity={0.8} barSize={20} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart2 size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Monthly Forecast Details</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Actual Revenue</th>
                <th>Forecast</th>
                <th>Absolute Error</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((row, i) => {
                const accuracy = row.actual > 0 ? (1 - row.error / row.actual) * 100 : 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: '600' }}>{row.month}</td>
                    <td style={{ color: '#818cf8', fontWeight: '600' }}>{formatCr(row.actual)}</td>
                    <td style={{ color: '#34d399', fontWeight: '600' }}>{formatCr(row.forecast)}</td>
                    <td style={{ color: '#f59e0b' }}>{formatCr(row.error)}</td>
                    <td>
                      <span style={{
                        color: accuracy >= 90 ? '#34d399' : accuracy >= 75 ? '#f59e0b' : '#f87171',
                        fontWeight: '600'
                      }}>{accuracy.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      {/* Product-wise Forecast Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Package size={20} color="#8b5cf6" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Product-wise Forecast ({products.length} Products)</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Forecast Revenue</th>
                <th>Forecast Units</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((prod, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '600' }}>{prod.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{prod.category}</td>
                  <td style={{ color: '#8b5cf6', fontWeight: '600' }}>{formatCr(prod.forecast_revenue)}</td>
                  <td style={{ fontWeight: '500' }}>{prod.forecast_units.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-success">
                      ↑ Expected Growth
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.products || data.products.length === 0) && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No product forecast data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalProductPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Showing {((productPage - 1) * productsPerPage) + 1} to {Math.min(productPage * productsPerPage, products.length)} of {products.length} products
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
