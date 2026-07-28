/*
 * RetailIQ Frontend Application
 * File: Users.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Search, User as UserIcon, Mail, Shield, ShieldOff, ChevronLeft, ChevronRight, Edit2, Trash2, Key, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Users = () => {
  const [page, setPage] = useState(1);
  const limit = 50;
  const { canManageSystem, canDelete } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const response = await api.get(`/users?skip=${(page - 1) * limit}&limit=${limit}`);
      return response.data;
    },
    keepPreviousData: true
  });

  const users = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to deactivate user');
    }
  });

  const handleDelete = (e, id, username) => {
    e.stopPropagation();
    if(username === 'admin') {
      alert('Cannot deactivate the root admin account.');
      return;
    }
    if(window.confirm('Are you sure you want to deactivate this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: async ({id, password}) => await api.put(`/users/${id}`, { password }),
    onSuccess: () => {
      alert("Password updated successfully!");
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to update password');
    }
  });

  const handleChangePassword = (e, id, username) => {
    e.stopPropagation();
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (newPassword) {
      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }
      changePasswordMutation.mutate({ id, password: newPassword });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage team members, roles, and access controls.</p>
        </div>
        {canManageSystem && (
          <button className="btn" onClick={() => navigate('/users/new')}>
            <Plus size={18} /> Add User
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: '12px 12px 0 0' }}>
          <div className="table-responsive">
<table>
            <thead>
              <tr>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserIcon size={14} /> User</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> Email</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={14} /> Role</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Status</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>Actions</div></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5" style={{ padding: '1rem' }}>
                      <div className="skeleton" style={{ height: '2.5rem', width: '100%' }}></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id} style={{ transition: 'background 0.2s ease', cursor: canManageSystem ? 'pointer' : 'default' }} onClick={() => canManageSystem && navigate(`/users/${user.user_id}/edit`)}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'white' }}>{user.full_name || user.username}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                    </td>
                    <td style={{ color: 'var(--text-main)' }}>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-warning' : (user.role === 'analyst' || user.role === 'manager') ? 'badge-info' : 'badge-success'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.is_active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                          <Shield size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: '500' }}>
                          <ShieldOff size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {canManageSystem && (
                          <>
                            <button 
                              className="btn-secondary" 
                              title="Change Password"
                              style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}
                              onClick={(e) => handleChangePassword(e, user.user_id, user.username)}
                            >
                              <Lock size={16} />
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)' }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/users/${user.user_id}/edit`); }}
                            >
                              <Edit2 size={16} />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            onClick={(e) => handleDelete(e, user.user_id, user.username)}
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

        {/* Pagination */}
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

export default Users;
