/*
 * RetailIQ Frontend Application
 * File: MarketAnalytics.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { MapPin, TrendingUp, Globe, Building, DollarSign } from 'lucide-react';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa',
  '#fb923c', '#4ade80', '#e879f9', '#22d3ee', '#fbbf24', '#a3e635', '#38bdf8', '#f472b6', '#c084fc'];

const formatCr = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$ 0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(num).replace('$', '$ ').trim();
};

export default function MarketAnalytics() {
  const [statePage, setStatePage] = React.useState(0);
  const [cityPage, setCityPage] = React.useState(0);
  const [chartPage, setChartPage] = React.useState(0);
  const itemsPerPage = 10;
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-market'],
    queryFn: async () => {
      const r = await api.get('/analytics/market');
      return r.data;
    }
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700' }}>Market Analytics</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Geographic revenue distribution across global markets.</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        {[
          { label: 'Total Global Regions', value: (data?.summary?.total_regions || 0).toLocaleString(), icon: Globe, color: '#60a5fa' },
          { label: 'Total Cities', value: (data?.summary?.total_cities || 0).toLocaleString(), icon: Building, color: '#f59e0b' },
          { label: 'Top Region', value: data?.summary?.top_region || 'N/A', icon: MapPin, color: '#34d399' },
          { label: 'Global AOV', value: formatCr(data?.summary?.global_aov), icon: DollarSign, color: '#a78bfa' },
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

      {/* State Revenue Chart */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <MapPin size={20} color="#818cf8" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Revenue by Global Region</h3>
        </div>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer>
            <BarChart
              layout="vertical"
              data={(data?.state_revenue || []).slice(chartPage * itemsPerPage, (chartPage + 1) * itemsPerPage)}
              margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={formatCr} axisLine={false} tickLine={false} domain={[(dataMin) => Math.max(0, dataMin * 0.8), 'auto']} />
              <YAxis 
                dataKey="state" 
                type="category" 
                stroke="#94a3b8" 
                axisLine={false} 
                tickLine={false} 
                width={220} 
                tick={{ fontSize: 12, fill: '#f8fafc' }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }}
                formatter={(v) => [formatCr(v), 'Revenue']} 
              />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={24}>
                {((data?.state_revenue || []).slice(chartPage * itemsPerPage, (chartPage + 1) * itemsPerPage)).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Showing {data?.state_revenue?.length > 0 ? chartPage * itemsPerPage + 1 : 0} to {Math.min((chartPage + 1) * itemsPerPage, data?.state_revenue?.length || 0)} of {data?.state_revenue?.length || 0} regions
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" disabled={chartPage === 0} onClick={() => setChartPage(p => Math.max(0, p - 1))} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Prev</button>
            <button className="btn btn-secondary" disabled={chartPage >= Math.ceil((data?.state_revenue?.length || 0) / itemsPerPage) - 1 || data?.state_revenue?.length === 0} onClick={() => setChartPage(p => p + 1)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Next</button>
          </div>
        </div>
      </div>

      {/* State Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={20} color="#34d399" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Global Region Performance Details</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <div className="table-responsive">
<table>
            <thead>
              <tr>
                <th>#</th>
                <th>Region</th>
                <th>Revenue</th>
                <th>Customers</th>
                <th>Orders</th>
                <th>AOV</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const stateData = data?.state_revenue || [];
                const paginatedData = stateData.slice(statePage * itemsPerPage, (statePage + 1) * itemsPerPage);
                return paginatedData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{statePage * itemsPerPage + i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{row.state}</td>
                    <td style={{ fontWeight: '700', color: '#818cf8' }}>{formatCr(row.revenue)}</td>
                    <td>{row.customers?.toLocaleString('en-US')}</td>
                    <td>{row.orders?.toLocaleString('en-US')}</td>
                    <td style={{ color: '#34d399' }}>{formatCr(row.aov)}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
</div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Showing {data?.state_revenue?.length > 0 ? statePage * itemsPerPage + 1 : 0} to {Math.min((statePage + 1) * itemsPerPage, data?.state_revenue?.length || 0)} of {data?.state_revenue?.length || 0} regions
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" disabled={statePage === 0} onClick={() => setStatePage(p => Math.max(0, p - 1))} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Prev</button>
              <button className="btn btn-secondary" disabled={statePage >= Math.ceil((data?.state_revenue?.length || 0) / itemsPerPage) - 1 || data?.state_revenue?.length === 0} onClick={() => setStatePage(p => p + 1)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Next</button>
            </div>
          </div>
        </div>
      </div>


      {/* City Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>City Performance Details</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0 0 12px 12px' }}>
          <div className="table-responsive">
<table>
            <thead>
              <tr>
                <th>#</th>
                <th>City</th>
                <th>State</th>
                <th>Revenue</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const cityData = data?.city_revenue || [];
                const paginatedCityData = cityData.slice(cityPage * itemsPerPage, (cityPage + 1) * itemsPerPage);
                return paginatedCityData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{cityPage * itemsPerPage + i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{row.city}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{row.state}</td>
                    <td style={{ fontWeight: '700', color: '#f59e0b' }}>{formatCr(row.revenue)}</td>
                    <td>{row.orders?.toLocaleString('en-US')}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
</div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Showing {data?.city_revenue?.length > 0 ? cityPage * itemsPerPage + 1 : 0} to {Math.min((cityPage + 1) * itemsPerPage, data?.city_revenue?.length || 0)} of {data?.city_revenue?.length || 0} cities
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" disabled={cityPage === 0} onClick={() => setCityPage(p => Math.max(0, p - 1))} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Prev</button>
              <button className="btn btn-secondary" disabled={cityPage >= Math.ceil((data?.city_revenue?.length || 0) / itemsPerPage) - 1 || data?.city_revenue?.length === 0} onClick={() => setCityPage(p => p + 1)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Next</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
