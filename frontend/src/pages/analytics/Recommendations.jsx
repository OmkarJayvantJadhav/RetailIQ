import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { Lightbulb, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const TYPE_STYLES = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: '#f87171', Icon: XCircle },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', Icon: AlertTriangle },
  success: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: '#34d399', Icon: CheckCircle },
  info: { color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: '#818cf8', Icon: Info },
};

export default function Recommendations() {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const r = await api.get('/analytics/recommendations');
      return r.data;
    }
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '130px', borderRadius: '16px' }} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Business Recommendations</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          AI-generated insights based on your real-time data.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(data?.recommendations || []).map((rec, i) => {
          const style = TYPE_STYLES[rec.type] || TYPE_STYLES.info;
          const { Icon } = style;
          return (
            <div key={i} className="glass-panel" style={{
              borderLeft: `4px solid ${style.border}`,
              display: 'flex', gap: '1.5rem', alignItems: 'flex-start'
            }}>
              <div style={{
                background: style.bg, borderRadius: '12px', padding: '0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Icon size={28} color={style.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: style.color, marginRight: '0.75rem'
                    }}>{rec.category}</span>
                    <span className={`badge ${rec.impact === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                      {rec.impact} Impact
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{rec.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                  {rec.description}
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.6rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Lightbulb size={14} color={style.color} />
                  <span style={{ fontSize: '0.85rem', color: style.color, fontWeight: '500' }}>
                    Recommended Action: {rec.action}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
