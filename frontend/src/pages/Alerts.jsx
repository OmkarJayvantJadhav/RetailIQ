/*
 * RetailIQ Frontend Application
 * File: Alerts.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { BellRing, CheckCircle2, AlertOctagon, XCircle } from 'lucide-react';

const Alerts = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const alerts = data?.items || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: '12px' }}>
          <BellRing size={28} color="#ef4444" />
        </div>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>System Alerts</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Live stockout alerts from inventory. {!isLoading && <strong style={{ color: '#f87171' }}>{alerts.length} active alerts</strong>}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '6rem', width: '100%', borderRadius: '12px' }} />
          ))
        ) : alerts.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.25rem' }}>All Clear</h3>
            <p style={{ color: 'var(--text-muted)' }}>No active stockout alerts. All inventory levels are healthy.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="glass-panel" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: `4px solid ${alert.type === 'critical' ? '#ef4444' : '#f59e0b'}`
            }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {alert.type === 'critical' ? (
                  <XCircle size={32} color="#ef4444" />
                ) : (
                  <AlertOctagon size={32} color="#f59e0b" />
                )}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.4rem' }}>{alert.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{alert.message}</p>
                </div>
              </div>
              <span className={`badge ${alert.type === 'critical' ? 'badge-danger' : 'badge-warning'}`} style={{ flexShrink: 0 }}>
                {alert.stock_quantity === 0 ? 'OUT OF STOCK' : `${alert.stock_quantity} remaining`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
