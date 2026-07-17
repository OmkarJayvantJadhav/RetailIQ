import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Package, AlertTriangle, ChevronLeft, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Inventory = () => {
  const [page, setPage] = useState(1);
  const limit = 50;
  const { canWriteOperations, canDelete } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page],
    queryFn: async () => {
      const response = await api.get(`/inventory?skip=${(page - 1) * limit}&limit=${limit}`);
      return response.data;
    },
    keepPreviousData: true
  });

  const inventory = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this inventory record?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Warehouse Inventory</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Real-time stock levels across all distribution centers.</p>
        </div>
        {canWriteOperations && (
          <button className="btn" onClick={() => navigate('/inventory/new')}>
            <Plus size={18} /> Add Inventory
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: '12px 12px 0 0' }}>
          <table>
            <thead>
              <tr>
                <th>Warehouse ID</th>
                <th>Product Brand</th>
                <th>Stock Quantity</th>
                <th>Status</th>
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
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={`${item.warehouse_id}-${item.product_id}`} style={{ transition: 'background 0.2s ease', cursor: canWriteOperations ? 'pointer' : 'default' }} onClick={() => canWriteOperations && navigate(`/inventory/${item.inventory_id}/edit`)}>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.warehouse_id}</td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{item.product?.name || `Product ${item.product_id}`}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.product?.brand}</div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: item.stock_quantity <= item.reorder_level ? '#ef4444' : '#10b981'
                      }}>
                        {item.stock_quantity.toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                        / {item.reorder_level} (Reorder)
                      </span>
                    </td>
                    <td>
                      {item.stock_quantity <= item.reorder_level ? (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-success">Optimal</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {canWriteOperations && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/inventory/${item.inventory_id}/edit`); }}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            onClick={(e) => handleDelete(e, item.inventory_id)}
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

export default Inventory;
