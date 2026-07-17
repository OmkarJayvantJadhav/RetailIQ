import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Search, ShoppingBag, MapPin, DollarSign, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Orders = () => {
  const [page, setPage] = useState(1);
  const limit = 50;
  const [statusFilter, setStatusFilter] = useState('');
  const { canWriteOperations, canDelete } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: async () => {
      let url = `/orders?skip=${(page - 1) * limit}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const response = await api.get(url);
      return response.data;
    },
    keepPreviousData: true
  });

  const orders = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to completely delete this order?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Orders</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>View and manage customer orders and statuses.</p>
        </div>
        {canWriteOperations && (
          <button className="btn" onClick={() => navigate('/orders/new')}>
            <Plus size={18} /> Create Order
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field" 
            style={{ width: '200px' }}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table>
            <thead>
              <tr>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingBag size={14} /> Order</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /> Date</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Customer</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Status</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={14} /> Total</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>Actions</div></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="6" style={{ padding: '1rem' }}>
                      <div className="skeleton" style={{ height: '2.5rem', width: '100%' }}></div>
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.order_id} style={{ transition: 'background 0.2s ease', cursor: canWriteOperations ? 'pointer' : 'default' }} onClick={() => canWriteOperations && navigate(`/orders/${order.order_id}/edit`)}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>#{order.order_id}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'white' }}>{order.customer?.first_name} {order.customer?.last_name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{order.shipping_city}, {order.shipping_state}</div>
                    </td>
                    <td>
                      <span className={`badge ${order.status === 'completed' ? 'badge-success' : order.status === 'cancelled' ? 'badge-warning' : 'badge-info'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>
                      ₹{parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {canWriteOperations && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.order_id}/edit`); }}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            onClick={(e) => handleDelete(e, order.order_id)}
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

export default Orders;
