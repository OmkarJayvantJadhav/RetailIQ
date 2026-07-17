import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Star, TrendingDown } from 'lucide-react';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa'];

const formatCr = (num) => {
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + ' L';
  return '₹' + num?.toLocaleString('en-IN');
};

const SEGMENT_COLORS = {
  'Champions': '#34d399',
  'Loyal Customers': '#818cf8',
  'Potential Loyalists': '#60a5fa',
  'Promising': '#f59e0b',
  'At Risk': '#fb923c',
  'Lost Customers': '#f87171',
};

const SEGMENT_DESCRIPTIONS = {
  'Champions': 'Bought recently, buy often, and spend a lot.',
  'Loyal Customers': 'Buy on a regular basis. Responsive to promotions.',
  'Potential Loyalists': 'Recent shoppers who have bought more than once.',
  'Promising': 'Recent shoppers, but haven\'t spent much yet.',
  'At Risk': 'Spent big money and bought often, but haven\'t returned recently.',
  'Lost Customers': 'Haven\'t purchased in a very long time.',
};

export default function CustomerAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: async () => {
      const r = await api.get('/analytics/customers');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Customer Analytics</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Customer loyalty groups, lifetime spending, and marketing strategies.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* RFM Pie */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Users size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Customer Loyalty Groups</h3>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.rfm_segments || []} dataKey="count" nameKey="segment"
                  cx="50%" cy="50%" outerRadius={90}>
                  {(data?.rfm_segments || []).map((entry, i) => (
                    <Cell key={i} fill={SEGMENT_COLORS[entry.segment] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  formatter={(v, n) => [v.toLocaleString('en-IN') + ' customers', n]} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Distribution */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Star size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Revenue by Income Level</h3>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer>
              <BarChart data={data?.income_distribution || []} margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="income_level" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatCr} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  formatter={(v) => [formatCr(v), 'Revenue']} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={48}>
                  {(data?.income_distribution || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customers CLV Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Star size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Top 10 Most Valuable Customers</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Location</th>
                <th>Income Level</th>
                <th>Orders</th>
                <th>Lifetime Spend</th>
              </tr>
            </thead>
            <tbody>
              {(data?.top_customers || []).map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '600' }}>{c.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.city}, {c.state}</td>
                  <td><span className="badge badge-info">{c.income_level}</span></td>
                  <td>{c.orders}</td>
                  <td style={{ fontWeight: '700', color: '#34d399' }}>{formatCr(c.clv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RFM Segment Summary */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Customer Group Breakdown</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <table>
            <thead>
              <tr>
                <th>Segment</th>
                <th>Customers</th>
                <th>Avg. Orders</th>
                <th>Avg. Spend</th>
                <th>Strategy</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rfm_segments || []).map((seg, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                      <span style={{
                        background: SEGMENT_COLORS[seg.segment] + '22',
                        color: SEGMENT_COLORS[seg.segment] || '#fff',
                        padding: '0.25rem 0.75rem', borderRadius: '99px', fontWeight: '600', fontSize: '0.8rem'
                      }}>{seg.segment}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {SEGMENT_DESCRIPTIONS[seg.segment]}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>{seg.count.toLocaleString('en-IN')}</td>
                  <td>{seg.avg_frequency?.toFixed(1)}</td>
                  <td>{formatCr(seg.avg_monetary)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {seg.segment === 'Champions' ? 'Reward & retain' :
                      seg.segment === 'At Risk' ? 'Win-back campaign' :
                        seg.segment === 'Lost Customers' ? 'Re-engagement email' :
                          'Nurture & upsell'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
