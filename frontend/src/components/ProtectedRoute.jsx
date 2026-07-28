/*
 * RetailIQ Frontend Application
 * File: ProtectedRoute.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
