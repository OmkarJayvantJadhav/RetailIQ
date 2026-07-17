import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import Orders from './pages/Orders';
import OrderForm from './pages/OrderForm';
import Inventory from './pages/Inventory';
import InventoryForm from './pages/InventoryForm';
import Alerts from './pages/Alerts';
import Admin from './pages/Admin';
import Users from './pages/Users';
import UserForm from './pages/UserForm';

import SalesAnalytics from './pages/analytics/SalesAnalytics';
import CustomerAnalytics from './pages/analytics/CustomerAnalytics';
import MarketAnalytics from './pages/analytics/MarketAnalytics';
import InventoryAnalytics from './pages/analytics/InventoryAnalytics';
import ForecastPage from './pages/analytics/ForecastPage';
import Recommendations from './pages/analytics/Recommendations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    }
  }
});

function RequireWrite({ children }) {
  const { canWrite } = useAuth();
  return canWrite ? children : <Navigate to="/dashboard" replace />;
}

function RequireAdmin({ children }) {
  const { canManageSystem } = useAuth();
  return canManageSystem ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Analytics */}
            <Route path="/analytics/sales" element={<SalesAnalytics />} />
            <Route path="/analytics/customers" element={<CustomerAnalytics />} />
            <Route path="/analytics/market" element={<MarketAnalytics />} />
            <Route path="/analytics/inventory" element={<InventoryAnalytics />} />
            <Route path="/analytics/forecast" element={<ForecastPage />} />
            <Route path="/analytics/recommendations" element={<Recommendations />} />

            {/* Operations */}
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<RequireWrite><OrderForm /></RequireWrite>} />
            <Route path="/orders/:id/edit" element={<RequireWrite><OrderForm /></RequireWrite>} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/new" element={<RequireWrite><CustomerForm /></RequireWrite>} />
            <Route path="/customers/:id/edit" element={<RequireWrite><CustomerForm /></RequireWrite>} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<RequireWrite><ProductForm /></RequireWrite>} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/edit" element={<RequireWrite><ProductForm /></RequireWrite>} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/new" element={<RequireWrite><InventoryForm /></RequireWrite>} />
            <Route path="/inventory/:id/edit" element={<RequireWrite><InventoryForm /></RequireWrite>} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
            <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
            <Route path="/users/new" element={<RequireAdmin><UserForm /></RequireAdmin>} />
            <Route path="/users/:id/edit" element={<RequireAdmin><UserForm /></RequireAdmin>} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
