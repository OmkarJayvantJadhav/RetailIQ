import React, { useState } from 'react';
import api from '../api';

const Admin = () => {
  const [table, setTable] = useState('products');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage('Please select a file.');
    
    setLoading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('table_name', table);
    formData.append('file', file);
    
    try {
      const response = await api.post('/upload/data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`Success: ${response.data.message}`);
      setFile(null);
      e.target.reset();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const instructions = {
    products: "Expected columns: product_id (optional for new products), name, category, sub_category, brand, price, cost_price, is_active. The system will update existing products if product_id matches, otherwise it creates new records.",
    customers: "Expected columns: customer_id (optional for new customers), first_name, last_name, email, phone, age, gender, city, state, income_level, is_active. The system will update existing customers if customer_id matches."
  };

  return (
    <div>
      <h1 className="page-title">Admin Settings</h1>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>System configuration and data management</p>
      
      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        <h3>Platform Configuration</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>API Base URL</label>
            <input type="text" className="input-field" defaultValue="http://127.0.0.1:8000" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Forecasting Threshold</label>
            <input type="number" className="input-field" defaultValue={0.8} />
          </div>
          <button className="btn">Save Settings</button>
        </div>
      </div>
      
      <div className="glass-panel" style={{ maxWidth: '600px', marginTop: '2rem' }}>
        <h3>Bulk Data Import</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          Upload a CSV or Excel file to automatically add or update records in the database.
        </p>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Target Table</label>
            <select className="input-field" value={table} onChange={(e) => setTable(e.target.value)}>
              <option value="products">Products</option>
              <option value="customers">Customers</option>
            </select>
          </div>
          
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Format Instructions</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#f8fafc' }}>
              {instructions[table]}
            </p>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Select File (.csv, .xlsx)</label>
            <input type="file" accept=".csv, .xlsx" className="input-field" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          
          <button type="submit" className="btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Processing...' : 'Upload & Process'}
          </button>
          
          {message && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: message.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.startsWith('Error') ? '#f87171' : '#34d399', fontSize: '0.9rem' }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Admin;
