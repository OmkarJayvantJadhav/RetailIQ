import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, ArrowLeft, Tag, ShoppingCart, DollarSign, Activity } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/api/products/${id}`);
      return response.data;
    }
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['productForecast', id],
    queryFn: async () => {
      const response = await api.get(`/api/products/${id}/forecast`);
      return response.data;
    }
  });

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['productSuggestions', id],
    queryFn: async () => {
      const response = await api.get(`/api/products/${id}/suggestions`);
      return response.data;
    }
  });

  const formatCompact = (num) => {
    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  if (productLoading) {
    return <div className="skeleton" style={{ height: '400px', width: '100%' }}></div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      <button 
        onClick={() => navigate('/products')}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '2rem' }}
      >
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div className="grid grid-cols-3">
        {/* Left Column: Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--accent-gradient)', padding: '1rem', borderRadius: '12px' }}>
                <Package size={32} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{product?.name}</h1>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span className="badge badge-success">{product?.brand}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{product?.category}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={16} /> Sub Category</span>
                <span style={{ color: 'white', fontWeight: '500' }}>{product?.sub_category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={16} /> Price</span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: '600', fontSize: '1.25rem' }}>${product?.price?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={18} color="var(--accent-purple)" /> Similar Products
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {suggestionsLoading ? (
                <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
              ) : suggestions?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No related products found.</p>
              ) : (
                suggestions?.map(s => (
                  <Link 
                    key={s.product_id} 
                    to={`/products/${s.product_id}`} 
                    style={{ 
                      display: 'block', 
                      padding: '0.75rem', 
                      background: 'rgba(255,255,255,0.03)', 
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                      border: '1px solid transparent',
                      transition: 'border-color 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-glow)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div style={{ fontWeight: '500', color: 'white' }}>{s.brand}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{s.sub_category}</span>
                      <span style={{ color: 'var(--accent-blue)' }}>${s.price?.toFixed(2)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Forecast */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={24} color="var(--accent-blue)" /> 30-Day Revenue Forecast
            </h2>
            <span className="badge badge-success">ML Model Active</span>
          </div>
          
          <div style={{ height: '400px', width: '100%' }}>
            {forecastLoading ? (
              <div className="skeleton" style={{ height: '100%', width: '100%' }}></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${formatCompact(val)}`} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid var(--border-light)', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: 'var(--accent-blue)' }}
                  />
                  <Line type="monotone" dataKey="predicted_revenue" stroke="url(#colorUvProduct)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--accent-blue)', stroke: 'white', strokeWidth: 2 }} />
                  <defs>
                    <linearGradient id="colorUvProduct" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--accent-blue)" />
                      <stop offset="100%" stopColor="var(--accent-purple)" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
            * This forecast is generated using the Random Forest regression model running on the backend.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
