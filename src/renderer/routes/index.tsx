import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { SettingsPage } from './SettingsPage';
import { ProductsPage } from './ProductsPage';
import { InventoryPage } from './InventoryPage';
import { PurchasingPage } from './PurchasingPage';
import { SuppliersPage } from './SuppliersPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Desktop Application Shell */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="purchasing" element={<PurchasingPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
