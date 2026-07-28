/*
 * RetailIQ Frontend Application
 * File: CustomerAnalytics.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Star, TrendingDown, ShoppingCart, Activity } from 'lucide-react';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa'];

const formatCr = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(num).replace('$', '$ ').trim();
};

const SEGMENT_COLORS = {
  'Champions': '#34d399',
  'Loyal Customers': '#818cf8',
  'Potential Loyalists': '#60a5fa',
  'Promising': '#f59e0b',
  'At Risk': '#fb923c',
  'Lost Customers': '#f87171',
  'Registered / No Purchases': '#94a3b8',
};

const SEGMENT_DESCRIPTIONS = {
  'Champions': 'Bought recently, buy often, and spend a lot.',
  'Loyal Customers': 'Buy on a regular basis. Responsive to promotions.',
  'Potential Loyalists': 'Recent shoppers who have bought more than once.',
  'Promising': 'Recent shoppers, but haven\'t spent much yet.',
  'At Risk': 'Spent big money and bought often, but haven\'t returned recently.',
  'Lost Customers': 'Haven\'t purchased in a very long time.',
  'Registered / No Purchases': 'Created an account but has never completed a purchase.',
};

export default function CustomerAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: async () => {
      const r = await api.get('/analytics/customers');
      return r.data;
    }
  });

  const demoMap = {};
  (data?.demographics || []).forEach(d => {
    if (!demoMap[d.age_group]) demoMap[d.age_group] = { age_group: d.age_group, Male: 0, Female: 0 };
    // Make male negative to create the pyramid effect
    demoMap[d.age_group][d.gender] = d.gender === 'Male' ? -d.count : d.count;
  });
  const pyramidData = Object.values(demoMap).sort((a, b) => a.age_group.localeCompare(b.age_group));

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

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        {[
          { label: 'Total Customers', value: (data?.summary?.total_customers || 0).toLocaleString(), icon: Users, color: '#a78bfa' },
          { label: 'Active Customers', value: (data?.summary?.active_customers || 0).toLocaleString(), icon: Activity, color: '#34d399' },
          { label: 'Average LTV', value: formatCr(data?.summary?.avg_ltv), icon: Star, color: '#f59e0b' },
          { label: 'Avg Orders / Cust', value: (data?.summary?.avg_orders || 0).toFixed(1), icon: ShoppingCart, color: '#818cf8' },
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

      <div className="form-grid-2">
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
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none">
                  {(data?.rfm_segments || []).map((entry, i) => (
                    <Cell key={i} fill={SEGMENT_COLORS[entry.segment] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip itemStyle={{ color: '#e2e8f0' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                  formatter={(v, n) => [v.toLocaleString('en-US') + ' customers', n]} />
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
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="income_level" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatCr} axisLine={false} tickLine={false} />
                <Tooltip itemStyle={{ color: '#e2e8f0' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass" cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={(v) => [formatCr(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="url(#colorIncome)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demographics Pyramid */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="#a78bfa" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Customer Demographics (Age & Gender)</h3>
        </div>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={pyramidData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => Math.abs(v)} />
              <YAxis dataKey="age_group" type="category" stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentClassName="custom-tooltip-glass" wrapperClassName="custom-tooltip-glass"
                formatter={(v, name) => [Math.abs(v).toLocaleString(), name]} />
              <Bar dataKey="Male" fill="#60a5fa" stackId="stack" name="Male" />
              <Bar dataKey="Female" fill="#f472b6" stackId="stack" name="Female" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers CLV Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Star size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Top 10 Most Valuable Customers</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <div className="table-responsive">
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
      </div>

      {/* RFM Segment Summary */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Customer Group Breakdown</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <div className="table-responsive">
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
                  <td style={{ fontWeight: '600' }}>{seg.count.toLocaleString('en-US')}</td>
                  <td>{seg.avg_frequency?.toFixed(1)}</td>
                  <td>{formatCr(seg.avg_monetary)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {seg.segment === 'Champions' ? 'Reward & retain' :
                      seg.segment === 'At Risk' ? 'Win-back campaign' :
                        seg.segment === 'Lost Customers' ? 'Re-engagement email' :
                          seg.segment === 'Registered / No Purchases' ? 'First-order promo code' :
                            'Nurture & upsell'}
                  </td>
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
