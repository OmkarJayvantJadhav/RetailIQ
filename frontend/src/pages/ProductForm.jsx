import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    sub_category: '',
    price: '',
    cost_price: '',
    is_active: true
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        sub_category: product.sub_category || '',
        price: product.price || '',
        cost_price: product.cost_price || '',
        is_active: product.is_active
      });
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Convert strings to floats
      const payload = { ...data, price: parseFloat(data.price), cost_price: parseFloat(data.cost_price) };
      if (isEdit) {
        return await api.put(`/products/${id}`, payload);
      } else {
        return await api.post('/products', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      navigate('/products');
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/products')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{isEdit ? `Editing Product #${id}` : 'Create a new product in the catalog.'}</p>
        </div>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" placeholder="e.g., Boat Rockerz 450" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Brand</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleChange} required className="input-field" placeholder="e.g., Boat" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required className="input-field">
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Groceries">Groceries</option>
                <option value="Apparel">Apparel</option>
                <option value="Beauty">Beauty</option>
                <option value="Home">Home</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Sub-Category</label>
              <input type="text" name="sub_category" value={formData.sub_category} onChange={handleChange} className="input-field" placeholder="e.g., Headphones" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Selling Price (₹)</label>
              <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="input-field" placeholder="0.00" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Cost Price (₹)</label>
              <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} required className="input-field" placeholder="0.00" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} />
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Product is Active</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>Cancel</button>
            <button type="submit" className="btn" disabled={mutation.isLoading}>
              <Save size={18} /> {mutation.isLoading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
