/*
 * RetailIQ Frontend Application
 * File: DatabaseExplorer.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { Database, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const TABLES = ['customers', 'orders', 'order_items', 'products', 'inventory', 'warehouses', 'payments', 'state_demographics'];

export default function DatabaseExplorer() {
  const [activeTable, setActiveTable] = useState('customers');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const { data, isLoading, error } = useQuery({
    queryKey: ['raw-data', activeTable, page, limit],
    queryFn: async () => {
      const res = await api.get(`/data/${activeTable}?page=${page}&limit=${limit}`);
      return res.data;
    }
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const renderCell = (val) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>null</span>;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={24} color="var(--accent-blue)" /> Dataset Viewer
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse the raw, un-sampled dataset directly from the database.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {TABLES.map(t => (
          <button
            key={t}
            onClick={() => { setActiveTable(t); setPage(1); }}
            className={`btn ${activeTable === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', textTransform: 'capitalize' }}>{activeTable.replace('_', ' ')} Table</h3>
          {data && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{data.total.toLocaleString()} total rows</span>}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--accent-blue)' }} />
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Error loading data.</div>
          ) : (
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#13151A', zIndex: 10, boxShadow: '0 1px 0 var(--border-light)' }}>
                <tr>
                  {(data?.columns || []).map(col => (
                    <th key={col} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.records || []).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {(data?.columns || []).map(col => (
                      <td key={col} style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={String(row[col])}>
                        {renderCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
                {data?.records?.length === 0 && (
                  <tr>
                    <td colSpan={data?.columns?.length || 1} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No data found in this table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Rows per page:</span>
            <select 
              value={limit} 
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{ background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-light)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
            >
              {[10, 50, 100, 250].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '0.5rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="btn btn-secondary" 
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '0.5rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
