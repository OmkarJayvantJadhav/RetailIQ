/*
 * RetailIQ Frontend Application
 * File: Login.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../api';
import Logo from '../components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role || 'viewer');
      
      // Simulate brief loading for smooth animation before redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err) {
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundImage: 'url("/bg.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Dark overlay to ensure contrast */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(9, 9, 11, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1
      }}></div>

      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        zIndex: 2, 
        padding: '3rem 2.5rem',
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            <Logo size={64} />
          </div>
          <h2 className="page-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', background: 'none', WebkitTextFillColor: 'initial' }}>
            <span style={{ color: 'var(--accent-blue)' }}>Retail</span>
            <span style={{ color: 'white' }}>IQ</span>
          </h2>
          <p className="page-subtitle">Enterprise Analytics Platform</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', 
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem', 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <ShieldCheck size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <User size={20} />
            </div>
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '3rem', height: '3.25rem', fontSize: '1rem' }}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Lock size={20} />
            </div>
            <input
              type="password"
              className="input-field"
              style={{ paddingLeft: '3rem', height: '3.25rem', fontSize: '1rem' }}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ 
              width: '100%', 
              height: '3.25rem',
              marginTop: '0.5rem',
              fontSize: '1rem',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : (
              <>
                Sign In to Platform <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <p>Secure Enterprise Gateway v2.4.1</p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Login;
