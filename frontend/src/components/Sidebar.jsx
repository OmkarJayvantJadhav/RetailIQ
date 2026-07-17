import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Archive, Bell, Settings, LogOut, Hexagon,
  TrendingUp, Users, MapPin, BarChart2, Lightbulb, Activity, User, ShoppingBag, Menu, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';

const NavGroup = ({ label, children }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <p style={{
      fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: '0.12em', color: 'var(--text-muted)',
      padding: '0.75rem 1rem 0.25rem', opacity: 0.7
    }}>{label}</p>
    {children}
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canManageSystem } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navLink = (to, Icon, label) => (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
      <Icon size={18} /> <span style={{ flex: 1 }}>{label}</span>
    </NavLink>
  );

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}
      <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ overflowY: 'auto' }}>
      <div
        onClick={() => navigate('/')}
        style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', cursor: 'pointer', textDecoration: 'none' }}
        title="Go to Home"
      >
        <div style={{
          padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Logo size={36} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.025em' }}>
            <span style={{ color: 'var(--accent-blue)' }}>Retail</span>
            <span style={{ color: 'white' }}>IQ</span>
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</span>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <NavGroup label="Overview">
          {navLink('/dashboard', LayoutDashboard, 'Dashboard')}
        </NavGroup>

        <NavGroup label="Analytics">
          {navLink('/analytics/sales', TrendingUp, 'Sales Analytics')}
          {navLink('/analytics/customers', Users, 'Customer Analytics')}
          {navLink('/analytics/market', MapPin, 'Market Analytics')}
          {navLink('/analytics/inventory', BarChart2, 'Inventory Analytics')}
          {navLink('/analytics/forecast', Activity, 'Demand Forecast')}
          {navLink('/analytics/recommendations', Lightbulb, 'Recommendations')}
        </NavGroup>

        <NavGroup label="Operations">
          <NavLink to="/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShoppingBag size={18} /> <span style={{ flex: 1 }}>Orders</span>
          </NavLink>
          {navLink('/customers', User, 'Customers')}
          {navLink('/products', Package, 'Products')}
          {navLink('/inventory', Archive, 'Inventory')}
          {navLink('/alerts', Bell, 'Alerts')}
        </NavGroup>

        {canManageSystem && (
          <NavGroup label="System">
            {navLink('/users', Users, 'User Management')}
            {navLink('/admin', Settings, 'Admin Panel')}
          </NavGroup>
        )}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
        >
          <LogOut size={18} color="#ef4444" />
          <span style={{ color: '#ef4444', fontWeight: '500' }}>Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
