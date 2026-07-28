/*
 * RetailIQ Frontend Application
 * File: Inventory.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Package, AlertTriangle, ChevronLeft, ChevronRight, Edit2, Trash2, Plus, Search, Filter, Box } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Inventory = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const limit = 50;
  const { canWriteOperations, canDelete } = useAuth();
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: summaryData } = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const response = await api.get('/inventory/summary');
      return response.data;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, debouncedSearch, lowStockOnly],
    queryFn: async () => {
      const response = await api.get(`/inventory?skip=${(page - 1) * limit}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}&low_stock=${lowStockOnly}`);
      return response.data;
    },
    keepPreviousData: true
  });

  const inventory = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

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
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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

      {/* KPI Dashboard */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(0, 243, 255, 0.1)', borderRadius: '12px', color: 'var(--accent-blue)' }}>
            <Box size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total SKUs</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{summaryData?.total_skus?.toLocaleString() || 0}</h3>
          </div>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(181, 52, 255, 0.1)', borderRadius: '12px', color: 'var(--accent-purple)' }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Items in Stock</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{summaryData?.total_stock?.toLocaleString() || 0}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Low Stock Alerts</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: summaryData?.low_stock_alerts > 0 ? '#ef4444' : 'inherit' }}>
              {summaryData?.low_stock_alerts || 0}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
            <Filter size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Healthy Stock %</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{summaryData?.healthy_stock_pct || 100}%</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        
        {/* Search & Filter Bar */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search by Product Name or Warehouse ID..."
                className="input-field"
                style={{ paddingLeft: '2.5rem', width: '100%', margin: 0 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              checked={lowStockOnly} 
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '500', color: lowStockOnly ? '#ef4444' : 'var(--text-main)' }}>Show Low Stock Only</span>
          </label>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Warehouse ID</th>
                  <th>Product Details</th>
                  <th style={{ width: '30%' }}>Stock Level</th>
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
                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      <Package size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>No inventory records found.</p>
                      <p style={{ marginTop: '0.5rem' }}>Try adjusting your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const isLowStock = item.stock_quantity <= item.reorder_level;
                    const fillPercent = Math.min(100, Math.max(5, (item.stock_quantity / (item.reorder_level * 3)) * 100));
                    
                    return (
                      <tr key={`${item.warehouse_id}-${item.product_id}`} style={{ transition: 'background 0.2s ease', cursor: canWriteOperations ? 'pointer' : 'default' }} onClick={() => canWriteOperations && navigate(`/inventory/${item.inventory_id}/edit`)}>
                        <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.warehouse_id}</td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'white' }}>{item.product?.name || `Product ${item.product_id}`}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.product?.brand || 'Generic'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: '700', color: isLowStock ? '#ef4444' : '#10b981' }}>{item.stock_quantity.toLocaleString()} in stock</span>
                            <span style={{ color: 'var(--text-muted)' }}>Reorder at {item.reorder_level}</span>
                          </div>
                          <div className="progress-container" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${fillPercent}%`,
                                background: isLowStock ? '#ef4444' : 'var(--accent-blue)',
                                borderRadius: '99px',
                                transition: 'width 0.5s ease'
                              }}
                            ></div>
                          </div>
                        </td>
                        <td>
                          {isLowStock ? (
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem' }}>
                              <AlertTriangle size={14} /> Critical
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem' }}>Optimal</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {canWriteOperations && (
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                                onClick={(e) => { e.stopPropagation(); navigate(`/inventory/${item.inventory_id}/edit`); }}
                                title="Edit Record"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                onClick={(e) => handleDelete(e, item.inventory_id)}
                                title="Delete Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
            Showing {((page - 1) * limit) + (total > 0 ? 1 : 0)} to {Math.min(page * limit, total)} of {total.toLocaleString()} entries
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
