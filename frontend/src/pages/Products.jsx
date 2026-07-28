/*
 * RetailIQ Frontend Application
 * File: Products.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Search, Tag, DollarSign, Fingerprint, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Products = () => {
  const [page, setPage] = useState(1);
  const limit = 50;
  const { canWriteProducts, canDelete } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: async () => {
      const response = await api.get(`/products?skip=${(page - 1) * limit}&limit=${limit}`);
      return response.data;
    },
    keepPreviousData: true
  });

  const products = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Product Catalog</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage and view all registered items in your catalog.</p>
        </div>
        {canWriteProducts && (
          <button className="btn" onClick={() => navigate('/products/new')}>
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search products..." className="input-field" style={{ margin: 0, paddingLeft: '2.75rem', background: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <div className="table-responsive">
<table>
            <thead>
              <tr>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Fingerprint size={14} /> ID</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={14} /> Product Name</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={14} /> Category</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={14} /> Price</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>Actions</div></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5" style={{ padding: '1rem' }}>
                      <div className="skeleton" style={{ height: '2.5rem', width: '100%' }}></div>
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.product_id} 
                    style={{ transition: 'background 0.2s ease', cursor: canWriteProducts ? 'pointer' : 'default' }}
                    onClick={() => canWriteProducts && navigate(`/products/${product.product_id}`)}
                  >
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{product.product_id}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'white' }}>{product.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{product.brand}</div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ marginBottom: '0.25rem', display: 'inline-block' }}>{product.category}</span>
                      <br/>
                      <span className="badge badge-success">{product.sub_category}</span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>
                      {new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(product.price)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {canWriteProducts && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.product_id}/edit`); }}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            onClick={(e) => handleDelete(e, product.product_id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
</div>
        </div>

        {/* Pagination Controls */}
        <div style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid var(--border-light)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total.toLocaleString()} entries
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '0.4rem 0.75rem', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              minWidth: '2.5rem', fontWeight: '600', color: 'var(--text-main)' 
            }}>
              {page}
            </div>
            <button 
              className="btn-secondary" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              style={{ padding: '0.4rem 0.75rem', opacity: (page === totalPages || totalPages === 0) ? 0.5 : 1, cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
