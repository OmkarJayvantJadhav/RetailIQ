import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    shipping_city: '',
    shipping_state: '',
    items: []
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (order) {
      setFormData({
        customer_id: order.customer_id || '',
        order_date: order.order_date ? order.order_date.split('T')[0] : '',
        status: order.status || 'completed',
        shipping_city: order.shipping_city || '',
        shipping_state: order.shipping_state || '',
        items: [] // In MVP, editing items is not supported, just status
      });
    }
  }, [order]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        // Exclude items and customer_id when updating
        const { status, shipping_city, shipping_state } = data;
        return await api.put(`/orders/${id}`, { status, shipping_city, shipping_state });
      } else {
        return await api.post('/orders', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      navigate('/orders');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEdit && formData.items.length === 0) {
      alert("Please add at least one line item to the order.");
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = field === 'quantity' ? parseInt(value) : parseInt(value);
      return { ...prev, items: newItems };
    });
  };

  if (isEdit && isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/orders')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{isEdit ? 'Edit Order' : 'Create Manual Order'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{isEdit ? `Update status for Order #${id}` : 'Process a new customer order manually.'}</p>
        </div>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isEdit && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Customer ID</label>
                <input type="number" name="customer_id" value={formData.customer_id} onChange={handleChange} required className="input-field" placeholder="Enter Customer ID" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Order Date</label>
                <input type="date" name="order_date" value={formData.order_date} onChange={handleChange} required className="input-field" />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="input-field">
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Shipping City</label>
              <input type="text" name="shipping_city" value={formData.shipping_city} onChange={handleChange} required className="input-field" placeholder="City" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Shipping State</label>
              <input type="text" name="shipping_state" value={formData.shipping_state} onChange={handleChange} required className="input-field" placeholder="State" />
            </div>
          </div>

          {!isEdit && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
                <h3 style={{ fontWeight: '600' }}>Line Items</h3>
                <button type="button" className="btn-secondary" onClick={addItem} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  <Plus size={16} /> Add Item
                </button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Product ID</label>
                    <input type="number" value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} required className="input-field" placeholder="ID" />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantity</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required className="input-field" />
                  </div>
                  <button type="button" onClick={() => removeItem(index)} style={{ marginTop: '1.2rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {formData.items.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No items added. Click 'Add Item' to build the order.</p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/orders')}>Cancel</button>
            <button type="submit" className="btn" disabled={mutation.isLoading}>
              <Save size={18} /> {mutation.isLoading ? 'Saving...' : 'Save Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
