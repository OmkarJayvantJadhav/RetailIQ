/*
 * RetailIQ Frontend Application
 * File: Layout.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
