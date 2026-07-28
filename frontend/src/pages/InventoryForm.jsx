/*
 * RetailIQ Frontend Application
 * File: InventoryForm.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Save, ArrowLeft } from 'lucide-react';

const InventoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    warehouse_id: 'WH-MUM-01',
    product_id: '',
    stock_quantity: 0,
    reorder_level: 10,
    safety_stock: 5,
    last_restocked: new Date().toISOString().split('T')[0],
  });

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory_item', id],
    queryFn: async () => {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        warehouse_id: item.warehouse_id || '',
        product_id: item.product_id || '',
        stock_quantity: item.stock_quantity || 0,
        reorder_level: item.reorder_level || 10,
        safety_stock: item.safety_stock || 5,
        last_restocked: item.last_restocked ? item.last_restocked.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [item]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { 
        ...data, 
        product_id: parseInt(data.product_id),
        stock_quantity: parseInt(data.stock_quantity),
        reorder_level: parseInt(data.reorder_level),
        safety_stock: parseInt(data.safety_stock)
      };
      
      if (isEdit) {
        // Exclude warehouse_id and product_id on update
        const { stock_quantity, reorder_level, safety_stock, last_restocked } = payload;
        return await api.put(`/inventory/${id}`, { stock_quantity, reorder_level, safety_stock, last_restocked });
      } else {
        return await api.post('/inventory', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      navigate('/inventory');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isEdit && isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/inventory')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{isEdit ? 'Adjust Inventory' : 'Add Inventory Record'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{isEdit ? `Editing Record #${id}` : 'Create a new stock tracking record.'}</p>
        </div>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Warehouse ID</label>
              <select name="warehouse_id" value={formData.warehouse_id} onChange={handleChange} disabled={isEdit} required className="input-field">
                <option value="WH-MUM-01">Mumbai Central (WH-MUM-01)</option>
                <option value="WH-DEL-01">Delhi North (WH-DEL-01)</option>
                <option value="WH-BLR-01">Bangalore South (WH-BLR-01)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Product ID</label>
              <input type="number" name="product_id" value={formData.product_id} onChange={handleChange} disabled={isEdit} required className="input-field" placeholder="Enter Product ID" />
            </div>
          </div>

          <div className="form-grid-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Stock Quantity</label>
              <input type="number" min="0" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required className="input-field" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Reorder Level</label>
              <input type="number" min="0" name="reorder_level" value={formData.reorder_level} onChange={handleChange} required className="input-field" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Safety Stock</label>
              <input type="number" min="0" name="safety_stock" value={formData.safety_stock} onChange={handleChange} required className="input-field" />
            </div>
          </div>

          <div className="form-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Last Restocked Date</label>
              <input type="date" name="last_restocked" value={formData.last_restocked} onChange={handleChange} required className="input-field" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/inventory')}>Cancel</button>
            <button type="submit" className="btn" disabled={mutation.isLoading}>
              <Save size={18} /> {mutation.isLoading ? 'Saving...' : 'Save Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;
