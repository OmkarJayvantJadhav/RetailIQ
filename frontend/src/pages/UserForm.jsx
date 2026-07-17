import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Save, ArrowLeft } from 'lucide-react';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'viewer',
    password: '',
    is_active: true
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'viewer',
        password: '', // Password is not returned and only required for creation
        is_active: user.is_active
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        // We do not send password or username on update (unless specifically supporting username changes)
        const { email, full_name, role, is_active } = data;
        return await api.put(`/users/${id}`, { email, full_name, role, is_active });
      } else {
        return await api.post('/users', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to save user');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (isEdit && isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/users')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{isEdit ? 'Edit User' : 'Create User'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{isEdit ? `Manage account details for ${user?.username}` : 'Add a new team member to the platform.'}</p>
        </div>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required={!isEdit} disabled={isEdit} className="input-field" placeholder="Username" />
            {isEdit && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Username cannot be changed after creation.</span>}
          </div>

          {!isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-field" placeholder="Temporary password" />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Full Name</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="input-field" placeholder="e.g. John Doe" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="john@example.com" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required className="input-field">
              <option value="viewer">Viewer (Read Only)</option>
              <option value="manager">Manager (Edit Data)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} />
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Account is Active</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/users')}>Cancel</button>
            <button type="submit" className="btn" disabled={mutation.isLoading}>
              <Save size={18} /> {mutation.isLoading ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
