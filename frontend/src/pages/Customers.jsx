import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Search, User, MapPin, Briefcase, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Customers = () => {
  const [page, setPage] = useState(1);
  const limit = 50;
  const { canWriteOperations, canDelete } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page],
    queryFn: async () => {
      const response = await api.get(`/customers?skip=${(page - 1) * limit}&limit=${limit}`);
      return response.data;
    },
    keepPreviousData: true
  });

  const customers = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to deactivate this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>Customers</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage your customer base and view their details.</p>
        </div>
        {canWriteOperations && (
          <button className="btn" onClick={() => navigate('/customers/new')}>
            <Plus size={18} /> Add Customer
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search customers..." className="input-field" style={{ margin: 0, paddingLeft: '2.75rem', background: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table>
            <thead>
              <tr>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} /> Name</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Contact</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> Location</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={14} /> Income Level</div></th>
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
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.customer_id} style={{ transition: 'background 0.2s ease', cursor: canWriteOperations ? 'pointer' : 'default' }}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'white' }}>{customer.first_name} {customer.last_name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>ID: #{customer.customer_id}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-main)' }}>{customer.email || 'N/A'}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{customer.phone || 'N/A'}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-main)' }}>{customer.city}</span>
                      <br/>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{customer.state}</span>
                    </td>
                    <td>
                      <span className={`badge ${customer.income_level === 'Premium' ? 'badge-warning' : 'badge-info'}`}>
                        {customer.income_level}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {canWriteOperations && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer.customer_id}/edit`); }}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            onClick={(e) => handleDelete(e, customer.customer_id)}
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

export default Customers;
